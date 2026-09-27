const STORAGE_KEY = 'citizen_grievances';

export const getCitizenGrievances = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getGrievanceById = (id) => {
  const grievances = getCitizenGrievances();
  return grievances.find(g => g.id === id);
};

export const saveGrievance = (grievanceData) => {
  const grievances = getCitizenGrievances();
  const newGrievance = {
    ...grievanceData,
    id: grievanceData.id || `GRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    updates: [
      {
        id: 1,
        date: new Date().toISOString(),
        status: 'SUBMITTED',
        message: 'Grievance submitted successfully and is pending review.'
      }
    ]
  };
  grievances.unshift(newGrievance);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grievances));
  return newGrievance;
};

export const updateGrievance = (id, updates) => {
  const grievances = getCitizenGrievances();
  const index = grievances.findIndex(g => g.id === id);
  if (index !== -1) {
    grievances[index] = { ...grievances[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grievances));
    return grievances[index];
  }
  return null;
};
