import { calculateUrgencyScore } from '../utils/urgencyScore';

const GRIEVANCES_KEY = 'portal_grievances';

export const grievanceService = {
  getAllGrievances: () => {
    const data = localStorage.getItem(GRIEVANCES_KEY);
    const grievances = data ? JSON.parse(data) : [];
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

    // Use mock population impact logic based on location (Prototype only)
    let popImpact = 'Medium';
    const locLower = data.location.toLowerCase();
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
      citizenId: citizen.id,
      citizenName: citizen.name,
      citizenEmail: citizen.email,
      citizenMobile: citizen.mobile,
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

      g.updates.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: updateData.type || 'message',
        status: g.status,
        message: updateData.message,
        sender: updateData.sender || 'Grievance Handler',
        timestamp: new Date().toISOString()
      });
      
      // If status changed to RESOLVED or CLOSED, recalculate urgency for other active issues in the same location
      if (oldStatus !== g.status && (g.status === 'RESOLVED' || g.status === 'CLOSED')) {
        const location = g.location;
        const categoryId = g.categoryId;
        
        // Find how many active ones remain for this location/category
        const similarComplaints = grievances.filter(other => 
          other.location === location && 
          other.categoryId === categoryId &&
          other.status !== 'RESOLVED' && 
          other.status !== 'CLOSED'
        ).length;
        
        // Update all active ones in that location/category
        grievances.forEach(other => {
          if (other.location === location && other.categoryId === categoryId && other.status !== 'RESOLVED' && other.status !== 'CLOSED') {
            other.similarComplaints = similarComplaints;
            other.urgencyScore = calculateUrgencyScore({
              severity: other.severity,
              complaintConcentration: similarComplaints,
              populationImpact: other.populationImpact,
              recurrence: similarComplaints > 0 ? 1 : 0
            });
          }
        });
      }

      grievanceService.saveAllGrievances(grievances);
      return g;
    }
    return null;
  },

  // Helper to clear grievances for reset/testing
  clearAllGrievances: () => {
    localStorage.removeItem(GRIEVANCES_KEY);
  }
};
