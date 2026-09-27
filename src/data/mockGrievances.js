export const mockGrievances = [
  {
    id: 'GRV-2026-004281',
    title: 'Broken Streetlight near Sector 12 Park',
    categoryId: 'street_lighting',
    description: 'The streetlight on the corner of Civic Enclave and Sector 12 Park has been broken for over a week. It is completely dark at night and raises safety concerns.',
    location: 'Corner of Civic Enclave and Sector 12 Park, New Delhi 110001',
    submittedAt: '2026-09-25T08:30:00Z',
    status: 'IN_PROGRESS',
    updates: [
      { id: 1, date: '2026-09-25T08:30:00Z', status: 'SUBMITTED', message: 'Grievance submitted successfully.' },
      { id: 2, date: '2026-09-25T14:15:00Z', status: 'UNDER_REVIEW', message: 'Grievance is being reviewed by the public works department.' },
      { id: 3, date: '2026-09-26T09:00:00Z', status: 'ASSIGNED', message: 'Assigned to the local electrical maintenance team.' },
      { id: 4, date: '2026-09-27T10:30:00Z', status: 'IN_PROGRESS', message: 'Maintenance team has been dispatched to the location.' }
    ]
  },
  {
    id: 'GRV-2026-004112',
    title: 'Irregular Water Supply in Block B',
    categoryId: 'water',
    description: 'Water supply has been very irregular for the last three days. We only get water for 30 minutes in the morning instead of the usual 2 hours.',
    location: 'Block B, Civic Enclave, New Delhi 110001',
    submittedAt: '2026-09-20T11:45:00Z',
    status: 'RESOLVED',
    updates: [
      { id: 1, date: '2026-09-20T11:45:00Z', status: 'SUBMITTED', message: 'Grievance submitted successfully.' },
      { id: 2, date: '2026-09-21T09:20:00Z', status: 'UNDER_REVIEW', message: 'Water department notified.' },
      { id: 3, date: '2026-09-22T10:00:00Z', status: 'RESOLVED', message: 'Main valve issue fixed. Water supply restored to normal schedule.' }
    ]
  },
  {
    id: 'GRV-2026-004395',
    title: 'Pothole on Main Road',
    categoryId: 'roads',
    description: 'A large pothole has developed on the main road entering Sector 12, causing traffic slowdowns and potential damage to vehicles.',
    location: 'Main Entrance Road, Sector 12, New Delhi 110001',
    submittedAt: '2026-09-27T14:20:00Z',
    status: 'SUBMITTED',
    updates: [
      { id: 1, date: '2026-09-27T14:20:00Z', status: 'SUBMITTED', message: 'Grievance submitted successfully.' }
    ]
  }
];
