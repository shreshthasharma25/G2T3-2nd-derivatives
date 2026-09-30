import { calculateUrgencyScore } from '../utils/urgencyScore';
import { initialSeedGrievances } from '../data/seedGrievances';

const GRIEVANCES_KEY = 'portal_grievances';

export const grievanceService = {
  getAllGrievances: () => {
    let data = localStorage.getItem(GRIEVANCES_KEY);
    let grievances = [];

    // Auto-seed if empty or not set
    if (!data) {
      grievances = [...initialSeedGrievances];
      localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
      return grievances;
    }

    try {
      grievances = JSON.parse(data) || [];
      if (!Array.isArray(grievances) || grievances.length === 0) {
        grievances = [...initialSeedGrievances];
        localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
        return grievances;
      }
    } catch {
      grievances = [...initialSeedGrievances];
      localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
      return grievances;
    }

    let modified = false;
    grievances.forEach(g => {
      if (g.status && g.status !== g.status.toUpperCase()) {
        g.status = g.status.toUpperCase();
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
    }
    return grievances;
  },

  saveAllGrievances: (grievances) => {
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
  },

  getGrievanceById: (id) => {
    const grievances = grievanceService.getAllGrievances();
    return grievances.find(g => g.id === id);
  },

  getGrievancesForCitizen: (citizenId) => {
    const grievances = grievanceService.getAllGrievances();
    return grievances.filter(g => g.citizenId === citizenId);
  },

  createGrievance: (data, citizen) => {
    const grievances = grievanceService.getAllGrievances();
    
    // Calculate initial area concentration based on existing grievances in same area
    const similarComplaints = grievances.filter(g => 
      g.location === data.location && 
      g.categoryId === data.categoryId &&
      g.status !== 'RESOLVED' && g.status !== 'CLOSED'
    ).length;

    let popImpact = 'Medium';
    const locLower = (data.location || '').toLowerCase();
    if (locLower.includes('salt lake') || locLower.includes('howrah') || locLower.includes('park street')) {
      popImpact = 'High';
    } else if (locLower.includes('ballygunge') || locLower.includes('dum dum')) {
      popImpact = 'Low';
    }

    const urgency = calculateUrgencyScore({
      severity: data.severity,
      complaintConcentration: similarComplaints,
      populationImpact: popImpact,
      recurrence: similarComplaints > 0 ? 1 : 0
    });

    const newGrievance = {
      ...data,
      id: `GRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      citizenId: citizen?.id || 'CIT-GUEST',
      citizenName: citizen?.name || 'Citizen Report',
      citizenEmail: citizen?.email || 'citizen@portal.gov',
      citizenMobile: citizen?.mobile || '',
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      assignedDepartment: null,
      assignedHandler: null,
      similarComplaints,
      populationImpact: popImpact,
      urgencyScore: urgency,
      updates: [
        {
          id: Date.now().toString(),
          type: 'status',
          status: 'SUBMITTED',
          message: 'Your grievance was submitted successfully.',
          sender: 'System',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    grievances.unshift(newGrievance);
    grievanceService.saveAllGrievances(grievances);
    return newGrievance;
  },

  addGrievanceUpdate: (id, updateData) => {
    const grievances = grievanceService.getAllGrievances();
    const index = grievances.findIndex(g => g.id === id);
    if (index !== -1) {
      const g = grievances[index];
      const oldStatus = g.status;
      
      if (updateData.status) g.status = updateData.status;
      if (updateData.assignedDepartment) g.assignedDepartment = updateData.assignedDepartment;
      if (updateData.assignedHandler) g.assignedHandler = updateData.assignedHandler;
      if (updateData.resolutionNote) g.resolutionNote = updateData.resolutionNote;
      if (updateData.resolutionPhotoUrl) g.resolutionPhotoUrl = updateData.resolutionPhotoUrl;
      if (updateData.resolvedAt) g.resolvedAt = updateData.resolvedAt;
      if (updateData.resolvedBy) g.resolvedBy = updateData.resolvedBy;

      g.updates = g.updates || [];
      g.updates.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: updateData.type || 'message',
        status: g.status,
        message: updateData.message,
        sender: updateData.sender || 'Grievance Handler',
        timestamp: new Date().toISOString(),
        photoUrl: updateData.photoUrl || updateData.resolutionPhotoUrl || null
      });
      
      grievanceService.saveAllGrievances(grievances);
      return g;
    }
    return null;
  },

  /**
   * Batch resolves all individual citizen complaints in a problem cluster.
   * Updates their status to RESOLVED and records completion note, photo, and timestamp.
   */
  resolveProblemCluster: (reportIds = [], resolutionData = {}) => {
    const grievances = grievanceService.getAllGrievances();
    const timestamp = new Date().toISOString();
    const handlerName = resolutionData.handlerName || 'Field Operations Team';
    const note = resolutionData.note || 'Issue inspected and resolved on site.';
    const photoUrl = resolutionData.photoUrl || null;

    let updatedCount = 0;
    grievances.forEach(g => {
      if (reportIds.includes(g.id)) {
        g.status = 'RESOLVED';
        g.resolvedAt = timestamp;
        g.resolvedBy = handlerName;
        g.resolutionNote = note;
        g.resolutionPhotoUrl = photoUrl;
        
        g.updates = g.updates || [];
        g.updates.push({
          id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'status',
          status: 'RESOLVED',
          message: `Field work complete: ${note}`,
          sender: handlerName,
          timestamp,
          photoUrl
        });
        updatedCount++;
      }
    });

    grievanceService.saveAllGrievances(grievances);
    return updatedCount;
  },

  /**
   * Batch updates status (e.g. IN_PROGRESS, ASSIGNED) for all reports in a cluster.
   */
  updateClusterStatus: (reportIds = [], newStatus, message, handlerName = 'Field Operations') => {
    const grievances = grievanceService.getAllGrievances();
    const timestamp = new Date().toISOString();

    let updatedCount = 0;
    grievances.forEach(g => {
      if (reportIds.includes(g.id)) {
        g.status = newStatus;
        if (newStatus === 'IN_PROGRESS' || newStatus === 'ASSIGNED') {
          g.assignedHandler = handlerName;
        }

        g.updates = g.updates || [];
        g.updates.push({
          id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'status',
          status: newStatus,
          message: message || `Status updated to ${newStatus}`,
          sender: handlerName,
          timestamp
        });
        updatedCount++;
      }
    });

    grievanceService.saveAllGrievances(grievances);
    return updatedCount;
  },

  // Helper to reset grievances to initial seed
  resetToSeed: () => {
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(initialSeedGrievances));
    return initialSeedGrievances;
  },

  clearAllGrievances: () => {
    localStorage.removeItem(GRIEVANCES_KEY);
  }
};
