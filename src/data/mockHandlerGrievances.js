import { calculateUrgencyScore } from '../utils/urgencyScore';

export const mockHandlerGrievances = [
  {
    id: 'GRV-2026-004281',
    title: 'Major Power Outage affecting hospital',
    categoryId: 'electricity',
    description: 'Complete power failure near the main district hospital. Backup generators are running low.',
    location: 'Salt Lake Sector V',
    submittedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    status: 'SUBMITTED',
    severity: 'Critical',
    similarComplaints: 4,
    populationImpact: 'High',
    recurrence: 1,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.severity,
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationImpact,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'GRV-2026-004282',
    title: 'Multiple broken streetlights on main avenue',
    categoryId: 'street_lighting',
    description: 'The entire block has no streetlights, leading to safety issues at night.',
    location: 'Salt Lake Sector V',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: 'UNDER_REVIEW',
    severity: 'High',
    similarComplaints: 17,
    populationImpact: 'High',
    recurrence: 4,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.severity,
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationImpact,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'GRV-2026-004283',
    title: 'Garbage not collected for a week',
    categoryId: 'sanitation',
    description: 'Overflowing bins causing severe health hazards.',
    location: 'New Town Action Area',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'ASSIGNED',
    severity: 'Moderate',
    similarComplaints: 11,
    populationImpact: 'Medium',
    recurrence: 2,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.severity,
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationImpact,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'GRV-2026-004284',
    title: 'Deep pothole causing accidents',
    categoryId: 'roads',
    description: 'A large pothole has developed and multiple two-wheelers have skidded here.',
    location: 'Howrah Station Area',
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    status: 'SUBMITTED',
    severity: 'Critical',
    similarComplaints: 8,
    populationImpact: 'High',
    recurrence: 3,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.severity,
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationImpact,
        recurrence: this.recurrence
      });
    }
  }
];
