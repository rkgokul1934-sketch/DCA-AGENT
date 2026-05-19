import React, { useState, useEffect, useCallback } from 'react';

import { useDebouncedCallback } from 'use-debounce';
import { useEventTemplate } from '../hooks/useEventTemplate';

// --- Reusable Accordion component (unchanged) ---
const Accordion = ({ title, icon: Icon, isExpanded, onToggle, children }) => (
  <div className="border-b border-gray-200 last:border-b-0 overflow-hidden">
    <button
      className={`w-full px-6 py-4 flex items-center justify-between transition-colors focus:outline-none ${isExpanded ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}`}
      onClick={onToggle}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-1.5 rounded-md ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-sm font-bold ${isExpanded ? 'text-blue-900' : 'text-gray-900'}`}>{title}</span>
      </div>
      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
    </button>
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        maxHeight: isExpanded ? '2000px' : '0',
        opacity: isExpanded ? 1 : 0,
        visibility: isExpanded ? 'visible' : 'hidden'
      }}
    >
      <div className="border-t border-gray-100">
        {children}
      </div>
    </div>
  </div>
);

export default function EventTypeEditor({ isOpen = true, onClose = () => { }, eventId = null }) {
  // Load or initialize template via custom hook
  const { fetchTemplate, saveTemplate, deleteTemplate } = useEventTemplate();
  const [eventTemplate, setEventTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    availability: true,
    duration: false,
    location: false,
    questions: false,
    workflows: false,
    gtm: false,
    analytics: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // pending, saving, saved

  // Debounced save – fires after 1s of inactivity
  const debouncedSave = useDebouncedCallback((updated) => {
    setIsSaving(true);
    setSaveStatus('saving');
    saveTemplate(updated.id, updated)
      .then(() => setSaveStatus('saved'))
      .finally(() => setIsSaving(false));
  }, 1000);

  // Load template on mount or when eventId changes
  useEffect(() => {
    if (eventId) {
      fetchTemplate(eventId).then(setEventTemplate);
    } else {
      // default placeholder
      // setEventTemplate({
      //   id: Date.now(),
      //   title: '30 Minute Meeting',
      //   duration: 30,
      //   provider: 'Google Meet',
      //   bookingWindowDays: 60,
      //   minNoticeHours: 4,
      //   timezone: 'Eastern Time - US & Canada',
      //   weeklyHours: {
      //     Sunday: { available: false, intervals: [] },
      //     Monday: { available: true, intervals: [{ start: '09:00', end: '17:00' }] },
      //     Tuesday: { available: true, intervals: [{ start: '09:00', end: '17:00' }] },
      //     Wednesday: { available: true, intervals: [{ start: '09:00', end: '17:00' }] },
      //     Thursday: { available: true, intervals: [{ start: '09:00', end: '17:00' }] },
      //     Friday: { available: true, intervals: [{ start: '09:00', end: '17:00' }] },
      //     Saturday: { available: false, intervals: [] },
      //   },
      //   dateOverrides: [],
      //   customQuestions: [
      //     { id: 1, label: 'Company name', required: true, type: 'text' },
      //     { id: 2, label: 'Role', required: true, type: 'text' },
      //     { id: 3, label: 'Team size', required: false, type: 'select' },
      //     { id: 4, label: 'Use case', required: true, type: 'textarea' },
      //     { id: 5, label: 'Product interest', required: false, type: 'select' },
      //     { id: 6, label: 'Notes', required: false, type: 'textarea' },
      //   ],
      //   workflows: {
      //     emailReminders: true,
      //     smsReminders: false,
      //     followUp: true,
      //     webhookTrigger: false,
      //     crmSync: true,
      //     slackAlerts: true
      //   },
      //   gtm: {
      //     leadScore: 'High Intent (A)',
      //     sourceTracking: true,
      //     campaignAttribution: true,
      //     routingRule: 'Enterprise Round Robin',
      //     assignedRep: 'Auto-assign',
      //     salesOwner: 'Unassigned',
      //     accountType: 'Enterprise',
      //     priority: 'P1'
      //   },
      //   analytics: {
      //     totalBookings: 142,
      //     noShowRate: 4.2,
      //     conversionRate: 68.5,
      //     avgResponse: '2.4m',
      //     revenueInfluenced: '$2.4M',
      //     activeLeads: 24
      //   }
      // });
    }
  }, [eventId, fetchTemplate]);

  // Generic updater – merges top‑level keys
  const updateTemplate = useCallback((key, value) => {
    setEventTemplate(prev => {
      const updated = { ...prev, [key]: value };
      // trigger debounced autosave if we have an id (i.e., persisted)
      if (updated.id) debouncedSave(updated);
      return updated;
    });
    setSaveStatus('pending');
  }, [debouncedSave]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!eventTemplate) return null; // loading state placeholder

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/40 z-40 transition-opacity duration-300 backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[680px] bg-gray-50 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Sticky Header - Commented out as requested */}
        {/* <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-5 flex flex-col space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm border border-blue-200" />
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{eventTemplate.title}</h2>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                One-on-One • <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full text-xs ml-1 border border-green-100">Active</span>
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex items-center mr-4 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                {saveStatus === 'pending' && <><RefreshCw className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Pending...</>}
                {saveStatus === 'saving' && <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-500" /> Saving...</>}
                {saveStatus === 'saved' && <><Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Saved</>}
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
              <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium text-gray-600">
            <button className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors"><Copy className="w-4 h-4" /><span>Clone</span></button>
            <button className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors"><Archive className="w-4 h-4" /><span>Archive</span></button>
            <button className="flex items-center space-x-1.5 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /><span>Delete</span></button>
            <div className="h-4 w-px bg-gray-300" />
            <button className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors"><ExternalLink className="w-4 h-4" /><span>View live page</span></button>
          </div>
        </div> */}
        {/* Scrollable Content */}
        {/* <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
          <div className="bg-white m-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Accordion title="Duration" icon={Clock} isExpanded={expandedSections.duration} onToggle={() => toggleSection('duration')}>
              <DurationSection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="Location" icon={MapPin} isExpanded={expandedSections.location} onToggle={() => toggleSection('location')}>
              <LocationSection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="Availability" icon={Calendar} isExpanded={expandedSections.availability} onToggle={() => toggleSection('availability')}>
              <AvailabilitySection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="Booking Questions" icon={HelpCircle} isExpanded={expandedSections.questions} onToggle={() => toggleSection('questions')}>
              <BookingQuestionsSection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="Workflow Automation" icon={Zap} isExpanded={expandedSections.workflows} onToggle={() => toggleSection('workflows')}>
              <WorkflowSection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="GTM Intelligence" icon={TrendingUp} isExpanded={expandedSections.gtm} onToggle={() => toggleSection('gtm')}>
              <GTMSection eventTemplate={eventTemplate} updateTemplate={updateTemplate} />
            </Accordion>
            <Accordion title="Analytics Preview" icon={BarChart} isExpanded={expandedSections.analytics} onToggle={() => toggleSection('analytics')}>
              <AnalyticsSection eventTemplate={eventTemplate} />
            </Accordion>
          </div>
        </div> */}
        {/* Sticky Footer */}
        {/* <div className="sticky bottom-0 z-30 bg-white border-t border-gray-200 p-5 flex flex-col sm:flex-row justify-between items-center shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)] space-y-3 sm:space-y-0">
          <div className="flex space-x-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm">Cancel</button>
            <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Reset</button>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-lg transition-all flex items-center justify-center space-x-2"><span>Preview</span> <ExternalLink className="w-4 h-4" /></button>
            <button className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-all flex items-center justify-center space-x-2 shadow-sm ${isSaving ? 'bg-blue-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:bg-blue-800'}`}
              disabled={isSaving}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div> */}
      </div>
    </>
  );
}

import {
  X, MoreHorizontal, Copy, Archive, Trash2, ExternalLink,
  Clock, MapPin, Calendar, HelpCircle, Zap, TrendingUp, BarChart,
  ChevronDown, ChevronUp, Plus, Edit2, Check, AlertCircle, Video,
  GripVertical, Save, RefreshCw
} from 'lucide-react';

const DurationSection = ({ eventTemplate, updateTemplate }) => (
  <div className="p-6 bg-white">
    <div className="flex items-center space-x-3 mb-4">
      <Clock className="w-5 h-5 text-gray-400" />
      <span className="text-sm font-medium text-gray-700">Duration</span>
    </div>
    <div className="relative">
      <select
        className="w-full sm:w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border appearance-none bg-white"
        value={eventTemplate.duration}
        onChange={(e) => updateTemplate('duration', parseInt(e.target.value))}
      >
        <option value={15}>15 min</option>
        <option value={30}>30 min</option>
        <option value={45}>45 min</option>
        <option value={60}>60 min</option>
        <option value="custom">Custom</option>
      </select>
      <div className="absolute inset-y-0 right-0 sm:right-[calc(100%-16rem)] pr-3 flex items-center pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
);

const LocationSection = ({ eventTemplate, updateTemplate }) => (
  <div className="p-6 bg-white">
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
        <div className="relative">
          <select
            className="w-full sm:w-80 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border pl-10 appearance-none bg-white"
            value={eventTemplate.provider}
            onChange={(e) => updateTemplate('provider', e.target.value)}
          >
            <option value="Google Meet">Google Meet</option>
            <option value="Zoom">Zoom</option>
            <option value="Teams">Microsoft Teams</option>
            <option value="Open Meeting">Open Meeting</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Video className="h-4 w-4 text-gray-500" />
          </div>
          <div className="absolute inset-y-0 right-0 sm:right-[calc(100%-20rem)] pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-md p-3.5 flex items-start space-x-3 border border-green-100 sm:w-80">
        <div className="flex-shrink-0 mt-0.5">
          <Check className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-green-900">Connected to {eventTemplate.provider}</h4>
          <p className="text-xs text-green-700 mt-1">Provider connection active and syncing.</p>
        </div>
      </div>
    </div>
  </div>
);

const AvailabilitySection = ({ eventTemplate, updateTemplate }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-6 space-y-8 bg-white">
      {/* Booking Window */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Booking Window</h4>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700 leading-relaxed flex flex-wrap items-center gap-2">
            <span>Invitees can schedule</span>
            <select
              className="border-gray-300 rounded-md py-1.5 px-2 text-sm border bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={eventTemplate.bookingWindowDays}
              onChange={e => updateTemplate('bookingWindowDays', parseInt(e.target.value))}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <span>into the future with at least</span>
            <select
              className="border-gray-300 rounded-md py-1.5 px-2 text-sm border bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={eventTemplate.minNoticeHours}
              onChange={e => updateTemplate('minNoticeHours', parseInt(e.target.value))}
            >
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
            </select>
            <span>notice.</span>
          </div>
        </div>
      </div>

      {/* Schedule Selector */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Schedule</h4>
        <div className="relative inline-block w-full sm:w-72">
          <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border appearance-none bg-white mb-3">
            <option>Working hours (default)</option>
            <option>Custom hours</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none pb-3">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50/50 border border-blue-100 p-3.5 rounded-md sm:w-3/4">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>This event type uses weekly and custom hours saved on schedule.</p>
          <button className="text-blue-600 hover:text-blue-800 ml-auto flex-shrink-0 p-0.5 bg-blue-100/50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Timezone</h4>
        <div className="relative w-full sm:w-80">
          <select
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border appearance-none bg-white"
            value={eventTemplate.timezone}
            onChange={(e) => updateTemplate('timezone', e.target.value)}
          >
            <option>Eastern Time - US & Canada</option>
            <option>Pacific Time - US & Canada</option>
            <option>Central Time - US & Canada</option>
            <option>Greenwich Mean Time</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Weekly Hours */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Weekly Hours</h4>
        <div className="space-y-4">
          {days.map(day => {
            const dayData = eventTemplate.weeklyHours[day];
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-start py-2 sm:py-0 border-b sm:border-0 border-gray-100 last:border-0">
                <div className="w-32 flex items-center space-x-3 mb-2 sm:mb-0">
                  <input
                    type="checkbox"
                    checked={dayData.available}
                    onChange={() => {
                      const newHours = { ...eventTemplate.weeklyHours };
                      newHours[day].available = !newHours[day].available;
                      if (newHours[day].available && newHours[day].intervals.length === 0) {
                        newHours[day].intervals = [{ start: '09:00', end: '17:00' }];
                      }
                      updateTemplate('weeklyHours', newHours);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${dayData.available ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {day.substring(0, 3).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  {!dayData.available ? (
                    <span className="text-sm text-gray-400 py-1.5 inline-block">Unavailable</span>
                  ) : (
                    <div className="space-y-2">
                      {dayData.intervals.map((interval, idx) => (
                        <div key={idx} className="flex items-center space-x-3 group">
                          <input
                            type="time"
                            value={interval.start}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1.5 border bg-white w-28"
                            onChange={(e) => {
                              const newHours = { ...eventTemplate.weeklyHours };
                              newHours[day].intervals[idx].start = e.target.value;
                              updateTemplate('weeklyHours', newHours);
                            }}
                          />
                          <span className="text-gray-400 text-sm">-</span>
                          <input
                            type="time"
                            value={interval.end}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1.5 border bg-white w-28"
                            onChange={(e) => {
                              const newHours = { ...eventTemplate.weeklyHours };
                              newHours[day].intervals[idx].end = e.target.value;
                              updateTemplate('weeklyHours', newHours);
                            }}
                          />
                          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                            <button className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors" onClick={() => {
                              const newHours = { ...eventTemplate.weeklyHours };
                              newHours[day].intervals.splice(idx, 1);
                              if (newHours[day].intervals.length === 0) newHours[day].available = false;
                              updateTemplate('weeklyHours', newHours);
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {idx === dayData.intervals.length - 1 && (
                              <button className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors" onClick={() => {
                                const newHours = { ...eventTemplate.weeklyHours };
                                newHours[day].intervals.push({ start: '13:00', end: '17:00' });
                                updateTemplate('weeklyHours', newHours);
                              }}>
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-8 hidden sm:flex justify-end mt-1">
                  <button className="text-gray-300 hover:text-gray-600 p-1"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date overrides */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Date-specific Hours</h4>
        <div className="text-sm text-gray-500 mb-4">None</div>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center space-x-1 border border-blue-200 px-3 py-1.5 rounded bg-blue-50/50 hover:bg-blue-100 transition-colors">
          <Plus className="w-4 h-4" /> <span>Add date override</span>
        </button>
      </div>

    </div>
  );
};

const BookingQuestionsSection = ({ eventTemplate, updateTemplate }) => (
  <div className="p-6 bg-gray-50/50">
    <div className="space-y-3">
      {eventTemplate.customQuestions.map((q, idx) => (
        <div key={q.id} className="flex items-start space-x-3 p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="mt-1 cursor-grab text-gray-300 group-hover:text-gray-500 active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <span className="text-sm font-medium text-gray-900 mb-2 sm:mb-0">{q.label}</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => {
                      const newQ = [...eventTemplate.customQuestions];
                      newQ[idx].required = e.target.checked;
                      updateTemplate('customQuestions', newQ);
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Required</span>
                </label>
                <button className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{q.type}</div>
          </div>
        </div>
      ))}
    </div>
    <button className="mt-5 text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center space-x-1.5 border border-blue-200 rounded-lg px-4 py-2.5 bg-white shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center">
      <Plus className="w-4 h-4" /> <span>Add new question</span>
    </button>
  </div>
);

const WorkflowSection = ({ eventTemplate, updateTemplate }) => {
  const workflows = [
    { key: 'emailReminders', label: 'Email Reminders', desc: 'Send automated email reminders to invitees before the event.' },
    { key: 'smsReminders', label: 'SMS Reminders', desc: 'Send text message reminders to invitees (requires integration).' },
    { key: 'followUp', label: 'Follow-up Automation', desc: 'Send automated follow-up emails after the event concludes.' },
    { key: 'webhookTrigger', label: 'Webhook Trigger', desc: 'Send event data payloads to external systems and APIs.' },
    { key: 'crmSync', label: 'CRM Sync', desc: 'Automatically sync bookings and records to Salesforce/HubSpot.' },
    { key: 'slackAlerts', label: 'Slack Alerts', desc: 'Notify your team in Slack channels when an event is booked.' },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="grid gap-4 sm:grid-cols-2">
        {workflows.map(wf => (
          <div key={wf.key} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all bg-white cursor-pointer group" onClick={() => updateTemplate('workflows', { ...eventTemplate.workflows, [wf.key]: !eventTemplate.workflows[wf.key] })}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={eventTemplate.workflows[wf.key]}
                onChange={() => { }} // Handled by parent div click
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-900 cursor-pointer group-hover:text-blue-700 transition-colors">{wf.label}</label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{wf.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GTMSection = ({ eventTemplate, updateTemplate }) => {
  const fields = [
    { label: 'Lead Score Threshold', value: eventTemplate.gtm.leadScore, key: 'leadScore', options: ['High Intent (A)', 'Medium (B)', 'Low (C)'] },
    { label: 'Routing Rule', value: eventTemplate.gtm.routingRule, key: 'routingRule', options: ['Enterprise Round Robin', 'Strict Ownership', 'Pooled Territory'] },
    { label: 'Account Type', value: eventTemplate.gtm.accountType, key: 'accountType', options: ['Enterprise', 'Mid-Market', 'SMB'] },
    { label: 'Priority', value: eventTemplate.gtm.priority, key: 'priority', options: ['P1', 'P2', 'P3'] },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="grid gap-5 sm:grid-cols-2 mb-8">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{field.label}</label>
            <div className="relative">
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border appearance-none bg-gray-50 hover:bg-white transition-colors"
                value={field.value}
                onChange={(e) => updateTemplate('gtm', { ...eventTemplate.gtm, [field.key]: e.target.value })}
              >
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Tracking & Attribution</h4>
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={eventTemplate.gtm.sourceTracking}
              onChange={(e) => updateTemplate('gtm', { ...eventTemplate.gtm, sourceTracking: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Enable UTM source tracking parameters</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={eventTemplate.gtm.campaignAttribution}
              onChange={(e) => updateTemplate('gtm', { ...eventTemplate.gtm, campaignAttribution: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Sync and map to active marketing campaigns</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const AnalyticsSection = ({ eventTemplate }) => {
  const stats = [
    { label: 'Total Bookings', value: eventTemplate.analytics.totalBookings, trend: '+12%' },
    { label: 'No-show Rate', value: `${eventTemplate.analytics.noShowRate}%`, trend: '-1.2%' },
    { label: 'Conversion', value: `${eventTemplate.analytics.conversionRate}%`, trend: '+4.5%' },
    { label: 'Avg Response', value: eventTemplate.analytics.avgResponse, trend: '-30s' },
    { label: 'Revenue Influenced', value: eventTemplate.analytics.revenueInfluenced, trend: '+22%' },
    { label: 'Active Leads', value: eventTemplate.analytics.activeLeads, trend: 'N/A' },
  ];
  return (
    <div className="p-6 bg-gray-50/50">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{stat.label}</div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              {stat.trend !== 'N/A' && (
                <div className={`text-xs font-medium mb-1 ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

