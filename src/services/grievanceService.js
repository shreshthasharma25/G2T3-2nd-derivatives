import { calculateUrgencyScore } from '../utils/urgencyScore';

const GRIEVANCES_KEY = 'portal_grievances';
const DEMO_CLEANED_KEY = 'portal_demo_data_purged_v1';

export const grievanceService = {
  getAllGrievances: () => {
    // If legacy demo data has not been purged from local storage, clean it once
    if (!localStorage.getItem(DEMO_CLEANED_KEY)) {
      localStorage.setItem(DEMO_CLEANED_KEY, 'true');
      let existing = [];
      try {
        const raw = localStorage.getItem(GRIEVANCES_KEY);
        existing = raw ? JSON.parse(raw) : [];
      } catch {
        existing = [];
      }
      // Purge any pre-populated demo complaints (IDs like GRV-2026-101... or citizenId CIT-10...)
      const userOnly = Array.isArray(existing)
        ? existing.filter(g => !g.id?.startsWith('GRV-2026-101') && !g.citizenId?.startsWith('CIT-10'))
        : [];
      localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(userOnly));
      return userOnly;
    }

    const data = localStorage.getItem(GRIEVANCES_KEY);
    if (!data) {
      return [];
    }

    try {
      const grievances = JSON.parse(data);
      if (!Array.isArray(grievances)) {
        return [];
      }

      // Filter out any legacy demo records
      const cleanGrievances = grievances.filter(
        g => !g.id?.startsWith('GRV-2026-101') && !g.citizenId?.startsWith('CIT-10')
      );

      let modified = false;
      cleanGrievances.forEach(g => {
        if (g.status && g.status !== g.status.toUpperCase()) {
          g.status = g.status.toUpperCase();
          modified = true;
        }
      });
      if (modified || cleanGrievances.length !== grievances.length) {
        localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(cleanGrievances));
      }
      return cleanGrievances;
    } catch {
      return [];
    }
  },

  saveAllGrievances: (grievances) => {
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances || []));
  },

  deleteGrievance: async (id, currentUser = null) => {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new Error("Complaint ID is required and must be a valid string.");
    }

    const cleanId = id.trim();
    const grievances = grievanceService.getAllGrievances();
    const target = grievances.find(g => g.id === cleanId);

    if (!target) {
      throw new Error(`Complaint with ID "${cleanId}" not found.`);
    }

    // Role-based authorization check
    if (currentUser) {
      const isHandlerOrAdmin = currentUser.role === 'handler' || currentUser.role === 'admin';
      const isOwner = currentUser.role === 'citizen' && currentUser.id === target.citizenId;

      if (!isHandlerOrAdmin && !isOwner) {
        throw new Error("Unauthorized: Only authorized grievance handlers, administrators, or the original submitter can delete this complaint.");
      }
    }

    // Permanently remove from local storage
    const filtered = grievances.filter(g => g.id !== cleanId);
    grievanceService.saveAllGrievances(filtered);

    // Synchronize deletion with FastAPI / Supabase backend if reachable
    try {
      await fetch(`http://localhost:8000/complaints/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'handler',
          'x-user-id': currentUser?.id || '',
        },
      });
    } catch {
      // Backend service offline in dev environment; local state successfully updated
    }

    return {
      success: true,
      message: "Complaint deleted successfully.",
      deletedId: cleanId,
    };
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

    const coordinates = data.coordinates || (data.latitude && data.longitude ? [Number(data.latitude), Number(data.longitude)] : null);

    const newGrievance = {
      ...data,
      id: `GRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      citizenId: citizen?.id || 'CIT-GUEST',
      citizenName: citizen?.name || 'Citizen Report',
      citizenEmail: citizen?.email || 'citizen@portal.gov',
      citizenMobile: citizen?.mobile || '',
      coordinates,
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

  // Export current grievances to CSV formatted for the analysis module
  exportGrievancesAsCSV: () => {
    const grievances = grievanceService.getAllGrievances();
    if (!grievances || grievances.length === 0) return '';

    const categoryMap = {
      'roads': 'Road / Infrastructure',
      'sanitation': 'Garbage / Waste',
      'water': 'Water',
      'drainage': 'Water',
      'electricity': 'Electricity / Streetlight',
      'street_lighting': 'Electricity / Streetlight',
      'public_safety': 'Crime / Safety',
      'transport': 'Road / Infrastructure',
      'other': 'Other'
    };

    const deptMap = {
      'Road / Infrastructure': 'Public Works Department',
      'Garbage / Waste': 'Municipality',
      'Water': 'Water Department',
      'Electricity / Streetlight': 'Electricity Department',
      'Crime / Safety': 'Police',
      'Other': 'General Department'
    };

    const priorityMap = {
      'Critical': 'High',
      'High': 'High',
      'Moderate': 'Medium',
      'Low': 'Low'
    };

    const header = ['id', 'description', 'location', 'category', 'priority', 'department', 'status'];
    const rows = grievances.map(g => {
      const cat = categoryMap[g.categoryId] || 'Other';
      const pri = priorityMap[g.severity] || 'Medium';
      const dept = deptMap[cat] || 'General Department';
      const status = g.status === 'RESOLVED' ? 'Resolved' : g.status === 'IN_PROGRESS' ? 'In Progress' : 'Submitted';
      const desc = `"${(g.description || g.title || '').replace(/"/g, '""')}"`;
      const loc = `"${(g.location || 'Unknown').replace(/"/g, '""')}"`;
      return [g.id, desc, loc, `"${cat}"`, pri, `"${dept}"`, status].join(',');
    });

    return [header.join(','), ...rows].join('\n');
  },

  resetToSeed: () => {
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify([]));
    return [];
  },

  clearAllGrievances: () => {
    localStorage.removeItem(GRIEVANCES_KEY);
  }
};
