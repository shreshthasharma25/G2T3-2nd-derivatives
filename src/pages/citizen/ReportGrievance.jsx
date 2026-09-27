import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, UploadCloud, MapPin, AlertTriangle } from 'lucide-react';
import { grievanceCategories } from '../../data/grievanceCategories';
import { grievanceService } from '../../services/grievanceService';
import { useAuth } from '../../contexts/AuthContext';
import * as Icons from 'lucide-react';

const ReportGrievance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    severity: '',
    location: '',
    city: 'Kolkata',
    pinCode: '',
    files: []
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the auth context user
    const saved = grievanceService.createGrievance(formData, user);
    setReferenceId(saved.id);
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-10 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Grievance Submitted Successfully</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Thank you for bringing this to our attention. Your issue has been recorded and will be reviewed shortly.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-10 inline-block min-w-[320px]">
            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Your Reference ID</p>
            <p className="text-3xl font-mono font-bold text-blue-900">{referenceId}</p>
            <p className="text-xs text-gray-500 mt-2">Please save this ID for future tracking</p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to={`/citizen/grievance/${referenceId}`} 
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800"
            >
              Track Status
            </Link>
            <Link 
              to="/citizen/home" 
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Common Kolkata localities for prototyping dropdown
  const kolkataAreas = [
    "Salt Lake", "New Town", "Park Street", "Ballygunge", 
    "Garia", "Behala", "Dum Dum", "Howrah", "Other"
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Report a Grievance</h1>
        <p className="text-gray-600 mt-2 text-lg">Follow the steps to submit your civic issue.</p>
      </div>

      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-10">
        <ol role="list" className="flex items-center justify-between">
          {[
            { id: 1, name: 'Issue' },
            { id: 2, name: 'Location' },
            { id: 3, name: 'Evidence' },
            { id: 4, name: 'Review' }
          ].map((stepItem, stepIdx) => (
            <li key={stepItem.name} className="relative flex flex-col items-center flex-1">
              {stepIdx !== 0 && (
                <div className={`absolute top-4 w-full -left-1/2 h-1 ${step > stepItem.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
              <div 
                className={`
                  relative z-10 flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
                  ${step > stepItem.id ? 'bg-blue-700 text-white' : step === stepItem.id ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}
                `}
              >
                {step > stepItem.id ? <CheckCircle2 className="w-5 h-5" /> : stepItem.id}
              </div>
              <div className={`mt-3 text-xs sm:text-sm font-medium ${step >= stepItem.id ? 'text-gray-900' : 'text-gray-400'}`}>
                {stepItem.name}
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Area */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <div className="p-6 sm:p-10">
            
            {/* Step 1: Issue Details */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">What happened?</h2>
                  <p className="text-gray-500 text-sm mb-6">Select a category that best matches your issue.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {grievanceCategories.map(cat => {
                      const IconComp = Icons[cat.icon] || Icons.FileQuestion;
                      return (
                        <div 
                          key={cat.id}
                          onClick={() => setFormData({...formData, categoryId: cat.id})}
                          className={`
                            cursor-pointer border rounded-lg p-4 flex flex-col items-center text-center transition-all
                            ${formData.categoryId === cat.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                          `}
                        >
                          <IconComp className={`h-6 w-6 mb-3 ${formData.categoryId === cat.id ? 'text-blue-700' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${formData.categoryId === cat.id ? 'text-blue-900' : 'text-gray-700'}`}>{cat.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {formData.categoryId && (
                  <div className="space-y-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
                        Short Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Broken street light, Overflowing garbage bin"
                        className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
                        Detailed Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Please describe the issue in detail. What exactly is wrong?"
                        className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        How serious is this issue? *
                      </label>
                      <div className="space-y-3">
                        {[
                          { id: 'Low', label: 'Low — Inconvenience but not urgent' },
                          { id: 'Moderate', label: 'Moderate — Affecting daily activities' },
                          { id: 'High', label: 'High — Affecting many people or significant disruption' },
                          { id: 'Critical', label: 'Critical — Immediate safety/public welfare concern' }
                        ].map(sev => (
                          <label key={sev.id} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${formData.severity === sev.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                name="severity"
                                value={sev.id}
                                required
                                checked={formData.severity === sev.id}
                                onChange={handleInputChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <span className={`font-medium ${formData.severity === sev.id ? 'text-blue-900' : 'text-gray-900'}`}>{sev.label.split(' — ')[0]}</span>
                              <span className={`block ${formData.severity === sev.id ? 'text-blue-700' : 'text-gray-500'}`}> — {sev.label.split(' — ')[1]}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Where did it happen?</h2>
                <p className="text-gray-500 text-sm mb-6">Provide the exact location so teams can find the issue.</p>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                    Locality / Area *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="location"
                      id="location"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-gray-300 pl-10 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">Select an area in Kolkata</option>
                      {kolkataAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      readOnly
                      className="block w-full rounded-md border border-gray-300 px-4 py-3 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="pinCode" className="block text-sm font-semibold text-gray-700 mb-1">PIN Code (Optional)</label>
                    <input
                      type="text"
                      name="pinCode"
                      id="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Evidence */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Add supporting information</h2>
                <p className="text-gray-500 text-sm mb-6">Photos help us assess the situation better (Optional).</p>
                
                <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-blue-500" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a photo or document</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review your submission</h2>
                <p className="text-gray-500 text-sm mb-6">Please ensure all details are correct before submitting.</p>
                
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</h3>
                      <p className="mt-1 text-base text-gray-900 font-medium">
                        {grievanceCategories.find(c => c.id === formData.categoryId)?.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Severity</h3>
                      <p className="mt-1 text-base text-gray-900 font-medium">{formData.severity}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title</h3>
                    <p className="mt-1 text-base text-gray-900 font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h3>
                    <p className="mt-1 text-base text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                  </div>
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h3>
                    <p className="mt-2 text-base text-gray-900 font-medium flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
                      <span>{formData.location}, {formData.city} {formData.pinCode && `- ${formData.pinCode}`}</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="ml-3 text-sm text-amber-800">
                    False reporting can delay actual emergencies. By submitting this grievance, you confirm that the information provided is accurate.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 sm:px-10 py-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-xl">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 4 ? (
              <button
                type="submit"
                disabled={step === 1 && (!formData.categoryId || !formData.title || !formData.description || !formData.severity) || (step === 2 && !formData.location)}
                className="inline-flex justify-center py-2.5 px-8 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex justify-center py-2.5 px-8 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-blue-700 hover:bg-blue-800 transition-colors"
              >
                Submit Grievance
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportGrievance;
