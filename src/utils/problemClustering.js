import { grievanceCategories } from '../data/grievanceCategories';

// Known coordinates for Kolkata localities
export const LOCALITY_COORDINATES = {
  "Park Street": [22.5513, 88.3526],
  "Salt Lake": [22.5869, 88.4093],
  "New Town": [22.5768, 88.4725],
  "Howrah": [22.5958, 88.3231],
  "Ballygunge": [22.5273, 88.3653],
  "Main Road": [22.5200, 88.3600],
  "ABC Colony": [22.5900, 88.4100],
  "Garia": [22.4646, 88.3973],
  "Behala": [22.4975, 88.3129],
  "Dum Dum": [22.6225, 88.4239],
  "Other": [22.5726, 88.3639]
};

// Population impact density heuristic by locality / ward
const LOCALITY_POPULATION_ESTIMATES = {
  "Park Street": 3800,
  "Main Road": 2100,
  "ABC Colony": 900,
  "Salt Lake": 4200,
  "Howrah": 5400,
  "New Town": 2600,
  "Ballygunge": 1800,
  "Behala": 3100,
  "Dum Dum": 3500,
  "Garia": 2200,
  "Other": 1500
};

// Default handler base location (Park Street, Central Kolkata)
export const HANDLER_BASE_LOCATION = {
  name: 'Central Field Office (Park Street)',
  coordinates: [22.5513, 88.3526]
};

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(coords1, coords2) {
  if (!coords1 || !coords2) return 1.5;
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Generate a clear, actionable recommended action string based on subcategory/title.
 */
function generateRecommendedAction(title, subCategory, categoryId) {
  const text = `${title} ${subCategory || ''}`.toLowerCase();
  
  if (text.includes('manhole')) {
    return 'Secure the open manhole and arrange permanent repair.';
  }
  if (text.includes('barrier') || text.includes('barricade') || text.includes('railing')) {
    return 'Inspect damaged road barrier and replace barricade.';
  }
  if (text.includes('streetlight') || text.includes('light') || text.includes('lamp')) {
    return 'Inspect and repair streetlight.';
  }
  if (text.includes('leak') || text.includes('burst') || text.includes('pipe')) {
    return 'Isolate valve, repair cracked pipeline, and restore supply.';
  }
  if (text.includes('contamination') || text.includes('foul water')) {
    return 'Flush pipeline network, take water samples, and seal contamination source.';
  }
  if (text.includes('garbage') || text.includes('bin') || text.includes('waste')) {
    return 'Dispatch solid waste compactor truck and sanitize collection point.';
  }
  if (text.includes('pothole') || text.includes('crater')) {
    return 'Fill road cavity with cold-mix asphalt and level surface.';
  }
  if (text.includes('transformer') || text.includes('wire') || text.includes('power')) {
    return 'De-energize faulty line, secure hanging cable, and replace transformer fuse.';
  }
  if (text.includes('drain') || text.includes('waterlogging') || text.includes('culvert')) {
    return 'Deploy suction jetting machine to de-silt and unblock storm canal.';
  }

  return `Conduct field inspection at location and resolve ${subCategory || 'civic issue'}.`;
}

/**
 * Generate field action checklist.
 */
function generateActionChecklist(title, location, recommendedAction) {
  return [
    `Reach ${location}.`,
    recommendedAction.replace(/\.$/, '') + '.',
    'Place temporary safety barricading if public safety is affected.',
    'Take completion verification photograph.',
    'Report completion and submit resolution status.'
  ];
}

/**
 * Synthesizes a clean problem title for the cluster.
 */
function synthesizeProblemTitle(subCategory, rawTitle) {
  if (subCategory && subCategory !== 'Other') {
    return subCategory.toUpperCase();
  }
  const t = rawTitle.toLowerCase();
  if (t.includes('manhole')) return 'OPEN MANHOLE';
  if (t.includes('barrier') || t.includes('barricade')) return 'DAMAGED STREET BARRIER';
  if (t.includes('railing')) return 'BROKEN RAILING';
  if (t.includes('streetlight') || t.includes('light')) return 'BROKEN STREETLIGHT';
  if (t.includes('pipe') || t.includes('leak')) return 'PIPELINE LEAKAGE';
  if (t.includes('water') && t.includes('contaminat')) return 'WATER CONTAMINATION';
  if (t.includes('garbage') || t.includes('bin')) return 'GARBAGE ACCUMULATION';
  if (t.includes('pothole')) return 'ROAD POTHOLE';
  if (t.includes('wire') || t.includes('sparking')) return 'DANGEROUS ELECTRICAL WIRE';
  if (t.includes('drain') || t.includes('waterlog')) return 'CLOGGED STORM DRAIN';
  
  return rawTitle.toUpperCase();
}

/**
 * Core Clustering Engine:
 * Groups individual citizen grievances into actionable Civic Problem Clusters.
 */
export function clusterGrievances(grievances = [], baseCoords = HANDLER_BASE_LOCATION.coordinates) {
  if (!Array.isArray(grievances) || grievances.length === 0) {
    return [];
  }

  const clustersMap = new Map();

  grievances.forEach((g) => {
    // Normalise category
    let catId = g.categoryId || 'other';
    // Map street_lighting to public_safety if preferred or keep as its own
    const categoryObj = grievanceCategories.find((c) => c.id === catId) || grievanceCategories.find((c) => c.id === 'other');
    
    // Normalise locality
    const loc = g.location || 'Other';
    const ward = g.ward || (loc.includes('Ward') ? loc : 'Ward 1');
    const subCat = g.subCategory || 'Other';

    // Unique grouping key: category + locality + subcategory
    // This groups multiple citizen complaints about the same problem in the same area!
    const key = `${catId}__${loc}__${subCat}`;

    if (!clustersMap.has(key)) {
      clustersMap.set(key, {
        key,
        categoryId: catId,
        category: categoryObj,
        location: loc,
        ward,
        pinCode: g.pinCode || '700001',
        subCategory: subCat,
        reports: [],
        firstReportedAt: g.submittedAt || new Date().toISOString(),
        latestReportedAt: g.submittedAt || new Date().toISOString(),
        representativeTitle: g.title
      });
    }

    const cluster = clustersMap.get(key);
    cluster.reports.push(g);

    // Track oldest report time
    if (new Date(g.submittedAt) < new Date(cluster.firstReportedAt)) {
      cluster.firstReportedAt = g.submittedAt;
    }
    if (new Date(g.submittedAt) > new Date(cluster.latestReportedAt)) {
      cluster.latestReportedAt = g.submittedAt;
    }
  });

  // Transform each grouped bucket into a rich actionable ProblemCluster
  const clusters = Array.from(clustersMap.values()).map((c, index) => {
    const reportsCount = c.reports.length;

    // Severity resolution: highest severity among reports
    const severityOrder = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1 };
    let highestSeverity = 'Low';
    let highestVal = 0;
    c.reports.forEach((r) => {
      const val = severityOrder[r.severity] || 2;
      if (val > highestVal) {
        highestVal = val;
        highestSeverity = r.severity || 'Moderate';
      }
    });

    // Safety Risk
    let safetyRisk = 'Moderate';
    if (highestSeverity === 'Critical' || c.categoryId === 'public_safety' || c.categoryId === 'electricity') {
      safetyRisk = highestSeverity === 'Critical' ? 'Very High' : 'High';
    } else if (highestSeverity === 'High') {
      safetyRisk = 'High';
    } else if (highestSeverity === 'Low') {
      safetyRisk = 'Low';
    }

    // Population impact estimate based on locality density
    const basePop = LOCALITY_POPULATION_ESTIMATES[c.location] || 1500;
    // Multiplier based on severity and reports count
    const popMultiplier = highestSeverity === 'Critical' ? 1.0 : highestSeverity === 'High' ? 0.8 : 0.5;
    const estimatedPopulation = Math.round(basePop * popMultiplier);

    // Unresolved duration
    const hoursUnresolved = Math.max(1, Math.round((Date.now() - new Date(c.firstReportedAt)) / (1000 * 60 * 60)));
    let durationText = `${hoursUnresolved} hours`;
    if (hoursUnresolved >= 48) {
      durationText = `${Math.floor(hoursUnresolved / 24)} days`;
    } else if (hoursUnresolved >= 24) {
      durationText = '1 day';
    }

    // Overall Status
    const isAllResolved = c.reports.every((r) => r.status === 'RESOLVED' || r.status === 'CLOSED');
    const hasInProgress = c.reports.some((r) => r.status === 'IN_PROGRESS');
    const hasAssigned = c.reports.some((r) => r.status === 'ASSIGNED');
    let status = 'SUBMITTED';
    if (isAllResolved) status = 'RESOLVED';
    else if (hasInProgress) status = 'IN_PROGRESS';
    else if (hasAssigned) status = 'ASSIGNED';

    // Priority Score (0-100)
    // Non-linear ranking: severity (40%) + safety risk (25%) + pop impact (20%) + reports count (10%) + duration (5%)
    let priorityScore = 0;
    if (highestSeverity === 'Critical') priorityScore += 45;
    else if (highestSeverity === 'High') priorityScore += 30;
    else if (highestSeverity === 'Moderate') priorityScore += 18;
    else priorityScore += 8;

    if (safetyRisk === 'Very High') priorityScore += 25;
    else if (safetyRisk === 'High') priorityScore += 18;
    else if (safetyRisk === 'Moderate') priorityScore += 10;

    if (estimatedPopulation >= 3500) priorityScore += 18;
    else if (estimatedPopulation >= 2000) priorityScore += 14;
    else if (estimatedPopulation >= 1000) priorityScore += 9;
    else priorityScore += 4;

    // Reports count contribution (capped at 10)
    priorityScore += Math.min(reportsCount * 2, 10);

    // Duration contribution
    if (hoursUnresolved >= 48) priorityScore += 5;
    else if (hoursUnresolved >= 24) priorityScore += 3;

    priorityScore = Math.min(priorityScore, 100);

    // Coords & Distance - prioritize user's actual picked coordinates if available
    const userCoords = c.reports.find((r) => r.coordinates && Array.isArray(r.coordinates))?.coordinates;
    const coordinates = userCoords || LOCALITY_COORDINATES[c.location] || LOCALITY_COORDINATES['Other'];
    const distanceKm = calculateDistanceKm(baseCoords, coordinates);

    // Synthesized Title & Actions
    const title = synthesizeProblemTitle(c.subCategory, c.representativeTitle);
    const recommendedAction = generateRecommendedAction(title, c.subCategory, c.categoryId);
    const actionChecklist = generateActionChecklist(title, c.location, recommendedAction);

    // Check for resolution details from any report
    const resolvedReport = c.reports.find((r) => r.status === 'RESOLVED' && r.resolutionNote);

    return {
      id: `CLUSTER-${c.categoryId.toUpperCase()}-${c.location.replace(/\s+/g, '').toUpperCase()}-${index + 1}`,
      title,
      subCategory: c.subCategory,
      categoryId: c.categoryId,
      category: c.category,
      location: c.location,
      ward: c.ward,
      pinCode: c.pinCode,
      coordinates,
      distanceKm,
      reportsCount,
      reports: c.reports,
      severity: highestSeverity,
      safetyRisk,
      populationImpact: estimatedPopulation,
      populationImpactLabel: `~${estimatedPopulation.toLocaleString()} people potentially affected`,
      unresolvedDuration: durationText,
      hoursUnresolved,
      priorityScore,
      priorityReasoning: {
        severity: highestSeverity,
        safetyRisk,
        reportsCount,
        populationImpact: estimatedPopulation,
        duration: durationText
      },
      recommendedAction,
      actionChecklist,
      status,
      assignedHandler: c.reports[0]?.assignedHandler || null,
      assignedDepartment: c.reports[0]?.assignedDepartment || null,
      resolution: resolvedReport
        ? {
            note: resolvedReport.resolutionNote,
            photoUrl: resolvedReport.resolutionPhotoUrl,
            resolvedAt: resolvedReport.resolvedAt,
            resolvedBy: resolvedReport.resolvedBy
          }
        : null
    };
  });

  // Sort by priorityScore descending by default
  return clusters.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Finds operational "Solve Together" groups:
 * Detects areas/wards that have 2 or more unresolved problems so a field worker can solve them together.
 */
export function getSolveTogetherGroups(clusters = []) {
  const activeClusters = clusters.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const wardMap = new Map();

  activeClusters.forEach((c) => {
    const areaKey = `${c.location} (${c.ward})`;
    if (!wardMap.has(areaKey)) {
      wardMap.set(areaKey, []);
    }
    wardMap.get(areaKey).push(c);
  });

  const solveTogetherList = [];
  wardMap.forEach((items, areaKey) => {
    if (items.length >= 2) {
      solveTogetherList.push({
        areaKey,
        location: items[0].location,
        ward: items[0].ward,
        clusters: items,
        count: items.length
      });
    }
  });

  return solveTogetherList;
}

/**
 * Returns category summary counts of active problem clusters.
 */
export function getCategoryClusterStats(clusters = []) {
  const activeClusters = clusters.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const stats = {};

  grievanceCategories.forEach((cat) => {
    stats[cat.id] = {
      ...cat,
      activeProblemsCount: 0,
      criticalCount: 0,
      highPriorityCount: 0,
      totalReports: 0
    };
  });

  activeClusters.forEach((c) => {
    if (stats[c.categoryId]) {
      stats[c.categoryId].activeProblemsCount++;
      stats[c.categoryId].totalReports += c.reportsCount;
      if (c.severity === 'Critical') stats[c.categoryId].criticalCount++;
      if (c.priorityScore >= 70) stats[c.categoryId].highPriorityCount++;
    }
  });

  return stats;
}
