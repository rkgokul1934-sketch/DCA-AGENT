import React, { useState, useEffect } from 'react';

export default function Availability() {
    const [activeTab, setActiveTab] = useState('matrix');
    const [selectedDate, setSelectedDate] = useState('2026-06-01');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reps, setReps] = useState([]);
    const [toast, setToast] = useState(null);

    // Tab 2: Weekly Hours state
    const [timezone, setTimezone] = useState('America/New_York');
    const [weeklySchedule, setWeeklySchedule] = useState({
        monday: { active: true, intervals: [{ start: '09:00', end: '17:00' }] },
        tuesday: { active: true, intervals: [{ start: '09:00', end: '17:00' }] },
        wednesday: { active: true, intervals: [{ start: '09:00', end: '17:00' }] },
        thursday: { active: true, intervals: [{ start: '09:00', end: '17:00' }] },
        friday: { active: true, intervals: [{ start: '09:00', end: '17:00' }] },
        saturday: { active: false, intervals: [{ start: '09:00', end: '17:00' }] },
        sunday: { active: false, intervals: [{ start: '09:00', end: '17:00' }] }
    });

    // Tab 3: Limits & Buffers state
    const [minNotice, setMinNotice] = useState('4_hours');
    const [bufferBefore, setBufferBefore] = useState('15_mins');
    const [bufferAfter, setBufferAfter] = useState('15_mins');
    const [maxDailyBookings, setMaxDailyBookings] = useState(6);

    // Tab 4: Date Overrides state
    const [overrides, setOverrides] = useState([
        { date: '2026-07-04', unavailable: true, reason: 'Independence Day Holiday' },
        { date: '2026-06-15', unavailable: false, start: '10:00', end: '14:00', reason: 'Team Building Offsite' }
    ]);
    const [newOverrideDate, setNewOverrideDate] = useState('');
    const [newOverrideType, setNewOverrideType] = useState('unavailable');
    const [newOverrideStart, setNewOverrideStart] = useState('09:00');
    const [newOverrideEnd, setNewOverrideEnd] = useState('17:00');
    const [newOverrideReason, setNewOverrideReason] = useState('');

    // Tab 5: Connected Calendars state
    const [calendars, setCalendars] = useState({
        google: true,
        outlook: false,
        apple: false,
        zoom: true,
        teams: false
    });

    // Load initial state from backend (with localStorage fallbacks)
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Fetch weekly schedule
                const resSchedule = await fetch('/api/v1/availability/weekly_schedule');
                const dataSchedule = await resSchedule.json();
                if (dataSchedule.value && Object.keys(dataSchedule.value).length > 0) {
                    setWeeklySchedule(dataSchedule.value);
                    localStorage.setItem('dca_weekly_schedule', JSON.stringify(dataSchedule.value));
                } else {
                    const savedSchedule = localStorage.getItem('dca_weekly_schedule');
                    if (savedSchedule) setWeeklySchedule(JSON.parse(savedSchedule));
                }

                // Fetch timezone
                const resTimezone = await fetch('/api/v1/availability/timezone');
                const dataTimezone = await resTimezone.json();
                if (dataTimezone.value && Object.keys(dataTimezone.value).length > 0) {
                    setTimezone(dataTimezone.value.timezone || 'Asia/Kolkata');
                    localStorage.setItem('dca_timezone', dataTimezone.value.timezone || 'Asia/Kolkata');
                } else {
                    const savedTimezone = localStorage.getItem('dca_timezone');
                    if (savedTimezone) setTimezone(savedTimezone);
                }

                // Fetch scheduling limits
                const resLimits = await fetch('/api/v1/availability/scheduling_limits');
                const dataLimits = await resLimits.json();
                if (dataLimits.value && Object.keys(dataLimits.value).length > 0) {
                    const limits = dataLimits.value;
                    setMinNotice(limits.minNotice);
                    setBufferBefore(limits.bufferBefore);
                    setBufferAfter(limits.bufferAfter);
                    setMaxDailyBookings(limits.maxDailyBookings);
                    localStorage.setItem('dca_scheduling_limits', JSON.stringify(limits));
                } else {
                    const savedLimits = localStorage.getItem('dca_scheduling_limits');
                    if (savedLimits) {
                        const limits = JSON.parse(savedLimits);
                        setMinNotice(limits.minNotice);
                        setBufferBefore(limits.bufferBefore);
                        setBufferAfter(limits.bufferAfter);
                        setMaxDailyBookings(limits.maxDailyBookings);
                    }
                }

                // Fetch date overrides
                const resOverrides = await fetch('/api/v1/availability/date_overrides');
                const dataOverrides = await resOverrides.json();
                if (dataOverrides.value && Array.isArray(dataOverrides.value.overrides)) {
                    setOverrides(dataOverrides.value.overrides);
                    localStorage.setItem('dca_date_overrides', JSON.stringify(dataOverrides.value.overrides));
                } else {
                    const savedOverrides = localStorage.getItem('dca_date_overrides');
                    if (savedOverrides) setOverrides(JSON.parse(savedOverrides));
                }

                // Fetch connected calendars
                const resCals = await fetch('/api/v1/availability/connected_calendars');
                const dataCals = await resCals.json();
                if (dataCals.value && Object.keys(dataCals.value).length > 0) {
                    setCalendars(dataCals.value);
                    localStorage.setItem('dca_connected_calendars', JSON.stringify(dataCals.value));
                } else {
                    const savedCals = localStorage.getItem('dca_connected_calendars');
                    if (savedCals) setCalendars(JSON.parse(savedCals));
                }

            } catch (err) {
                console.error("Error loading settings from endpoint, using localStorage cache:", err);
                const savedSchedule = localStorage.getItem('dca_weekly_schedule');
                const savedTimezone = localStorage.getItem('dca_timezone');
                const savedLimits = localStorage.getItem('dca_scheduling_limits');
                const savedOverrides = localStorage.getItem('dca_date_overrides');
                const savedCals = localStorage.getItem('dca_connected_calendars');

                if (savedSchedule) setWeeklySchedule(JSON.parse(savedSchedule));
                if (savedTimezone) setTimezone(savedTimezone);
                if (savedLimits) {
                    const limits = JSON.parse(savedLimits);
                    setMinNotice(limits.minNotice);
                    setBufferBefore(limits.bufferBefore);
                    setBufferAfter(limits.bufferAfter);
                    setMaxDailyBookings(limits.maxDailyBookings);
                }
                if (savedOverrides) setOverrides(JSON.parse(savedOverrides));
                if (savedCals) setCalendars(JSON.parse(savedCals));
            }
        };

        loadSettings();
    }, []);

    // Save helpers
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const saveWeeklySchedule = async () => {
        localStorage.setItem('dca_weekly_schedule', JSON.stringify(weeklySchedule));
        localStorage.setItem('dca_timezone', timezone);
        try {
            await fetch('/api/v1/availability/weekly_schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: weeklySchedule })
            });
            await fetch('/api/v1/availability/timezone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: { timezone } })
            });
        } catch (e) {
            console.error("Failed to save weekly schedule to endpoint:", e);
        }
        showToast('Weekly hours schedule updated successfully!');
    };

    const saveLimits = async () => {
        const limits = {
            minNotice,
            bufferBefore,
            bufferAfter,
            maxDailyBookings
        };
        localStorage.setItem('dca_scheduling_limits', JSON.stringify(limits));
        try {
            await fetch('/api/v1/availability/scheduling_limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: limits })
            });
        } catch (e) {
            console.error("Failed to save limits to endpoint:", e);
        }
        showToast('Limits and buffer configurations updated!');
    };

    const saveOverrides = async (updatedOverrides) => {
        setOverrides(updatedOverrides);
        localStorage.setItem('dca_date_overrides', JSON.stringify(updatedOverrides));
        try {
            await fetch('/api/v1/availability/date_overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: { overrides: updatedOverrides } })
            });
        } catch (e) {
            console.error("Failed to save overrides to endpoint:", e);
        }
    };

    const toggleCalendar = async (key) => {
        const updated = { ...calendars, [key]: !calendars[key] };
        setCalendars(updated);
        localStorage.setItem('dca_connected_calendars', JSON.stringify(updated));
        try {
            await fetch('/api/v1/availability/connected_calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: updated })
            });
        } catch (e) {
            console.error("Failed to save calendars to endpoint:", e);
        }
        showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} integration toggled.`);
    };

    // Split shift addition/removal
    const addInterval = (day) => {
        const updated = { ...weeklySchedule };
        updated[day].intervals.push({ start: '13:00', end: '17:00' });
        setWeeklySchedule(updated);
    };

    const removeInterval = (day, index) => {
        const updated = { ...weeklySchedule };
        updated[day].intervals.splice(index, 1);
        setWeeklySchedule(updated);
    };

    const updateInterval = (day, index, field, val) => {
        const updated = { ...weeklySchedule };
        updated[day].intervals[index][field] = val;
        setWeeklySchedule(updated);
    };

    const toggleDayActive = (day) => {
        const updated = { ...weeklySchedule };
        updated[day].active = !updated[day].active;
        setWeeklySchedule(updated);
    };

    useEffect(() => {
        fetchSlots(selectedDate);
        fetchRepWorkload();
    }, [selectedDate]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [slots, reps, activeTab]);

    const fetchSlots = async (dateVal) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch(`/api/v1/legacy-bookings/available-slots?date=${dateVal}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (res.ok) {
                // Apply client-side override filters
                const dayOfWeek = new Date(dateVal).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const matchedOverride = overrides.find(o => o.date === dateVal);
                const scheduleRule = weeklySchedule[dayOfWeek];

                let filtered = data;

                if (matchedOverride) {
                    if (matchedOverride.unavailable) {
                        filtered = [];
                    } else {
                        filtered = data.filter(slot => {
                            const [h, m] = slot.start_time.split(':').map(Number);
                            const slotMinutes = h * 60 + m;
                            const [sh, sm] = matchedOverride.start.split(':').map(Number);
                            const [eh, em] = matchedOverride.end.split(':').map(Number);
                            return slotMinutes >= (sh * 60 + sm) && slotMinutes < (eh * 60 + em);
                        });
                    }
                } else if (scheduleRule && !scheduleRule.active) {
                    filtered = [];
                } else if (scheduleRule) {
                    filtered = data.filter(slot => {
                        const [h, m] = slot.start_time.split(':').map(Number);
                        const slotMinutes = h * 60 + m;
                        return scheduleRule.intervals.some(interval => {
                            const [sh, sm] = interval.start.split(':').map(Number);
                            const [eh, em] = interval.end.split(':').map(Number);
                            return slotMinutes >= (sh * 60 + sm) && slotMinutes < (eh * 60 + em);
                        });
                    });
                }
                setSlots(filtered);
            }
        } catch (e) {
            console.error("Error fetching slots:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRepWorkload = async () => {
        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch('/api/v1/enterprise/rep/workload', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (res.ok) {
                setReps(data);
            }
        } catch (e) {
            console.error("Error fetching rep workloads:", e);
        }
    };

    const handleAddOverride = () => {
        if (!newOverrideDate) return;
        const newObj = {
            date: newOverrideDate,
            unavailable: newOverrideType === 'unavailable',
            start: newOverrideStart,
            end: newOverrideEnd,
            reason: newOverrideReason || 'Custom override hours'
        };
        const updated = [...overrides, newObj];
        saveOverrides(updated);
        setNewOverrideDate('');
        setNewOverrideReason('');
        showToast(`Override date ${newOverrideDate} added!`);
        fetchSlots(selectedDate);
    };

    const handleDeleteOverride = (idx) => {
        const updated = overrides.filter((_, i) => i !== idx);
        saveOverrides(updated);
        showToast('Override date removed.');
        fetchSlots(selectedDate);
    };

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i data-lucide="clock" style={{ color: 'var(--accent-blue)' }}></i>
                        Calendly Availability Control
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                        Configure split shifts, holiday overrides, timezone preferences, dynamic buffer zones, and calendar integrations.
                    </p>
                </div>
            </div>

            {/* Notification Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#1e1b4b', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: '0.8rem', fontWeight: 700, animation: 'slideIn 0.3s ease' }}>
                    ✅ {toast}
                </div>
            )}

            {/* Tab Switching Menu */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', gap: '1.5rem', marginBottom: '0.5rem' }}>
                {[
                    { id: 'matrix', label: 'Availability Matrix', icon: 'calendar' },
                    { id: 'hours', label: 'Weekly Hours', icon: 'clock' },
                    { id: 'limits', label: 'Limits & Buffers', icon: 'sliders' },
                    { id: 'overrides', label: 'Date Overrides', icon: 'calendar-days' },
                    { id: 'integrations', label: 'Connected Calendars', icon: 'link' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '12px 4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: activeTab === tab.id ? 900 : 600,
                            color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab.id ? '2.5px solid var(--accent-blue)' : '2.5px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i data-lucide={tab.icon} style={{ width: '14px', height: '14px' }}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT 1: SLOT MATRIX */}
            {activeTab === 'matrix' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2rem' }}>
                    
                    {/* Left Panel: Matrix Finder */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0 }}>
                                <i data-lucide="calendar-check" style={{ color: 'var(--accent-blue)' }}></i>
                                Live Available Slots
                            </h3>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ 
                                    background: 'rgba(0,0,0,0.02)', 
                                    border: '1px solid var(--glass-border)', 
                                    padding: '0.5rem 0.8rem', 
                                    borderRadius: '10px', 
                                    color: 'var(--text-primary)', 
                                    fontSize: '0.8rem', 
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--accent-blue)', gap: '10px' }}>
                                <div style={{ width: '24px', height: '24px', border: '3px solid rgba(99,102,241,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Synchronizing active calendars...</span>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <span>Showing slots for target date: <strong>{selectedDate}</strong></span>
                                    <span>{slots.length} Slots available</span>
                                </div>

                                {slots.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', border: '1.5px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        No availability matches the rules configured for this date.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                                        {slots.map((slot, index) => (
                                            <div 
                                                key={index}
                                                style={{
                                                    background: slot.is_recommended ? 'rgba(79, 70, 229, 0.04)' : '#f8fafc',
                                                    border: `1px solid ${slot.is_recommended ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                                                    borderRadius: '14px',
                                                    padding: '1rem 0.8rem',
                                                    textAlign: 'center',
                                                    position: 'relative'
                                                }}
                                            >
                                                {slot.is_recommended && (
                                                    <span style={{ 
                                                        position: 'absolute', 
                                                        top: '-8px', 
                                                        left: '50%', 
                                                        transform: 'translateX(-50%)', 
                                                        background: 'var(--accent-blue)', 
                                                        color: 'white', 
                                                        fontSize: '0.5rem', 
                                                        fontWeight: 850, 
                                                        padding: '1px 6px', 
                                                        borderRadius: '6px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        AI Pick
                                                    </span>
                                                )}
                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{slot.start_time || slot.user_time}</div>
                                                <div style={{ fontSize: '0.6rem', color: slot.is_recommended ? 'var(--accent-blue)' : 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {slot.recommendation_reason || 'Open Slot'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Workloads */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0 }}>
                                <i data-lucide="bar-chart-2" style={{ color: 'var(--accent-blue)' }}></i>
                                Active Rep Workload Balancer
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reps.map((rep, idx) => (
                                <div 
                                    key={idx} 
                                    style={{ 
                                        padding: '1rem', 
                                        background: '#f8fafc', 
                                        borderRadius: '16px', 
                                        border: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rep.name}</span>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                                Lead Conversion Rate: <strong>{rep.conversion_rate || rep.conversionRate || 30}%</strong>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            fontSize: '0.6rem', 
                                            padding: '2px 8px', 
                                            borderRadius: '8px', 
                                            fontWeight: 800,
                                            background: rep.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: rep.status === 'Active' ? '#10b981' : '#ef4444'
                                        }}>
                                            {rep.status}
                                        </span>
                                    </div>

                                    {/* Workload Progress Bar */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                            <span>Workload Utilization</span>
                                            <span>{rep.utilization}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                height: '100%', 
                                                background: rep.utilization > 75 ? '#ef4444' : 'var(--accent-blue)', 
                                                width: `${rep.utilization}%`,
                                                transition: 'width 0.4s ease-out'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: WEEKLY HOURS */}
            {activeTab === 'hours' && (
                <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Weekly Hours Schedule</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Define hours of availability for recurring slots.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Timezone:</span>
                            <select 
                                value={timezone} 
                                onChange={(e) => setTimezone(e.target.value)}
                                style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', outline: 'none' }}
                            >
                                <option value="America/New_York">Eastern Time (US & Canada)</option>
                                <option value="America/Chicago">Central Time (US & Canada)</option>
                                <option value="America/Denver">Mountain Time (US & Canada)</option>
                                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                <option value="Europe/London">London / GMT</option>
                                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {Object.keys(weeklySchedule).map((day) => {
                            const dayConfig = weeklySchedule[day];
                            return (
                                <div key={day} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', gap: '2rem' }}>
                                    <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={dayConfig.active} 
                                            onChange={() => toggleDayActive(day)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'capitalize', color: dayConfig.active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                            {day}
                                        </span>
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {!dayConfig.active ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingTop: '4px' }}>Unavailable</span>
                                        ) : (
                                            dayConfig.intervals.map((interval, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="time" 
                                                        value={interval.start}
                                                        onChange={(e) => updateInterval(day, idx, 'start', e.target.value)}
                                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem' }}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to</span>
                                                    <input 
                                                        type="time" 
                                                        value={interval.end}
                                                        onChange={(e) => updateInterval(day, idx, 'end', e.target.value)}
                                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem' }}
                                                    />
                                                    {dayConfig.intervals.length > 1 && (
                                                        <button 
                                                            onClick={() => removeInterval(day, idx)}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                                            title="Remove Split Shift"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                    {idx === dayConfig.intervals.length - 1 && (
                                                        <button 
                                                            onClick={() => addInterval(day)}
                                                            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', marginLeft: '8px' }}
                                                        >
                                                            + Add Split Shift
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button 
                            onClick={saveWeeklySchedule}
                            style={{ background: 'var(--accent-blue)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
                        >
                            Save Weekly Hours
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: LIMITS & BUFFERS */}
            {activeTab === 'limits' && (
                <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Scheduling Limits & Buffers</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Set guardrails to prevent meeting exhaustion and ensure pre-meeting prep time.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>Minimum Scheduling Notice</label>
                                <select 
                                    value={minNotice} 
                                    onChange={(e) => setMinNotice(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                >
                                    <option value="none">No minimum notice</option>
                                    <option value="1_hour">1 Hour notice</option>
                                    <option value="4_hours">4 Hours notice</option>
                                    <option value="24_hours">24 Hours notice</option>
                                    <option value="48_hours">48 Hours notice</option>
                                </select>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Prevents prospects from booking too close to current time.</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>Max Bookings Per Day</label>
                                <input 
                                    type="number" 
                                    value={maxDailyBookings} 
                                    onChange={(e) => setMaxDailyBookings(Number(e.target.value))}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                />
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Cap total scheduled slots per host/calendar each day.</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>Before Event Buffer</label>
                                <select 
                                    value={bufferBefore} 
                                    onChange={(e) => setBufferBefore(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                >
                                    <option value="none">No buffer</option>
                                    <option value="5_mins">5 minutes</option>
                                    <option value="10_mins">10 minutes</option>
                                    <option value="15_mins">15 minutes</option>
                                    <option value="30_mins">30 minutes</option>
                                </select>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Incorporate prep block before booking start times.</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>After Event Buffer</label>
                                <select 
                                    value={bufferAfter} 
                                    onChange={(e) => setBufferAfter(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                >
                                    <option value="none">No buffer</option>
                                    <option value="5_mins">5 minutes</option>
                                    <option value="10_mins">10 minutes</option>
                                    <option value="15_mins">15 minutes</option>
                                    <option value="30_mins">30 minutes</option>
                                </select>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Wrap up meetings cleanly without immediate back-to-backs.</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button 
                            onClick={saveLimits}
                            style={{ background: 'var(--accent-blue)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
                        >
                            Save Settings & Buffers
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: DATE OVERRIDES */}
            {activeTab === 'overrides' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                    
                    {/* Left Override Creator */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Add Date Override</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Target Date</label>
                                <input 
                                    type="date" 
                                    value={newOverrideDate} 
                                    onChange={(e) => setNewOverrideDate(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Override Action</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="overrideType" 
                                            value="unavailable" 
                                            checked={newOverrideType === 'unavailable'} 
                                            onChange={() => setNewOverrideType('unavailable')} 
                                        />
                                        Unavailable (Vacation/Holiday)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="overrideType" 
                                            value="custom" 
                                            checked={newOverrideType === 'custom'} 
                                            onChange={() => setNewOverrideType('custom')} 
                                        />
                                        Custom Hours
                                    </label>
                                </div>
                            </div>

                            {newOverrideType === 'custom' && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                        type="time" 
                                        value={newOverrideStart} 
                                        onChange={(e) => setNewOverrideStart(e.target.value)}
                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', flex: 1 }}
                                    />
                                    <span style={{ fontSize: '0.75rem' }}>to</span>
                                    <input 
                                        type="time" 
                                        value={newOverrideEnd} 
                                        onChange={(e) => setNewOverrideEnd(e.target.value)}
                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', flex: 1 }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Reason / Note</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Independence Day holiday"
                                    value={newOverrideReason} 
                                    onChange={(e) => setNewOverrideReason(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <button 
                                onClick={handleAddOverride}
                                style={{ background: 'var(--accent-blue)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
                            >
                                Apply Override Date
                            </button>
                        </div>
                    </div>

                    {/* Right Overrides Listing */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Configured Holiday & Overrides Exceptions</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {overrides.length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1.5rem', textAlign: 'center' }}>
                                    No custom overrides registered yet.
                                </div>
                            ) : (
                                overrides.map((override, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{override.date}</span>
                                                <span style={{ 
                                                    fontSize: '0.55rem', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '6px', 
                                                    fontWeight: 800, 
                                                    background: override.unavailable ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                                    color: override.unavailable ? '#ef4444' : '#10b981'
                                                }}>
                                                    {override.unavailable ? 'Unavailable' : `${override.start}-${override.end}`}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{override.reason}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteOverride(idx)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem' }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 5: CONNECTED CALENDARS */}
            {activeTab === 'integrations' && (
                <div style={{ background: '#ffffff', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Connected Calendars & Video Providers</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sync your booking engine with external hosting platforms to cross-check scheduling conflicts automatically.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        
                        {/* Google Calendar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i data-lucide="calendar" style={{ color: 'var(--accent-blue)', width: '20px', height: '20px' }}></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Google Calendar Sync</span>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Checks conflict and schedules invites.</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleCalendar('google')}
                                style={{ 
                                    background: calendars.google ? '#ef4444' : 'var(--accent-blue)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer' 
                                }}
                            >
                                {calendars.google ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        {/* Outlook Calendar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i data-lucide="mail" style={{ color: 'var(--accent-blue)', width: '20px', height: '20px' }}></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Office 365 / Outlook</span>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Import active team workloads.</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleCalendar('outlook')}
                                style={{ 
                                    background: calendars.outlook ? '#ef4444' : 'var(--accent-blue)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer' 
                                }}
                            >
                                {calendars.outlook ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        {/* Zoom Integration */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i data-lucide="video" style={{ color: 'var(--accent-blue)', width: '20px', height: '20px' }}></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Zoom Meetings</span>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Instantly create unique conference links.</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleCalendar('zoom')}
                                style={{ 
                                    background: calendars.zoom ? '#ef4444' : 'var(--accent-blue)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer' 
                                }}
                            >
                                {calendars.zoom ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        {/* Microsoft Teams */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i data-lucide="users" style={{ color: 'var(--accent-blue)', width: '20px', height: '20px' }}></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Microsoft Teams</span>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Link corporate business accounts.</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleCalendar('teams')}
                                style={{ 
                                    background: calendars.teams ? '#ef4444' : 'var(--accent-blue)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer' 
                                }}
                            >
                                {calendars.teams ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
