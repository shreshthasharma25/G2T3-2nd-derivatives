import { calculateUrgencyScore } from '../utils/urgencyScore';

export const mockAreas = [
  {
    id: 'area_salt_lake',
    name: 'Salt Lake Sector V',
    coordinates: { x: 75, y: 35 },
    populationDensity: 'High',
    totalGrievances: 38,
    similarComplaints: 17,
    highSeverity: 6,
    critical: 2,
    dominantIssue: 'street_lighting',
    recurrence: 4,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.critical > 0 ? 'Critical' : 'High',
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationDensity,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'area_new_town',
    name: 'New Town Action Area',
    coordinates: { x: 85, y: 25 },
    populationDensity: 'Medium',
    totalGrievances: 24,
    similarComplaints: 11,
    highSeverity: 2,
    critical: 0,
    dominantIssue: 'sanitation',
    recurrence: 2,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.highSeverity > 0 ? 'High' : 'Moderate',
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationDensity,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'area_howrah',
    name: 'Howrah Station Area',
    coordinates: { x: 45, y: 55 },
    populationDensity: 'High',
    totalGrievances: 19,
    similarComplaints: 8,
    highSeverity: 5,
    critical: 1,
    dominantIssue: 'roads',
    recurrence: 3,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: this.critical > 0 ? 'Critical' : 'High',
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationDensity,
        recurrence: this.recurrence
      });
    }
  },
  {
    id: 'area_ballygunge',
    name: 'Ballygunge Circular Road',
    coordinates: { x: 60, y: 70 },
    populationDensity: 'Low',
    totalGrievances: 5,
    similarComplaints: 2,
    highSeverity: 0,
    critical: 0,
    dominantIssue: 'water',
    recurrence: 0,
    get urgencyScore() {
      return calculateUrgencyScore({
        severity: 'Low',
        complaintConcentration: this.similarComplaints,
        populationImpact: this.populationDensity,
        recurrence: this.recurrence
      });
    }
  }
];
