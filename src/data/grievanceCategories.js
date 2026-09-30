export const grievanceCategories = [
  { 
    id: 'public_safety', 
    name: 'Safety', 
    fullName: 'Public Safety & Hazards', 
    icon: 'ShieldAlert',
    emoji: '🛡',
    color: 'red',
    accentClass: 'border-red-500 bg-red-50 text-red-700',
    subCategories: [
      'Open manhole',
      'Broken railing',
      'Dangerous electrical wire',
      'Unsafe building',
      'Road obstruction',
      'Missing barricade',
      'Streetlight failure',
      'Other'
    ]
  },
  { 
    id: 'water', 
    name: 'Water', 
    fullName: 'Water Supply & Contamination', 
    icon: 'Droplet',
    emoji: '💧',
    color: 'blue',
    accentClass: 'border-blue-500 bg-blue-50 text-blue-700',
    subCategories: [
      'Pipeline leakage',
      'Water contamination',
      'No water supply',
      'Overflow',
      'Broken pipeline',
      'Drainage issue',
      'Other'
    ]
  },
  { 
    id: 'sanitation', 
    name: 'Waste', 
    fullName: 'Waste Management & Sanitation', 
    icon: 'Trash2',
    emoji: '🗑',
    color: 'emerald',
    accentClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    subCategories: [
      'Garbage accumulation',
      'Overflowing bin',
      'Illegal dumping',
      'Uncollected waste',
      'Other'
    ]
  },
  { 
    id: 'roads', 
    name: 'Roads', 
    fullName: 'Roads & Footpaths', 
    icon: 'Map',
    emoji: '🛣',
    color: 'amber',
    accentClass: 'border-amber-500 bg-amber-50 text-amber-700',
    subCategories: [
      'Pothole',
      'Road damage',
      'Blocked road',
      'Broken footpath',
      'Damaged traffic infrastructure',
      'Other'
    ]
  },
  { 
    id: 'electricity', 
    name: 'Electricity', 
    fullName: 'Electricity & Power Lines', 
    icon: 'Zap',
    emoji: '💡',
    color: 'yellow',
    accentClass: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    subCategories: [
      'Power outage',
      'Sparking transformer',
      'Hanging high-voltage wire',
      'Voltage fluctuation',
      'Other'
    ]
  },
  { 
    id: 'drainage', 
    name: 'Drainage', 
    fullName: 'Drainage & Waterlogging', 
    icon: 'CloudRain',
    emoji: '🌧',
    color: 'cyan',
    accentClass: 'border-cyan-500 bg-cyan-50 text-cyan-700',
    subCategories: [
      'Clogged storm drain',
      'Waterlogging',
      'Sewage backflow',
      'Open culvert',
      'Other'
    ]
  },
  { 
    id: 'street_lighting', 
    name: 'Lighting', 
    fullName: 'Street Lighting', 
    icon: 'Lightbulb',
    emoji: '💡',
    color: 'orange',
    accentClass: 'border-orange-500 bg-orange-50 text-orange-700',
    subCategories: [
      'Streetlight failure',
      'Flickering lamp',
      'Broken pole',
      'Other'
    ]
  },
  { 
    id: 'transport', 
    name: 'Transport', 
    fullName: 'Public Transport & Stops', 
    icon: 'Bus',
    emoji: '🚌',
    color: 'purple',
    accentClass: 'border-purple-500 bg-purple-50 text-purple-700',
    subCategories: [
      'Damaged bus stop',
      'Encroachment',
      'Traffic signal failure',
      'Other'
    ]
  },
  { 
    id: 'other', 
    name: 'Other', 
    fullName: 'Other Civic Issues', 
    icon: 'HelpCircle',
    emoji: '📋',
    color: 'gray',
    accentClass: 'border-gray-500 bg-gray-50 text-gray-700',
    subCategories: [
      'Noise pollution',
      'Public nuisance',
      'Tree obstruction',
      'Other'
    ]
  }
];

export const grievanceStatuses = {
  SUBMITTED: { id: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ASSIGNED: { id: 'ASSIGNED', label: 'Assigned', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  IN_PROGRESS: { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  AWAITING_RESOURCES: { id: 'AWAITING_RESOURCES', label: 'Awaiting Resources', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  UNDER_REVIEW: { id: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  RESOLVED: { id: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
  CLOSED: { id: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};
