export const grievanceCategories = [
  { id: 'roads', name: 'Roads & Infrastructure', icon: 'Map' },
  { id: 'water', name: 'Water Supply', icon: 'Droplet' },
  { id: 'electricity', name: 'Electricity', icon: 'Zap' },
  { id: 'sanitation', name: 'Sanitation & Waste', icon: 'Trash2' },
  { id: 'street_lighting', name: 'Street Lighting', icon: 'Lightbulb' },
  { id: 'public_safety', name: 'Public Safety', icon: 'ShieldAlert' },
  { id: 'environment', name: 'Environment', icon: 'Leaf' },
  { id: 'transport', name: 'Public Transport', icon: 'Bus' },
  { id: 'other', name: 'Other Civic Issues', icon: 'HelpCircle' }
];

export const grievanceStatuses = {
  SUBMITTED: { id: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  UNDER_REVIEW: { id: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ASSIGNED: { id: 'ASSIGNED', label: 'Assigned', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  IN_PROGRESS: { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  RESOLVED: { id: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
  CLOSED: { id: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};
