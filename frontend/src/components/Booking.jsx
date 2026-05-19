import React, { useState, useEffect } from 'react';

export default function Booking({ onNavigate, urlParams }) {
    const [screen, setScreen] = useState('selection'); // selection, host, date, form, success
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [selectedHost, setSelectedHost] = useState(null);
    const [selectedDate, setSelectedDate] = useState('2026-06-01');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [notes, setNotes] = useState('');

    // Booking success data
    const [successData, setSuccessData] = useState(null);

    // Dynamic Meeting Types State (starts with static defaults)
    const [meetingTypes, setMeetingTypes] = useState([
        { id: 1, name: 'Product Demo', duration: '30 Min', slug: 'demo', desc: 'Deep dive overview of RevOps orchestration, live pipelines, and database automations.', icon: 'monitor' },
        { id: 2, name: 'Executive Strategy', duration: '45 Min', slug: 'strategy', desc: 'Bespoke alignment session covering BANT qualification parameters and custom sales integration.', icon: 'award' },
        { id: 3, name: 'Technical Setup', duration: '60 Min', slug: 'deepdive', desc: 'Advanced session regarding CRM OAuth handshakes, custom triggers, and system audit trails.', icon: 'file-code' }
    ]);

    // Initial prefill
    useEffect(() => {
        const userStr = localStorage.getItem('dca_user');
        if (userStr) {
            try {
                const profile = JSON.parse(userStr);
                if (profile.name) setName(profile.name);
                if (profile.email) setEmail(profile.email);
            } catch (e) { }
        }
    }, [screen]);

    // Load templates from API database and merge them
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const response = await fetch('/api/v1/event-templates/');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const mapped = data.map(t => ({
                            id: t.id,
                            name: t.title,
                            duration: `${t.duration} Min`,
                            slug: t.slug,
                            desc: t.description || 'No description provided.',
                            icon: t.slug === 'demo' ? 'monitor' : t.slug === 'strategy' ? 'award' : t.slug === 'deepdive' ? 'file-code' : 'calendar'
                        }));
                        // Merge database templates with the static list (avoid duplicates by slug)
                        setMeetingTypes(prev => {
                            const combined = [...prev];
                            mapped.forEach(m => {
                                const idx = combined.findIndex(item => item.slug === m.slug);
                                if (idx > -1) {
                                    combined[idx] = m;
                                } else {
                                    combined.push(m);
                                }
                            });
                            return combined;
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load templates in booking:", err);
            }
        };
        loadTemplates();
    }, []);

    // Automatically route to target step when 'event' param is matched
    useEffect(() => {
        const params = new URLSearchParams(urlParams || window.location.hash.split('?')[1] || '');
        const eventSlug = params.get('event');
        if (eventSlug && meetingTypes.length > 0) {
            const matched = meetingTypes.find(m => m.slug === eventSlug);
            if (matched) {
                setSelectedMeeting(matched);
                setSelectedHost({ id: 2, name: 'AI Auto-Assign', title: 'Intelligent Round-Robin Selector', details: 'AI balances workloads dynamically, assigning to the most optimized rep.', conversion: '35%', score: '98', icon: 'zap' });
                // Retrieve initial available slots for the selectedDate
                fetchAvailableSlots(selectedDate);
                setScreen('date');
            }
        }
    }, [urlParams, meetingTypes]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [screen, selectedMeeting, availableSlots]);

    // Fetch availability
    const fetchAvailableSlots = async (targetDate) => {
        setLoadingSlots(true);
        setAvailableSlots([]);
        try {
            const response = await fetch(`/api/v1/legacy-bookings/available-slots?date=${targetDate}`);
            const data = await response.json();
            if (response.ok) {
                // Fetch availability configurations from backend
                let weeklySchedule = null;
                let overrides = [];
                try {
                    const resSchedule = await fetch('/api/v1/availability/weekly_schedule');
                    if (resSchedule.ok) {
                        const dataSchedule = await resSchedule.json();
                        if (dataSchedule.value && Object.keys(dataSchedule.value).length > 0) {
                            weeklySchedule = dataSchedule.value;
                        }
                    }
                    const resOverrides = await fetch('/api/v1/availability/date_overrides');
                    if (resOverrides.ok) {
                        const dataOverrides = await resOverrides.json();
                        if (dataOverrides.value && Array.isArray(dataOverrides.value.overrides)) {
                            overrides = dataOverrides.value.overrides;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch host availability from backend:", e);
                }

                // Fallback to local storage if API returned empty
                if (!weeklySchedule) {
                    const savedSchedule = localStorage.getItem('dca_weekly_schedule');
                    if (savedSchedule) weeklySchedule = JSON.parse(savedSchedule);
                }
                if (overrides.length === 0) {
                    const savedOverrides = localStorage.getItem('dca_date_overrides');
                    if (savedOverrides) overrides = JSON.parse(savedOverrides);
                }
                
                let filtered = data;
                if (overrides.length > 0 || weeklySchedule) {
                    const dayOfWeek = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    const matchedOverride = overrides.find(o => o.date === targetDate);

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
                    } else if (weeklySchedule) {
                        const scheduleRule = weeklySchedule[dayOfWeek];
                        if (scheduleRule && !scheduleRule.active) {
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
                    }
                }
                setAvailableSlots(filtered);
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSelectDate = (dateVal) => {
        setSelectedDate(dateVal);
        fetchAvailableSlots(dateVal);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            const meetingTitle = `${selectedMeeting.name}: ${company || 'Enterprise'}`;
            const response = await fetch('/api/v1/legacy-bookings/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    company_name: company || 'Enterprise Client',
                    meeting_title: meetingTitle,
                    booking_date: selectedDate,
                    booking_time: selectedTime,
                    timezone: 'Asia/Kolkata',
                    meeting_type_slug: selectedMeeting.slug
                })
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessData({
                    id: data.id || 1,
                    title: meetingTitle,
                    date: selectedDate,
                    time: selectedTime,
                    meetingLink: data.meeting_link,
                    emailPreview: {
                        to: email,
                        subject: `✅ Confirmed: ${selectedMeeting.name}`,
                        body: `Hi ${name},\n\nYour session "${selectedMeeting.name}" is scheduled on ${selectedDate} at ${selectedTime}.\n\nAn autonomous digital boardroom has been created for your onboarding review.\n\nWarm regards,\nRevOps Autonomous Agent`
                    }
                });
                setScreen('success');
            } else {
                alert(data.detail || 'Failed to complete scheduling.');
            }
        } catch (err) {
            alert('Connection failure during scheduling.');
        }
    };

    const hostReps = [
        { id: 1, name: 'Sarah Jenkins (Host)', title: 'GTM Operations Lead', details: 'Specializes in CRM OAuth configurations & workload optimizations.', conversion: '32%', score: '96', icon: 'user' },
        { id: 2, name: 'AI Auto-Assign', title: 'Intelligent Round-Robin Selector', details: 'AI balances workloads dynamically, assigning to the most optimized rep.', conversion: '35%', score: '98', icon: 'zap' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'transparent' }}>
            <div className="portal-wrapper" style={{ margin: '30px auto' }}>
                <main className="booking-desk-column" style={{ width: '100%', maxWidth: '900px' }}>
                    <div className="booking-shell" style={{ background: 'var(--panel-bg)', backdropFilter: 'blur(25px)', border: '1px solid var(--glass-border)', borderRadius: '32px', padding: '2rem' }}>

                        {/* SCREEN 1: EVENT SELECTION */}
                        {screen === 'selection' && (
                            <div className="selection-screen">
                                <div className="header-section">
                                    <h1>Select GTM Strategic Session</h1>
                                    <p>Our autonomous sales assistant will book your demo, trigger calendar synchronization, and spin up a custom simulation environment.</p>
                                </div>
                                <div className="meeting-types-grid">
                                    {meetingTypes.map(m => (
                                        <div key={m.id} className="meeting-card" onClick={() => { setSelectedMeeting(m); setSelectedHost({ id: 2, name: 'AI Auto-Assign', title: 'Intelligent Round-Robin Selector', details: 'AI balances workloads dynamically, assigning to the most optimized rep.', conversion: '35%', score: '98', icon: 'zap' }); handleSelectDate(selectedDate); setScreen('date'); }} style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '24px',
                                            padding: '2rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                                <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <i data-lucide={m.icon} size="20"></i>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '12px', fontWeight: 800 }}>{m.duration}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{m.name}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SCREEN 2: CALENDAR SELECT */}
                        {screen === 'date' && (
                            <div className="selection-screen">
                                <div className="header-section">
                                    <button onClick={() => onNavigate('scheduling')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto 1rem' }}>
                                        <i data-lucide="arrow-left" size="14"></i> Back to Scheduling
                                    </button>
                                    <h1>Pick Slot Date & Time</h1>
                                    <p>Select target calendar date to retrieve available round-robin availability.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleSelectDate(e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', padding: '0.8rem 1.2rem', borderRadius: '14px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                                    />

                                    {loadingSlots ? (
                                        <div style={{ color: 'var(--accent-primary)', padding: '20px' }}>Analyzing team calendar synchronization...</div>
                                    ) : (
                                        <div style={{ width: '100%' }}>
                                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Slots on {selectedDate}</h3>
                                            <div className="meeting-types-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                {availableSlots.map((slot, idx) => {
                                                    const isAvailable = slot.available !== false;
                                                    const displayTime = slot.time ? slot.time.substring(0, 5) : '09:00';
                                                    return (
                                                        <button
                                                            key={`${slot.time || 'slot'}-${idx}`}
                                                            disabled={!isAvailable}
                                                            onClick={() => { setSelectedTime(slot.time); setScreen('form'); }}
                                                            style={{
                                                                background: isAvailable ? 'var(--card-bg)' : 'rgba(0,0,0,0.03)',
                                                                border: `1px solid ${isAvailable ? 'var(--glass-border)' : 'transparent'}`,
                                                                borderRadius: '16px',
                                                                padding: '1.2rem',
                                                                color: isAvailable ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                                transition: 'all 0.3s',
                                                                textAlign: 'center',
                                                                opacity: isAvailable ? 1 : 0.5
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{displayTime}</div>
                                                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                                {isAvailable ? 'AI Available' : 'Slot Taken'}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SCREEN 4: BOOKING FORM */}
                        {screen === 'form' && (
                            <div className="selection-screen" style={{ textAlign: 'left' }}>
                                <div className="header-section" style={{ textAlign: 'center' }}>
                                    <button onClick={() => setScreen('date')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto 1rem' }}>
                                        <i data-lucide="arrow-left" size="14"></i> Back to calendar
                                    </button>
                                    <h1>Secure Slot Booking</h1>
                                    <p>Fill out lead details to register booking in revops and trigger AI discovery node.</p>
                                </div>

                                <form onSubmit={handleBookingSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                            <i data-lucide="user"></i>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <i data-lucide="mail"></i>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enterprise Inc."
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                            />
                                            <i data-lucide="building"></i>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Additional Notes</label>
                                        <textarea
                                            className="form-control"
                                            style={{ minHeight: '100px', padding: '1rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'var(--text-primary)', resize: 'none', outline: 'none' }}
                                            placeholder="What is your scaling challenge?"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn-submit" style={{ marginTop: '1rem' }}>
                                        <span>Confirm strategic slot</span>
                                        <i data-lucide="check-circle" style={{ width: '16px', height: '16px' }}></i>
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SCREEN 5: BOOKING SUCCESS */}
                        {screen === 'success' && successData && (
                            <div className="selection-screen">
                                <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <i data-lucide="check-circle" size="40"></i>
                                </div>
                                <h1 style={{ color: '#10b981' }}>Strategic Session Booked!</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>A calendar confirmation has been delivered to your email. Click below to experience the dynamic discovery simulation room.</p>

                                <div style={{ maxWidth: '600px', margin: '0 auto 2.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i data-lucide="calendar" style={{ color: 'var(--accent-primary)' }}></i>
                                        <div>
                                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selected Date & Time</h4>
                                            <p style={{ fontWeight: 800 }}>{successData.date} at {successData.time}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i data-lucide="monitor" style={{ color: 'var(--accent-primary)' }}></i>
                                        <div>
                                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Experience</h4>
                                            <p style={{ fontWeight: 800 }}>{successData.title}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                        <i data-lucide="link" style={{ color: 'var(--accent-primary)' }}></i>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shareable Meeting Link</h4>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={successData.meetingLink || `https://meet.jit.si/dca-revops-${successData.id}`}
                                                    style={{
                                                        flex: 1,
                                                        background: 'rgba(0,0,0,0.03)',
                                                        border: '1px solid var(--glass-border)',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-primary)',
                                                        fontFamily: 'monospace',
                                                        outline: 'none',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const link = successData.meetingLink || `https://meet.jit.si/dca-revops-${successData.id}`;
                                                        navigator.clipboard.writeText(link);
                                                        alert('Meeting link copied to clipboard!');
                                                    }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
                                                        border: 'none',
                                                        color: 'white',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)'
                                                    }}
                                                >
                                                    <i data-lucide="copy" style={{ width: '12px', height: '12px' }}></i>
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button
                                        onClick={async () => {
                                            // 1. Trigger AI analysis on the real link in background
                                            try {
                                                const compName = successData.title.includes(':') ? successData.title.split(':')[1].trim() : successData.title;
                                                await fetch(`/api/v1/legacy-bookings/${successData.id}/analyze`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        prospect_name: compName,
                                                        summary: `AI Agent successfully qualified meeting parameters on live room: ${successData.meetingLink || 'Jitsi'}. BANT qualification complete.`,
                                                        next_steps: "Deliver formal GTM deployment proposal."
                                                    })
                                                });
                                            } catch (err) {
                                                console.error("AI Analysis trigger failed:", err);
                                            }

                                            // 2. Open the real meeting link in a new tab
                                            const meetUrl = successData.meetingLink || `https://meet.jit.si/dca-revops-${successData.id}`;
                                            window.open(meetUrl, '_blank', 'noopener,noreferrer');
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
                                            color: 'var(--text-primary)',
                                            padding: '1rem 2rem',
                                            borderRadius: '14px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                                        }}
                                    >
                                        <i data-lucide="video" size="18"></i> JOIN DIGITAL BOARDROOM
                                    </button>
                                    <button
                                        onClick={() => onNavigate('dashboard')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
                                            color: 'var(--text-primary)',
                                            padding: '1rem 2rem',
                                            borderRadius: '14px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                                        }}
                                    >
                                        Return to Dashboard
                                    </button>
                                </div>

                                {/* SMTP Preview card */}
                                <div style={{ marginTop: '3rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '2rem', textAlign: 'left' }}>
                                    <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time SMTP Confirmation Preview</h4>
                                    <div style={{ background: '#090d16', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.2rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>To: {successData.emailPreview.to}</div>
                                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Subject: {successData.emailPreview.subject}</div>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>{successData.emailPreview.body}</pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
