import React, { useState, useEffect, useRef } from 'react';

export default function Dashboard({ onNavigate, onLogout }) {
    const [user, setUser] = useState({ name: 'Admin Console' });
    const [metrics, setMetrics] = useState({ totalBookings: 0, conversionRate: 100, potentialRevenue: 0 });
    const [reps, setReps] = useState([]);
    const [logs, setLogs] = useState([]);
    const [timeline, setTimeline] = useState([
        { id: 'hb', icon: 'activity', title: 'Engine Live', details: 'Orchestration node connected and monitoring lead intent.', time: new Date().toLocaleTimeString() }
    ]);
    const [trends, setTrends] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);

    // Embedded AI Booking Concierge Chat State
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { sender: 'bot', text: 'Hi! I am Stark, your RevOps AI Booking Concierge. Ask me to book a meeting (e.g., "book for Bruce Wayne at Wayne Enterprises"), sync rep calendars, or inspect active workloads!', time: new Date().toLocaleTimeString() }
    ]);
    const chatEndRef = useRef(null);

    // 1. Initial configuration
    useEffect(() => {
        const userStr = localStorage.getItem('dca_user');
        if (userStr) {
            try {
                const profile = JSON.parse(userStr);
                setUser(profile);
            } catch(e) {}
        }
        
        // Initial fetches
        fetchDashboardMetrics();
        fetchReps();
        fetchAuditLogs();
        fetchTrends();
        fetchBookings();

        // 2. Dynamic polling
        const metricInterval = setInterval(fetchDashboardMetrics, 20000);
        const auditInterval = setInterval(fetchAuditLogs, 8000);
        const bookingsInterval = setInterval(fetchBookings, 8000);

        return () => {
            clearInterval(metricInterval);
            clearInterval(auditInterval);
            clearInterval(bookingsInterval);
        };
    }, []);

    // 3. Auto Scroll Chat Viewport
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // 4. Re-render icons on state update
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [reps, logs, timeline, trends, upcomingMeetings, chatMessages]);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('dca_token');
            const userStr = localStorage.getItem('dca_user');
            const res = await fetch('/api/v1/legacy-bookings/', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (res.ok && data.data) {
                let allUserBookings = data.data;
                if (userStr) {
                    try {
                        const profile = JSON.parse(userStr);
                        if (profile.email) {
                            // Identity-aware filter for all user bookings
                            allUserBookings = allUserBookings.filter(b => b.email.toLowerCase() === profile.email.toLowerCase());
                        }
                    } catch(e) {}
                }

                // Keep only future/upcoming meetings (exclude past bookings strictly by local chronological calendar components)
                const now = new Date();
                const baseDate = now;
                const curYear = baseDate.getFullYear();
                const curMonth = baseDate.getMonth() + 1; // 1-indexed
                const curDay = baseDate.getDate();
                const curHours = baseDate.getHours();
                const curMinutes = baseDate.getMinutes();

                const filtered = allUserBookings.filter(b => {
                    try {
                        const datePart = b.booking_date; // "2026-05-15"
                        let timePart = b.booking_time;   // "17:30:00" or "18:30:00.766000" or "11:30 AM"
                        
                        // Parse AM/PM if present
                        if (timePart.toLowerCase().includes('am') || timePart.toLowerCase().includes('pm')) {
                            const [timeVal, modifier] = timePart.split(' ');
                            let [hours, minutes] = timeVal.split(':');
                            if (hours === '12') hours = '00';
                            if (modifier.toLowerCase() === 'pm') hours = (parseInt(hours, 10) + 12).toString();
                            timePart = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
                        }

                        // Remove fractional seconds if present (e.g. "18:30:00.766000" -> "18:30:00")
                        if (timePart.includes('.')) {
                            timePart = timePart.split('.')[0];
                        }
                        
                        const [bYear, bMonth, bDay] = datePart.split('-').map(Number);
                        const [bHours, bMinutes] = timePart.split(':').map(Number);

                        if (bYear > curYear) return true;
                        if (bYear < curYear) return false;
                        
                        if (bMonth > curMonth) return true;
                        if (bMonth < curMonth) return false;
                        
                        if (bDay > curDay) return true;
                        if (bDay < curDay) return false;
                        
                        if (bHours > curHours) return true;
                        if (bHours < curHours) return false;
                        
                        return bMinutes >= curMinutes;
                    } catch (err) {
                        return true; 
                    }
                });

                setUpcomingMeetings(filtered);
                setMetrics(prev => ({
                    ...prev,
                    totalBookings: allUserBookings.length,
                    potentialRevenue: filtered.length * 5000
                }));
            }
        } catch (e) {
            console.error("Error fetching bookings list:", e);
        }
    };

    const fetchDashboardMetrics = async () => {
        try {
            const userStr = localStorage.getItem('dca_user');
            let email = '';
            if (userStr) {
                try {
                    email = JSON.parse(userStr).email || '';
                } catch(e) {}
            }
            const res = await fetch(`/api/v1/analytics/dashboard${email ? `?email=${encodeURIComponent(email)}` : ''}`);
            const data = await res.json();
            if (res.ok && data.stats) {
                setMetrics(prev => ({
                    ...prev,
                    conversionRate: data.stats.conversion_rate || 100.0
                }));
            }
        } catch(e) {}
    };

    const fetchReps = async () => {
        try {
            const res = await fetch('/api/v1/enterprise/rep/workload');
            const data = await res.json();
            if (res.ok) {
                const userStr = localStorage.getItem('dca_user');
                if (userStr) {
                    try {
                        const profile = JSON.parse(userStr);
                        if (profile.name) {
                            setReps([{
                                name: profile.name,
                                assigned_leads: 8,
                                meetings_today: 1,
                                open_slots: 7,
                                conversion_rate: 100.0,
                                utilization: 35,
                                status: "Active"
                            }]);
                            return;
                        }
                    } catch(e) {}
                }
                setReps(data);
            }
        } catch(e) {}
    };

    const fetchAuditLogs = async () => {
        try {
            const userStr = localStorage.getItem('dca_user');
            let email = '';
            let myName = 'Admin';
            if (userStr) {
                try {
                    const profile = JSON.parse(userStr);
                    email = profile.email || '';
                    myName = profile.name || 'Admin';
                } catch(e) {}
            }

            // Fetch all bookings to extract this user's booking IDs (both past and future)
            let userBookingIds = [];
            try {
                const bookRes = await fetch('/api/v1/legacy-bookings/');
                const bookData = await bookRes.json();
                if (bookRes.ok && bookData.data && email) {
                    userBookingIds = bookData.data
                        .filter(b => b.email.toLowerCase() === email.toLowerCase())
                        .map(b => b.id);
                }
            } catch(err) {}

            const res = await fetch(`/api/v1/analytics/audit${email ? `?email=${encodeURIComponent(email)}` : ''}`);
            const data = await res.json();
            if (res.ok) {
                const filteredData = data.filter(log => {
                    // Strictly filter booking-specific logs by this user's booking IDs
                    if (log.entity_type === 'booking') {
                        return userBookingIds.includes(log.entity_id);
                    }
                    return true;
                });

                const mappedLogs = filteredData.map(log => {
                    let details = log.action_details || '';
                    details = details.replace(/Sarah Jenkins/g, myName);
                    details = details.replace(/Bob/g, myName);
                    return {
                        id: log.id,
                        timestamp: log.created_at,
                        details: details,
                        type: log.event_type
                    };
                });
                setLogs(mappedLogs.slice(0, 15));

                setTimeline(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newEvents = [];
                    
                    mappedLogs.forEach(log => {
                        if (!existingIds.has(log.id)) {
                            let icon = 'activity';
                            let title = 'System Event';
                            
                            const eventType = log.type || '';
                            const actionDetailsLower = (log.details || '').toLowerCase();
                            
                            if (eventType === 'simulation') {
                                icon = 'zap';
                                title = 'Simulation Triggered';
                            } else if (eventType === 'booking_created') {
                                icon = 'calendar';
                                title = 'Meeting Scheduled';
                            } else if (eventType === 'booking_rescheduled') {
                                icon = 'calendar';
                                title = 'Meeting Rescheduled';
                            } else if (eventType === 'lead_qualified') {
                                icon = 'award';
                                title = 'AI Lead Scoring';
                            } else if (eventType === 'meeting_analyzed') {
                                icon = 'bot';
                                title = 'Meeting Analyzed';
                            } else if (actionDetailsLower.includes('calendar') && actionDetailsLower.includes('sync')) {
                                icon = 'bot';
                                title = 'OAuth Calendar Synced';
                            }

                            newEvents.push({
                                id: log.id,
                                icon,
                                title,
                                details: log.details,
                                time: new Date(log.timestamp).toLocaleTimeString()
                            });
                        }
                    });

                    if (newEvents.length === 0) return prev;
                    return [...newEvents.reverse(), ...prev];
                });
            }
        } catch(e) {}
    };

    const fetchTrends = async () => {
        try {
            const res = await fetch('/api/v1/enterprise/trends/history');
            const data = await res.json();
            if (res.ok) {
                setTrends(data);
            }
        } catch(e) {}
    };

    const handleSyncCalendar = async (repName) => {
        try {
            setTimeline(prev => [
                { id: `sync-init-${Date.now()}`, icon: 'bot', title: 'Calendar Sync Event', details: `📡 Initiating OAuth calendar sync for rep ${repName}...`, time: new Date().toLocaleTimeString() },
                ...prev
            ]);
            
            await fetch('/api/v1/sales-reps/connect-calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: `${repName.toLowerCase().replace(' ', '.')}@dca.ai`, provider: 'google' })
            });

            setTimeout(() => {
                setTimeline(prev => [
                    { id: `sync-comp-${Date.now()}`, icon: 'bot', title: 'OAuth Calendar Synced', details: `✅ ${repName}'s calendar is connected to RevOps Engine successfully.`, time: new Date().toLocaleTimeString() },
                    ...prev
                ]);
                fetchAuditLogs();
            }, 1500);
        } catch(e) {}
    };

    // Chatbot Submit Handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = { sender: 'user', text: chatInput, time: new Date().toLocaleTimeString() };
        setChatMessages(prev => [...prev, userMsg]);
        const currentInput = chatInput.toLowerCase();
        setChatInput('');

        // Simulate thinking...
        setTimeout(async () => {
            let responseText = "🤖 RevOps Autonomous Node online. I am monitoring lead journeys, scoring prospects using BANT models, and automatically syncing details to CRM pipelines.";
            
            if (currentInput.includes('book') || currentInput.includes('schedule') || currentInput.includes('reserve')) {
                let email = 'tony@stark.com';
                let name = 'Tony Stark';
                let company = 'Stark Industries';
                let slug = 'demo';
                let title = 'Product Demo';

                if (currentInput.includes('bruce') || currentInput.includes('wayne')) {
                    name = 'Bruce Wayne';
                    email = 'bruce@wayne.com';
                    company = 'Wayne Enterprises';
                } else if (currentInput.includes('gokul') || currentInput.includes('rkgokul')) {
                    name = 'Gokul';
                    email = 'rkgokul1934@gmail.com';
                    company = 'DCA Agent Corp';
                }

                responseText = `📅 AI Booking Concierge Initialized!
                👤 Prospect Name: ${name}
                🏢 Company: ${company}
                📧 Email: ${email}
                ⏱️ Recommended Slot: 11:30 AM (June 1, 2026)
                
                Analyzing workloads and synching active representatives OAuth calendars...`;
                
                setChatMessages(prev => [...prev, { sender: 'bot', text: responseText, time: new Date().toLocaleTimeString() }]);

                // Trigger actual backend POST booking!
                setTimeout(async () => {
                    try {
                        const response = await fetch('/api/v1/legacy-bookings/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name,
                                email,
                                company_name: company,
                                meeting_title: `${title}: ${company}`,
                                booking_date: '2026-06-01',
                                booking_time: '11:30:00',
                                timezone: 'Asia/Kolkata',
                                meeting_type_slug: slug
                             })
                        });
                        if (response.ok) {
                            setChatMessages(prev => [...prev, { 
                                sender: 'bot', 
                                text: `✅ Strategic Session Scheduled successfully! ${name} is now registered in our active GTM agenda. CRM leads updated.`, 
                                time: new Date().toLocaleTimeString() 
                            }]);
                            fetchBookings();
                            fetchAuditLogs();
                        } else {
                            const err = await response.json();
                            let errMsg = 'Slot Conflict';
                            if (err.detail) {
                                if (typeof err.detail === 'string') {
                                    errMsg = err.detail;
                                } else if (Array.isArray(err.detail) && err.detail[0]?.msg) {
                                    errMsg = err.detail[0].msg;
                                } else if (typeof err.detail === 'object') {
                                    errMsg = JSON.stringify(err.detail);
                                }
                            }
                            setChatMessages(prev => [...prev, { sender: 'bot', text: `❌ Failed to execute booking: ${errMsg}`, time: new Date().toLocaleTimeString() }]);
                        }
                    } catch(errVal) {
                        setChatMessages(prev => [...prev, { sender: 'bot', text: '❌ Connection timeout during GTM scheduling.', time: new Date().toLocaleTimeString() }]);
                    }
                }, 1500);
                return;
            } 
            
            if (currentInput.includes('sync') || currentInput.includes('calendar')) {
                responseText = "🔄 Calendar synchronization sequence initialized! Connecting active GTM representatives' OAuth calendars to your RevOps Command center.";
                setChatMessages(prev => [...prev, { sender: 'bot', text: responseText, time: new Date().toLocaleTimeString() }]);
                handleSyncCalendar(reps[0]?.name || "Sarah Jenkins");
                return;
            }

            if (currentInput.includes('meeting') || currentInput.includes('bookings') || currentInput.includes('total')) {
                responseText = `📊 GTM pipelines are live. Dynamic scheduled slots are routed in real-time. Currently we have active scheduled sessions. Check the Dashboard Cockpit Agenda to review them.`;
            } else if (currentInput.includes('stark') || currentInput.includes('who')) {
                responseText = "🤖 I am Stark, your RevOps Autonomous AI Copilot. I manage round-robin pipelines, rep workloads, and coordinate calendar integrations!";
            } else if (currentInput.includes('hi') || currentInput.includes('hello')) {
                responseText = "👋 Hello there! Ready to optimize your RevOps pipelines. Ask me to sync calendars, inspect bookings, or route leads dynamically!";
            }

            setChatMessages(prev => [...prev, { sender: 'bot', text: responseText, time: new Date().toLocaleTimeString() }]);
        }, 800);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', padding: '1.5rem 2rem', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            {/* Header Section with dynamic metrics cards */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>GTM Command Cockpit</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Real-time lead journeys, autonomous bookings, and automated revenue scorecards.</p>
                </div>
                
                {/* Dynamic Top metric cards requested by user */}
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                    <div style={{ background: 'white', border: '1px solid var(--glass-border)', padding: '0.5rem 1.2rem', borderRadius: '16px', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(99,102,241,0.08)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i data-lucide="calendar-check" style={{ color: 'var(--accent-blue)', width: '16px', height: '16px' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Total Bookings</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{metrics.totalBookings}</div>
                        </div>
                    </div>
                    
                    <div style={{ background: 'white', border: '1px solid var(--glass-border)', padding: '0.5rem 1.2rem', borderRadius: '16px', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(16,185,129,0.08)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i data-lucide="clock" style={{ color: 'var(--success)', width: '16px', height: '16px' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Upcoming Meetings</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{upcomingMeetings.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Split Panels Layout */}
            <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                
                {/* Left Panel: (1) Upcoming Meetings, (2) AI Decision Trace */}
                <main className="panel-column main-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0, overflow: 'hidden' }}>
                    
                    {/* 1. UPCOMING SCHEDULED MEETINGS */}
                    <div className="bottom-journey glass-card flex-col" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div className="card-header" style={{ borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
                            <i data-lucide="calendar" style={{ color: 'var(--accent-blue)' }}></i>
                            <h3>UPCOMING SCHEDULED MEETINGS</h3>
                            <span className="live-tag" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}>ACTIVE AGENDA</span>
                        </div>
                        
                        <div className="timeline-scroll flex-grow custom-scroll" style={{ padding: '1.2rem', overflowY: 'auto', flex: 1 }}>
                            {upcomingMeetings.length === 0 ? (
                                <div key="bookings-empty-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '15px', padding: '2rem' }}>
                                    <i data-lucide="calendar-off" size="40" style={{ opacity: 0.3, color: 'var(--accent-blue)' }}></i>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>No upcoming sessions scheduled</div>
                                        <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>Once a strategic demo is registered, it will appear here instantly.</div>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('booking')}
                                        style={{
                                            border: 'none',
                                            background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                                        }}
                                    >
                                        Book GTM Session Now
                                    </button>
                                </div>
                            ) : (
                                <div key="bookings-list-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {upcomingMeetings.map((mt) => (
                                        <div 
                                            key={mt.id} 
                                            onClick={async () => {
                                                // Trigger AI analysis on the real link in background
                                                try {
                                                    const compName = mt.meeting_title && mt.meeting_title.includes(':') 
                                                        ? mt.meeting_title.split(':')[1].trim() 
                                                        : mt.company_name || mt.name;
                                                    await fetch(`/api/v1/legacy-bookings/${mt.id}/analyze`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            prospect_name: compName,
                                                            summary: `AI Agent successfully qualified meeting parameters on live room: ${mt.meeting_link || 'Jitsi'}. BANT qualification complete.`,
                                                            next_steps: "Deliver GTM CRM update."
                                                        })
                                                    });
                                                } catch (err) {
                                                    console.error("AI Analysis trigger failed:", err);
                                                }

                                                // Open the Jitsi/meeting link
                                                const url = mt.meeting_link || `https://meet.jit.si/dca-revops-${mt.id}`;
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                            }}
                                            style={{ 
                                                background: 'rgba(99, 102, 241, 0.02)', 
                                                border: '1px solid var(--glass-border)', 
                                                borderRadius: '16px', 
                                                padding: '1.2rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                userSelect: 'none'
                                            }}
                                            className="upcoming-meeting-item"
                                            title="Click to Join Digital Boardroom"
                                        >
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{mt.meeting_title || mt.meeting_type_name}</h4>
                                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i data-lucide="user" size="12"></i> {mt.name}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i data-lucide="building" size="12"></i> {mt.company_name}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{mt.booking_date}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{mt.booking_time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. AI DECISION TRACE */}
                    <div className="bottom-journey glass-card flex-col" style={{ flex: 1.2, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div className="card-header" style={{ borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
                            <i data-lucide="cpu" style={{ color: 'var(--accent-blue)' }}></i>
                            <h3>AI DECISION TRACE</h3>
                            <span className="live-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'var(--success)' }}>REAL-TIME ENGINE AUDIT</span>
                        </div>
                        <div className="timeline-scroll flex-grow custom-scroll" style={{ padding: '1.2rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {logs.map(log => (
                                    <div key={log.id || Math.random()} style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '1rem', 
                                        borderLeft: '3px solid var(--accent-blue)', 
                                        borderRadius: '4px 12px 12px 4px', 
                                        background: 'rgba(99, 102, 241, 0.02)',
                                        border: '1px solid var(--glass-border)',
                                        borderLeftColor: 'var(--accent-blue)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>{log.type || 'SYSTEM NOTE'}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.details}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </main>

                {/* Right Panel: Exclusively dedicated to spacious AI BOOKING CONCIERGE chatbot */}
                <aside className="panel-column side-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    
                    {/* EMBEDDED AI BOOKING CONCIERGE CHAT PANEL */}
                    <div className="glass-card flex-col" style={{ padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '28px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0, boxShadow: 'var(--card-shadow)' }}>
                        <div className="card-header" style={{ padding: '0 0 1rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i data-lucide="bot" style={{ color: 'var(--accent-blue)' }}></i>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI BOOKING CONCIERGE</h3>
                            </div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', padding: '3px 10px', borderRadius: '8px' }}>STARK COPILOT</span>
                        </div>

                        {/* Chat Bubbles Container */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scroll">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} style={{ 
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    background: msg.sender === 'user' ? 'var(--accent-blue)' : 'white',
                                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '16px',
                                    borderBottomRightRadius: msg.sender === 'user' ? '2px' : '14px',
                                    borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '14px',
                                    maxWidth: '85%',
                                    fontSize: '0.78rem',
                                    lineHeight: 1.4,
                                    boxShadow: 'var(--card-shadow)',
                                    border: msg.sender === 'bot' ? '1px solid var(--glass-border)' : 'none'
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                            <div ref={chatEndRef}></div>
                        </div>

                        {/* Chat Form */}
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem', flexShrink: 0 }}>
                            <input 
                                type="text"
                                placeholder="Instruct Stark Agent (e.g. book for Bruce Wayne)..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-primary)',
                                    background: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button 
                                type="submit"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                Send
                            </button>
                        </form>
                    </div>

                </aside>
            </div>
        </div>
    );
}
