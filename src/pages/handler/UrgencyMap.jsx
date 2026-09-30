import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { grievanceService } from '../../services/grievanceService';
import { clusterGrievances, LOCALITY_COORDINATES } from '../../utils/problemClustering';
import { AlertTriangle, Users, MapPin, Activity, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const customStyles = `
  .transparent-tooltip {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  .transparent-tooltip::before {
    display: none !important;
  }
`;

const UrgencyMap = () => {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState(null);

  useEffect(() => {
    const raw = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(raw);
    const active = clustered.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
    setClusters(active);
    if (active.length > 0) {
      setSelectedCluster(active[0]);
      setSelectedAreaName(active[0].location);
    }
  }, []);

  // Filter clusters in the selected area
  const areaClusters = selectedAreaName 
    ? clusters.filter(c => c.location.toLowerCase() === selectedAreaName.toLowerCase())
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-10rem)] min-h-[600px]">
      <style>{customStyles}</style>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kolkata Problem Clusters Map</h1>
          <p className="text-slate-600 text-sm mt-1">Geographic field support view. Select any problem cluster to view immediate action.</p>
        </div>

        <Link
          to="/handler/categories"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Category Workflows</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Map Area */}
        <div className="flex-1 border border-slate-300 rounded-2xl relative overflow-hidden flex flex-col z-0 shadow-sm">
          {/* Map Legend */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 z-[1000] text-xs pointer-events-none">
            <h4 className="font-bold text-slate-800 mb-1.5 border-b pb-1">Cluster Severity</h4>
            <div className="space-y-1">
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span> Critical</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> High</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> Moderate</div>
            </div>
          </div>

          <div className="flex-1 h-full w-full bg-slate-100 z-0">
            <MapContainer 
              center={[22.5726, 88.3639]} // Kolkata center
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {clusters.map((cluster) => {
                let color = '#f59e0b';
                if (cluster.severity === 'Critical') color = '#dc2626';
                else if (cluster.severity === 'High') color = '#ea580c';
                else if (cluster.severity === 'Moderate') color = '#ca8a04';

                const radius = Math.max(16, Math.min(26, cluster.reportsCount * 3 + 12));

                return (
                  <CircleMarker
                    key={cluster.id}
                    center={cluster.coordinates}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
                    radius={radius}
                    eventHandlers={{
                      click: () => {
                        setSelectedCluster(cluster);
                        setSelectedAreaName(cluster.location);
                      },
                    }}
                  >
                    <Tooltip 
                      direction="center" 
                      permanent 
                      className="transparent-tooltip text-white font-black text-sm p-0 m-0"
                    >
                      <span style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>
                        {cluster.reportsCount}
                      </span>
                    </Tooltip>
                    <Popup>
                      <div className="p-1">
                        <div className="text-[10px] font-bold uppercase text-red-600">
                          {cluster.severity} • {cluster.category?.name}
                        </div>
                        <div className="font-black text-sm text-slate-900 mt-0.5">
                          {cluster.title}
                        </div>
                        <div className="text-xs text-slate-600 my-1">
                          {cluster.location} ({cluster.ward}) • {cluster.reportsCount} citizen reports
                        </div>
                        <Link
                          to={`/handler/problem/${cluster.id}`}
                          className="block text-center py-1.5 px-3 bg-slate-900 text-white font-bold text-xs rounded uppercase tracking-wider"
                        >
                          Open Problem Card &rarr;
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          
          <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center z-10 font-medium">
            Click any circle marker to load the problem cluster card in the action panel.
          </div>
        </div>

        {/* Action / Intel Panel (Right Col) */}
        <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 z-10">
          <div className="bg-slate-900 text-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>Location Action Panel</span>
            </h2>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto">
            {!selectedCluster ? (
              <div className="text-center py-12 text-slate-500">
                <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">Click a marker on the map to inspect its field action details.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      selectedCluster.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedCluster.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {selectedCluster.category?.name}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedCluster.title}
                  </h3>
                  
                  <div className="flex items-center text-xs font-bold text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                    <span>{selectedCluster.location}, {selectedCluster.ward}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Reports</span>
                    <span className="text-lg font-black text-slate-900">{selectedCluster.reportsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pop. Impact</span>
                    <span className="text-lg font-black text-slate-900">~{selectedCluster.populationImpact.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                    Recommended Action:
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    "{selectedCluster.recommendedAction}"
                  </p>
                </div>

                {/* Direct Action Link */}
                <button
                  onClick={() => navigate(`/handler/problem/${selectedCluster.id}`)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Full Action Card</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* Other problems in same area (Solve Together) */}
                {areaClusters.length > 1 && (
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Also Co-located in {selectedCluster.location} ({areaClusters.length - 1} other):
                    </span>
                    <div className="space-y-2">
                      {areaClusters.filter(c => c.id !== selectedCluster.id).map(other => (
                        <div
                          key={other.id}
                          onClick={() => setSelectedCluster(other)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs flex justify-between items-center border border-slate-200"
                        >
                          <span className="font-bold text-slate-800 truncate mr-2">{other.title}</span>
                          <span className="text-[10px] font-bold text-red-600 shrink-0">{other.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UrgencyMap;
