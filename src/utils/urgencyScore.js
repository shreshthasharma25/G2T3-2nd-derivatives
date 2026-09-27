/**
 * Calculates a conceptual urgency score for an area or a grievance.
 * The score is normalized from 0 to 100.
 */

const SEVERITY_WEIGHTS = {
  'Low': 10,
  'Moderate': 30,
  'High': 70,
  'Critical': 100
};

const POPULATION_WEIGHTS = {
  'Low': 0.8,
  'Medium': 1.0,
  'High': 1.2
};

export const calculateUrgencyScore = ({
  severity = 'Moderate',
  complaintConcentration = 0,
  populationImpact = 'Medium',
  recurrence = 0
}) => {
  // Base severity (max 100)
  const severityScore = SEVERITY_WEIGHTS[severity] || 30;
  
  // Concentration contribution (max 40)
  const concentrationScore = Math.min(complaintConcentration * 4, 40);
  
  // Recurrence contribution (max 20)
  const recurrenceScore = Math.min(recurrence * 5, 20);
  
  // Raw score sum
  let rawScore = severityScore + concentrationScore + recurrenceScore;
  
  // Population multiplier
  const popMultiplier = POPULATION_WEIGHTS[populationImpact] || 1.0;
  
  let finalScore = Math.round(rawScore * popMultiplier);
  
  // Cap at 100
  return Math.min(Math.max(finalScore, 0), 100);
};

export const getUrgencyLevel = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
};
