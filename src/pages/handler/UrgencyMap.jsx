import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { grievanceService } from '../../services/grievanceService';
import { getUrgencyLevel } from '../../utils/urgencyScore';
import { AlertTriangle, Users, MapPin, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

// Kolkata Area Coordinates Mapping
const KOLKATA_AREAS = {
  "Salt Lake": [22.5869, 88.4093],
  "New Town": [22.5768, 88.4725],
  "Park Street": [22.5513, 88.3526],
  "Ballygunge": [22.5273, 88.3653],
  "Garia": [22.4646, 88.3973],
  "Behala": [22.4975, 88.3129],
  "Dum Dum": [22.6225, 88.4239],
  "Howrah": [22.5958, 88.3231],
  "Other": [22.5726, 88.3639] // Central Kolkata fallback
};

const UrgencyMap = () => {
  const [grievances, setGrievances] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [areaDataList, setAreaDataList] = useState([]);

  useEffect(() => {
    const allGrievances = grievanceService.getAllGrievances();
    setGrievances(allGrievances);

    // Group grievances by location
    const areaMap = {};
    allGrievances.forEach(g => {
      if (g.status === 'RESOLVED' || g.status === 'CLOSED') return;
      const loc = g.location || "Other";
      if (!areaMap[loc]) {
        areaMap[loc] = {
          name: loc,
          coordinates: KOLKATA_AREAS[loc] || KOLKATA_AREAS["Other"],
          totalGrievances: 0,
          similarComplaints: 0,
          critical: 0,
          highSeverity: 0,
          scores: [],
          populationDensity: g.populationImpact || 'Medium',
          grievanceIds: []
        };
      }
      
      const area = areaMap[loc];
      area.totalGrievances++;
      area.similarComplaints += g.similarComplaints;
      if (g.severity === 'Critical') area.critical++;
      if (g.severity === 'High') area.highSeverity++;
      area.scores.push(g.urgencyScore);
      area.grievanceIds.push(g.id);
    });

    const aggregated = Object.values(areaMap).map(area => ({
      ...area,
      // For the area, the urgency score is the max of its grievances
      urgencyScore: Math.max(...area.scores)
    }));

    setAreaDataList(aggregated);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-10rem)] min-h-[600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kolkata Urgency Map</h1>
        <p className="text-gray-600 mt-1">Geographic prioritization based on severity, frequency, and population impact.</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Map Area */}
        <div className="flex-1 border border-slate-300 rounded-lg relative overflow-hidden flex flex-col z-0">
          {/* Map Legend (UI Overlay) */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-md shadow-md border border-gray-200 z-[1000] text-xs pointer-events-none">
            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Urgency Levels</h4>
            <div className="space-y-1.5">
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span> Critical (&ge;80)</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> High (60-79)</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> Moderate (40-59)</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Low (&lt;40)</div>
            </div>
          </div>

          <div className="flex-1 h-full w-full bg-slate-100 z-0">
            <MapContainer 
              center={[22.5726, 88.3639]} // Kolkata center
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {areaDataList.map((area, idx) => {
                const level = getUrgencyLevel(area.urgencyScore);
                let color = '#3b82f6'; // blue
                if (level === 'Critical') color = '#dc2626'; // red
                else if (level === 'High') color = '#f97316'; // orange
                else if (level === 'Moderate') color = '#facc15'; // yellow

                const radius = Math.max(15, area.urgencyScore / 3);

                return (
                  <CircleMarker
                    key={`${area.name}-${idx}`}
                    center={area.coordinates}
                    pathOptions={{ color: color, fillColor: color, fillOpacity: 0.7 }}
                    radius={radius}
                    eventHandlers={{
                      click: () => {
                        setSelectedArea(area);
                      },
                    }}
                  >
                    <Popup>
                      <div className="font-bold">{area.name}</div>
                      <div className="text-sm">Urgency Score: {area.urgencyScore}</div>
                      <div className="text-xs mt-1 text-gray-500">Click circle for details</div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          
          <div className="bg-slate-800 text-slate-300 text-xs py-1.5 px-4 text-center z-10">
            Prototype map visualization. This represents geographic complaint clustering in Kolkata.
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full lg:w-96 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 z-10">
          <div className="bg-slate-50 border-b border-gray-200 p-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-slate-500" /> Area Intelligence
            </h2>
          </div>
          
          <div className="p-0 flex-1 overflow-y-auto">
            {!selectedArea ? (
              <div className="p-8 text-center text-gray-500 h-full flex flex-col justify-center items-center">
                <MapPin className="h-12 w-12 text-gray-300 mb-3" />
                <p>Select a region on the map to view detailed analytics and urgency metrics.</p>
                {areaDataList.length === 0 && (
                  <p className="mt-4 text-sm text-red-500 bg-red-50 p-2 rounded">
                    No active grievances in the system to display on the map.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedArea.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                    getUrgencyLevel(selectedArea.urgencyScore) === 'Critical' ? 'bg-red-100 text-red-800' :
                    getUrgencyLevel(selectedArea.urgencyScore) === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getUrgencyLevel(selectedArea.urgencyScore)} Urgency
                  </span>
                  <span className="text-sm font-medium text-slate-500">Max Score: {selectedArea.urgencyScore}/100</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Volume Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <div className="text-2xl font-bold text-slate-800">{selectedArea.totalGrievances}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1">Total Active</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <div className="text-2xl font-bold text-blue-800">{selectedArea.similarComplaints}</div>
                        <div className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                          <Activity className="w-3 h-3 mr-1"/> Concentration
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Severity Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-slate-700"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Critical</span>
                        <span className="font-bold text-slate-900">{selectedArea.critical}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-slate-700"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> High</span>
                        <span className="font-bold text-slate-900">{selectedArea.highSeverity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Impact Factors</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 flex items-center"><Users className="w-4 h-4 mr-1.5"/> Population Density</span>
                        <span className="font-bold text-slate-900">{selectedArea.populationDensity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/handler/priority-queue" className="block text-center w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-md shadow-sm transition-colors">
                      View {selectedArea.totalGrievances} Area Grievances
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgencyMap;
