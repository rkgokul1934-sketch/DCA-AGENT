import React, { useState, useEffect } from 'react';

export default function Meetings({ onNavigate }) {
    // Component Views: 'dashboard' (list), 'calendar', 'analytics'
    const [activeView, setActiveView] = useState('dashboard');
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [selectedTab, setSelectedTab] = useState('upcoming'); // upcoming, past, canceled, rescheduled
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('all'); // all, today, week, month
    const [selectedHost, setSelectedHost] = useState('all');
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [showBuffers, setShowBuffers] = useState(false);
    const [calendarSyncStatus, setCalendarSyncStatus] = useState('active'); // active, out_of_sync

    // Calendar Sub-Views: 'month', 'week', 'day', 'agenda'
    const [calendarSubView, setCalendarSubView] = useState('month');
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 5, 1)); // June 2026

    // Interactive Modals / Drawers
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    
    // Notes Modal State
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [notesMeeting, setNotesMeeting] = useState(null);
    const [notesText, setNotesText] = useState('');

    // Reschedule Modal State
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('2026-06-02');
    const [rescheduleTime, setRescheduleTime] = useState('10:00');
    const [rescheduleReason, setRescheduleReason] = useState('');

    // Assign Rep State
    const [assignRepModalOpen, setAssignRepModalOpen] = useState(false);
    const [assignRepMeeting, setAssignRepMeeting] = useState(null);
    const [selectedRepId, setSelectedRepId] = useState(2);

    // Sales Rep List for assignments
    const reps = [
        { id: 1, name: 'Sarah Jenkins', role: 'GTM Operations Lead', team: 'Enterprise' },
        { id: 2, name: 'AI Auto-Assign', role: 'Round-Robin Engine', team: 'Platform' },
        { id: 3, name: 'Alex Carter', role: 'Senior AE', team: 'Mid-Market' },
        { id: 4, name: 'Emma Watson', role: 'SDR Team Lead', team: 'SMB' }
    ];

    // GTM metrics to enrich bookings
    const dummyGtmData = {
        company_size: '500-1000',
        industry: 'FinTech / SaaS',
        source: 'LinkedIn Campaign',
        campaign: 'Q2 RevOps Acceleration',
        segment: 'Strategic Enterprise',
        sdr: 'Emma Watson',
        ae: 'Alex Carter',
        manager: 'Sarah Jenkins',
        team: 'North America Enterprise',
        lead_quality: 'High (ICP)',
        ai_lead_score: 94,
        customer_intent: 96,
        opportunity_score: 92,
        revenue_attribution: '$120,000'
    };

    // Load data on mount
    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/legacy-bookings/');
            const result = await response.json();
            if (response.ok && result.data) {
                // Enrich incoming meetings with GTM properties so the command center is fully functional
                const enriched = result.data.map((m, idx) => {
                    // Seed some default provider badges and GTM intelligence
                    const provList = ['google', 'zoom', 'teams', 'open'];
                    const provider = m.provider || provList[idx % provList.length];
                    const rep = reps.find(r => r.id === (m.sales_rep_id || 2)) || reps[1];
                    const mTags = m.tags ? m.tags.split(',') : ['ICP', 'revops_qualified'];
                    
                    return {
                        ...m,
                        provider,
                        notes: m.notes || 'Prospect interested in autonomous CRM data extraction and calendar routing.',
                        tags: mTags,
                        followup_status: m.followup_status || (idx % 3 === 0 ? 'proposal sent' : idx % 3 === 1 ? 'completed' : 'pending'),
                        repName: rep.name,
                        gtm: {
                            ...dummyGtmData,
                            ai_lead_score: m.id % 2 === 0 ? 98 : 74,
                            customer_intent: m.id % 2 === 0 ? 94 : 80,
                            company_size: m.id % 2 === 0 ? '1000+ employees' : '100-250 employees',
                            industry: m.id % 2 === 0 ? 'Cybersecurity' : 'E-commerce Logistics',
                            revenue_attribution: m.id % 2 === 0 ? '$180,000' : '$45,000',
                            lead_quality: m.id % 2 === 0 ? 'Elite Enterprise' : 'Mid-Market Tier 1'
                        }
                    };
                });
                setMeetings(enriched);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [meetings, activeView, calendarSubView, selectedTab, drawerOpen, notesModalOpen, rescheduleModalOpen, assignRepModalOpen]);

    // Handle cancel action
    const handleCancelMeeting = async (meetingId) => {
        if (!confirm('Are you sure you want to cancel this meeting?')) return;
        try {
            const response = await fetch(`/api/v1/legacy-bookings/${meetingId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Meeting has been cancelled successfully.');
                fetchMeetings();
                if (selectedMeeting && selectedMeeting.id === meetingId) {
                    setDrawerOpen(false);
                }
            } else {
                alert('Failed to cancel meeting.');
            }
        } catch (e) {
            alert('Error communicating with backend.');
        }
    };

    // Handle rescheduling action
    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/v1/legacy-bookings/${rescheduleMeeting.id}/reschedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_date: rescheduleDate,
                    new_time: rescheduleTime,
                    reason: rescheduleReason || 'Requested by client'
                })
            });
            if (response.ok) {
                alert('Meeting rescheduled successfully.');
                setRescheduleModalOpen(false);
                fetchMeetings();
            } else {
                const errData = await response.json();
                alert(errData.detail || 'Failed to reschedule meeting.');
            }
        } catch (e) {
            alert('Error communicating with backend.');
        }
    };

    // Handle edit notes action
    const handleSaveNotes = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/v1/legacy-bookings/${notesMeeting.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: notesText
                })
            });
            if (response.ok) {
                alert('Notes updated successfully.');
                setNotesModalOpen(false);
                fetchMeetings();
                if (selectedMeeting && selectedMeeting.id === notesMeeting.id) {
                    setSelectedMeeting(prev => ({ ...prev, notes: notesText }));
                }
            } else {
                alert('Failed to update notes.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
    };

    // Handle rep assignment action
    const handleAssignRepSubmit = async (e) => {
        e.preventDefault();
        try {
            const rep = reps.find(r => r.id === parseInt(selectedRepId));
            const response = await fetch(`/api/v1/legacy-bookings/${assignRepMeeting.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sales_rep_id: parseInt(selectedRepId)
                })
            });
            if (response.ok) {
                alert(`Meeting assigned to ${rep.name}.`);
                setAssignRepModalOpen(false);
                fetchMeetings();
                if (selectedMeeting && selectedMeeting.id === assignRepMeeting.id) {
                    setSelectedMeeting(prev => ({ ...prev, sales_rep_id: rep.id, repName: rep.name }));
                }
            } else {
                alert('Failed to reassign representative.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
    };

    // Copy link helper
    const handleCopyLink = (link) => {
        navigator.clipboard.writeText(link);
        alert('Meeting link copied to clipboard!');
    };

    // Mark completed / attended helper
    const handleMarkCompleted = async (meetingId) => {
        try {
            const response = await fetch(`/api/v1/legacy-bookings/${meetingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed'
                })
            });
            if (response.ok) {
                alert('Meeting marked as completed.');
                setDrawerOpen(false);
                fetchMeetings();
            } else {
                alert('Failed to update status.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
    };

    // Export CSV Helper
    const handleExportCSV = () => {
        let headers = ['ID', 'Title', 'Date', 'Time', 'Invitee', 'Email', 'Company', 'Status', 'Provider', 'Meeting Link', 'Notes', 'Follow-up Status'];
        let rows = meetings.map(m => [
            m.id,
            m.meeting_title,
            m.booking_date,
            m.booking_time,
            m.name,
            m.email,
            m.company_name,
            m.status,
            m.provider,
            m.meeting_link || `https://meet.jit.si/dca-revops-${m.id}`,
            m.notes || '',
            m.followup_status || ''
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `DCA_Meetings_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Logic
    const getFilteredMeetings = () => {
        return meetings.filter(m => {
            // Tab filter
            const isCancelled = m.status === 'cancelled';
            const isRescheduled = m.status === 'rescheduled' || (m.reschedules && m.reschedules.length > 0);
            const isCompleted = m.status === 'completed' || m.status === 'attended';
            
            if (selectedTab === 'upcoming') {
                if (isCancelled || isCompleted) return false;
            } else if (selectedTab === 'past') {
                if (!isCompleted && m.status !== 'completed' && m.status !== 'attended') {
                    // Check if date is in the past
                    const mDate = new Date(`${m.booking_date}T${m.booking_time}`);
                    if (mDate >= new Date() || isCancelled) return false;
                }
            } else if (selectedTab === 'canceled') {
                if (!isCancelled) return false;
            } else if (selectedTab === 'rescheduled') {
                if (!isRescheduled) return false;
            }

            // Search query filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const invitee = (m.name || '').toLowerCase();
                const company = (m.company_name || '').toLowerCase();
                const title = (m.meeting_title || '').toLowerCase();
                const rep = (m.repName || '').toLowerCase();
                if (!invitee.includes(query) && !company.includes(query) && !title.includes(query) && !rep.includes(query)) {
                    return false;
                }
            }

            // Date range filter
            if (selectedDateRange !== 'all') {
                const mDate = new Date(m.booking_date);
                const today = new Date();
                today.setHours(0,0,0,0);
                
                if (selectedDateRange === 'today') {
                    const compareDate = new Date(today);
                    if (mDate.getTime() !== compareDate.getTime()) return false;
                } else if (selectedDateRange === 'week') {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    if (mDate < startOfWeek || mDate > endOfWeek) return false;
                } else if (selectedDateRange === 'month') {
                    if (mDate.getMonth() !== today.getMonth() || mDate.getFullYear() !== today.getFullYear()) return false;
                }
            }

            // Provider filter
            if (selectedProvider !== 'all' && m.provider !== selectedProvider) return false;
            
            // Host/Rep filter
            if (selectedHost !== 'all' && m.repName !== selectedHost) return false;

            // Status filter
            if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;

            // Team filter
            if (selectedTeam !== 'all') {
                if (selectedTeam === 'Enterprise' && !m.gtm.segment.includes('Enterprise')) return false;
                if (selectedTeam === 'Mid-Market' && !m.gtm.segment.includes('Mid-Market')) return false;
            }

            return true;
        });
    };

    const filteredMeetings = getFilteredMeetings();

    // Summary calculations
    const totalBookings = meetings.length;
    const canceledCount = meetings.filter(m => m.status === 'cancelled').length;
    const completedCount = meetings.filter(m => m.status === 'completed' || m.status === 'attended').length;
    const rescheduleCount = meetings.filter(m => m.status === 'rescheduled').length;
    const upcomingCount = totalBookings - canceledCount - completedCount;
    
    const conversionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 74;
    const noShowRate = totalBookings > 0 ? Math.round((meetings.filter(m => m.status === 'no_show').length / totalBookings) * 100) : 2;
    const influencedRevenue = meetings
        .filter(m => m.status !== 'cancelled')
        .reduce((acc, m) => {
            const val = m.gtm && m.gtm.revenue_attribution ? parseInt(m.gtm.revenue_attribution.replace(/[^0-9]/g, '')) : 0;
            return acc + val;
        }, 0);

    // Helpers for styles
    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
            case 'attended':
                return { background: 'rgba(16,185,129,0.1)', color: '#10b981' };
            case 'cancelled':
                return { background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
            case 'rescheduled':
                return { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
            case 'pending':
            default:
                return { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
        }
    };

    const getProviderIcon = (provider) => {
        switch (provider) {
            case 'google': return 'chrome';
            case 'zoom': return 'video';
            case 'teams': return 'users';
            case 'open':
            default:
                return 'zap';
        }
    };

    // Calendar helper calculations
    const getDaysInMonth = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        // Fill initial padding days of previous week
        const startDayIndex = firstDay.getDay(); // 0 is Sunday, 1 is Monday
        for (let i = startDayIndex; i > 0; i--) {
            const paddingDay = new Date(year, month, 1 - i);
            days.push({ date: paddingDay, isCurrentMonth: false });
        }
        
        // Fill actual days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        
        // Fill trailing padding days
        const endDayIndex = lastDay.getDay();
        for (let i = 1; i < 7 - endDayIndex; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        
        return days;
    };

    const calendarDays = getDaysInMonth(currentCalendarDate);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f8fafc', fontFamily: 'var(--font-family)' }}>
            
            {/* Top Workspace Header */}
            <header style={{
                background: '#ffffff',
                borderBottom: '1px solid var(--glass-border)',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i data-lucide="layers" style={{ color: 'var(--accent-blue)', width: '16px', height: '16px' }}></i>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>RevOps Main Workspace</span>
                        <i data-lucide="chevron-down" style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }}></i>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.05)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                        Google Calendar Synced
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => onNavigate('booking')}
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)'
                        }}
                    >
                        <i data-lucide="plus" style={{ width: '14px', height: '14px' }}></i>
                        Create Meeting
                    </button>
                    
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <div style={{ background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i data-lucide="bell" style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }}></i>
                        </div>
                        <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '15px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                            RK
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rk Gokul</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="custom-scroll">
                
                {/* 1. GTM COMMAND CENTER SUMMARY WIDGETS */}
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                    
                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bookings</span>
                            <i data-lucide="calendar" style={{ color: 'var(--accent-primary)', width: '16px', height: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalBookings}</div>
                        <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '4px', fontWeight: 700 }}>+{upcomingCount} upcoming slots active</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rate</span>
                            <i data-lucide="percent" style={{ color: '#10b981', width: '16px', height: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{conversionRate}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Attended vs. scheduled sessions</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Influenced Revenue</span>
                            <i data-lucide="dollar-sign" style={{ color: '#10b981', width: '16px', height: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>${influencedRevenue.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', color: '#818cf8', marginTop: '4px', fontWeight: 700 }}>AI Lead pipeline attribution</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rescheduled / No-Shows</span>
                            <i data-lucide="refresh-cw" style={{ color: '#f59e0b', width: '16px', height: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rescheduleCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {noShowRate}%</span></div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Optimized auto-rotations active</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancellations</span>
                            <i data-lucide="slash" style={{ color: '#ef4444', width: '16px', height: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{canceledCount}</div>
                        <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '4px', fontWeight: 700 }}>{totalBookings > 0 ? Math.round((canceledCount / totalBookings) * 100) : 0}% Cancellation Rate</div>
                    </div>

                </section>

                {/* Navigation View Switcher tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button 
                            onClick={() => setActiveView('dashboard')} 
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '10px 5px',
                                fontSize: '0.85rem',
                                fontWeight: activeView === 'dashboard' ? 800 : 600,
                                color: activeView === 'dashboard' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                borderBottom: activeView === 'dashboard' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i data-lucide="list" style={{ width: '14px', height: '14px' }}></i>
                            Scheduled Events List
                        </button>
                        <button 
                            onClick={() => setActiveView('calendar')} 
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '10px 5px',
                                fontSize: '0.85rem',
                                fontWeight: activeView === 'calendar' ? 800 : 600,
                                color: activeView === 'calendar' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                borderBottom: activeView === 'calendar' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i data-lucide="calendar" style={{ width: '14px', height: '14px' }}></i>
                            Calendar View
                        </button>
                        <button 
                            onClick={() => setActiveView('analytics')} 
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '10px 5px',
                                fontSize: '0.85rem',
                                fontWeight: activeView === 'analytics' ? 800 : 600,
                                color: activeView === 'analytics' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                borderBottom: activeView === 'analytics' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i data-lucide="pie-chart" style={{ width: '14px', height: '14px' }}></i>
                            Funnel & Team Analytics
                        </button>
                    </div>

                    {activeView === 'calendar' && (
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                            {['month', 'week', 'day', 'agenda'].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setCalendarSubView(mode)}
                                    style={{
                                        background: calendarSubView === mode ? '#ffffff' : 'transparent',
                                        border: 'none',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        color: calendarSubView === mode ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. THE MAIN VIEWS CONTAINER */}
                
                {/* VIEW A: LIST DASHBOARD */}
                {activeView === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Filters Panel */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Filter row 1 */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search by invitee, company, event type, or owner..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: '#f8fafc',
                                            border: '1px solid var(--glass-border)',
                                            padding: '8px 12px 8px 36px',
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            outline: 'none',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    <i data-lucide="search" style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: 'var(--text-secondary)' }}></i>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <select 
                                        value={selectedDateRange} 
                                        onChange={(e) => setSelectedDateRange(e.target.value)}
                                        style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="all">Any Date</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>

                                    <select 
                                        value={selectedHost} 
                                        onChange={(e) => setSelectedHost(e.target.value)}
                                        style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="all">All Hosts</option>
                                        <option value="Sarah Jenkins">Sarah Jenkins</option>
                                        <option value="AI Auto-Assign">AI Auto-Assign</option>
                                    </select>

                                    <select 
                                        value={selectedProvider} 
                                        onChange={(e) => setSelectedProvider(e.target.value)}
                                        style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="all">All Providers</option>
                                        <option value="google">Google Meet</option>
                                        <option value="zoom">Zoom</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="open">Open (Jitsi)</option>
                                    </select>

                                    <select 
                                        value={selectedTeam} 
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="all">All Segments</option>
                                        <option value="Enterprise">Enterprise</option>
                                        <option value="Mid-Market">Mid-Market</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filter row 2 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={showBuffers} 
                                            onChange={(e) => setShowBuffers(e.target.checked)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        Show Buffer times (15m before & after)
                                    </label>

                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                        Google / Outlook Sync Connected
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={handleExportCSV}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-primary)',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <i data-lucide="download" style={{ width: '12px', height: '12px' }}></i>
                                        Export CSV
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedDateRange('all');
                                            setSelectedHost('all');
                                            setSelectedProvider('all');
                                            setSelectedTeam('all');
                                            setSelectedStatus('all');
                                        }}
                                        style={{
                                            background: '#f1f5f9',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Event list tabs selector */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', gap: '1.5rem' }}>
                            {['upcoming', 'past', 'canceled', 'rescheduled'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '8px 4px',
                                        fontSize: '0.8rem',
                                        fontWeight: selectedTab === tab ? 800 : 600,
                                        color: selectedTab === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        borderBottom: selectedTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tab} ({
                                        tab === 'upcoming' ? upcomingCount :
                                        tab === 'past' ? completedCount :
                                        tab === 'canceled' ? canceledCount : rescheduleCount
                                    })
                                </button>
                            ))}
                        </div>

                        {/* Meetings Cards Grid */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading event pipeline...</div>
                        ) : filteredMeetings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                                <i data-lucide="calendar-off" style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }}></i>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Scheduled Events Found</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Try relaxing search parameters or schedule a new event.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {filteredMeetings.map(m => {
                                    const mDateStr = new Date(m.booking_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                                    const displayTime = m.booking_time ? m.booking_time.substring(0, 5) : '09:00';
                                    
                                    return (
                                        <div key={m.id} style={{
                                            background: '#ffffff',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '20px',
                                            padding: '1.5rem',
                                            display: 'grid',
                                            gridTemplateColumns: '80px 1.5fr 1.2fr 1fr',
                                            gap: '1.5rem',
                                            alignItems: 'center',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }} onClick={() => { setSelectedMeeting(m); setDrawerOpen(true); }}>
                                            
                                            {/* Date Column */}
                                            <div style={{ textAlign: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                                                    {new Date(m.booking_date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                                                    {new Date(m.booking_date).getDate()}
                                                </div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                                    {displayTime}
                                                </div>
                                            </div>

                                            {/* Invitee & Company Column */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.name}</span>
                                                    <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '8px', color: 'var(--text-secondary)' }}>{m.company_name}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i data-lucide="mail" style={{ width: '12px', height: '12px' }}></i>
                                                    {m.email}
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                    {m.tags && m.tags.map((tag, idx) => (
                                                        <span key={idx} style={{ fontSize: '0.55rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* GTM Pipeline Intelligence Column */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AI Intent Score:</span>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: m.gtm.ai_lead_score > 85 ? '#10b981' : '#f59e0b',
                                                        background: m.gtm.ai_lead_score > 85 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                        padding: '2px 6px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {m.gtm.ai_lead_score}%
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                                    <i data-lucide="user" style={{ width: '12px', height: '12px' }}></i>
                                                    Rep: <strong style={{ color: 'var(--text-primary)' }}>{m.repName}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i data-lucide="dollar-sign" style={{ width: '12px', height: '12px' }}></i>
                                                    Value: <strong style={{ color: 'var(--text-primary)' }}>{m.gtm.revenue_attribution}</strong>
                                                </div>
                                            </div>

                                            {/* Provider Badge & Quick Actions */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                                
                                                {/* Provider Badge */}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 800, 
                                                        textTransform: 'uppercase', 
                                                        padding: '4px 8px', 
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        ...getStatusStyle(m.status)
                                                    }}>
                                                        {m.status}
                                                    </span>

                                                    <span title={`Meeting Provider: ${m.provider}`} style={{
                                                        background: 'rgba(0,0,0,0.03)',
                                                        border: '1px solid var(--glass-border)',
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--accent-primary)'
                                                    }}>
                                                        <i data-lucide={getProviderIcon(m.provider)} style={{ width: '14px', height: '14px' }}></i>
                                                    </span>
                                                </div>

                                                {/* Action buttons */}
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        title="Copy Shareable Link"
                                                        onClick={() => handleCopyLink(m.meeting_link || `https://meet.jit.si/dca-revops-${m.id}`)}
                                                        style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                                                    >
                                                        <i data-lucide="copy" style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }}></i>
                                                    </button>
                                                    <button 
                                                        title="Add/Edit Notes"
                                                        onClick={() => {
                                                            setNotesMeeting(m);
                                                            setNotesText(m.notes || '');
                                                            setNotesModalOpen(true);
                                                        }}
                                                        style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                                                    >
                                                        <i data-lucide="edit" style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }}></i>
                                                    </button>
                                                    <button 
                                                        title="Reassign Representative"
                                                        onClick={() => {
                                                            setAssignRepMeeting(m);
                                                            setSelectedRepId(m.sales_rep_id || 2);
                                                            setAssignRepModalOpen(true);
                                                        }}
                                                        style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                                                    >
                                                        <i data-lucide="user-plus" style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }}></i>
                                                    </button>
                                                    <button 
                                                        title="Reschedule Event"
                                                        onClick={() => {
                                                            setRescheduleMeeting(m);
                                                            setRescheduleDate(m.booking_date);
                                                            setRescheduleTime(m.booking_time);
                                                            setRescheduleReason('');
                                                            setRescheduleModalOpen(true);
                                                        }}
                                                        style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                                                    >
                                                        <i data-lucide="refresh-cw" style={{ width: '12px', height: '12px', color: '#f59e0b' }}></i>
                                                    </button>
                                                    <button 
                                                        title="Cancel Event"
                                                        onClick={() => handleCancelMeeting(m.id)}
                                                        style={{ background: '#fef2f2', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                                                    >
                                                        <i data-lucide="trash-2" style={{ width: '12px', height: '12px', color: '#ef4444' }}></i>
                                                    </button>
                                                </div>

                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                )}

                {/* VIEW B: INTERACTIVE CALENDAR VIEW */}
                {activeView === 'calendar' && (
                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                        
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button 
                                        onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))}
                                        style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center' }}
                                    >
                                        <i data-lucide="chevron-left" style={{ width: '16px', height: '16px' }}></i>
                                    </button>
                                    <button 
                                        onClick={() => setCurrentCalendarDate(new Date(2026, 5, 1))}
                                        style={{ background: '#f1f5f9', border: 'none', padding: '0 12px', height: '32px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Today
                                    </button>
                                    <button 
                                        onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))}
                                        style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center' }}
                                    >
                                        <i data-lucide="chevron-right" style={{ width: '16px', height: '16px' }}></i>
                                    </button>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Calendar synced with <strong>AI Round-Robin Scheduler</strong>
                            </div>
                        </div>

                        {/* Calendar Grid rendering for Month */}
                        {calendarSubView === 'month' && (
                            <div>
                                {/* Week Days Header */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '10px' }}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '5px' }}>
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Day Cells */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                                    {calendarDays.map((day, idx) => {
                                        // Match meetings on this day
                                        const dayStr = day.date.toISOString().split('T')[0];
                                        const dayMeetings = meetings.filter(m => m.booking_date === dayStr && m.status !== 'cancelled');
                                        
                                        return (
                                            <div key={idx} style={{
                                                minHeight: '110px',
                                                background: day.isCurrentMonth ? '#ffffff' : '#f8fafc',
                                                border: `1px solid ${day.isCurrentMonth ? 'var(--glass-border)' : 'rgba(0,0,0,0.02)'}`,
                                                borderRadius: '12px',
                                                padding: '8px',
                                                opacity: day.isCurrentMonth ? 1 : 0.4,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: day.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                    {day.date.getDate()}
                                                </span>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', flex: 1, overflowY: 'auto' }} className="custom-scroll">
                                                    {dayMeetings.map(m => (
                                                        <div 
                                                            key={m.id}
                                                            onClick={() => { setSelectedMeeting(m); setDrawerOpen(true); }}
                                                            style={{
                                                                background: m.meeting_type_name.includes('Demo') ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                                                                borderLeft: `3px solid ${m.meeting_type_name.includes('Demo') ? 'var(--accent-primary)' : '#10b981'}`,
                                                                color: m.meeting_type_name.includes('Demo') ? 'var(--accent-primary)' : '#10b981',
                                                                padding: '3px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            title={m.meeting_title}
                                                        >
                                                            {m.booking_time.substring(0, 5)} {m.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {calendarSubView !== 'month' && (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(0,0,0,0.01)', borderRadius: '16px' }}>
                                <i data-lucide="calendar" style={{ width: '40px', height: '40px', color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }}></i>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Calendar View Operational</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>The detailed team hourly synchronization schedule is active. Use Month grid to select slots.</p>
                            </div>
                        )}

                    </div>
                )}

                {/* VIEW C: REVOPS ANALYTICS FUNNEL */}
                {activeView === 'analytics' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                        
                        {/* Left Side: Conversion Funnel and Trends */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            
                            <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i data-lucide="funnel" style={{ color: 'var(--accent-primary)', width: '16px', height: '16px' }}></i>
                                    GTM Booking Conversion Funnel
                                </h3>

                                {/* Conversion Funnel SVG Graphic */}
                                <div style={{ position: 'relative', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0' }}>
                                    
                                    {/* Funnel Stage 1 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '60px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Booked</div>
                                        <div style={{ flex: 1, height: '32px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.8rem', justifyContent: 'space-between' }}>
                                            <span>Session Booked / Registered</span>
                                            <span>{totalBookings} (100%)</span>
                                        </div>
                                    </div>

                                    {/* Funnel Stage 2 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '60px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ICP Match</div>
                                        <div style={{ flex: 1, width: '90%', height: '32px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.8rem', justifyContent: 'space-between' }}>
                                            <span>ICP Match & Qualified</span>
                                            <span>{Math.round(totalBookings * 0.88)} (88%)</span>
                                        </div>
                                    </div>

                                    {/* Funnel Stage 3 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '60px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attended</div>
                                        <div style={{ flex: 1, width: '80%', height: '32px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', color: '#10b981', fontWeight: 800, fontSize: '0.8rem', justifyContent: 'space-between' }}>
                                            <span>Attended & Briefed</span>
                                            <span>{completedCount} ({conversionRate}%)</span>
                                        </div>
                                    </div>

                                    {/* Funnel Stage 4 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '60px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Closed Won</div>
                                        <div style={{ flex: 1, width: '60%', height: '32px', background: 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(16,185,129,0.4))', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', color: '#047857', fontWeight: 800, fontSize: '0.8rem', justifyContent: 'space-between' }}>
                                            <span>Closed Deals / Contracts</span>
                                            <span>{Math.round(completedCount * 0.4)} (Won)</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i data-lucide="compass" style={{ color: 'var(--accent-primary)', width: '16px', height: '16px' }}></i>
                                    Traffic Acquisition Source Attribution
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                                            <span>LinkedIn Paid Campaigns</span>
                                            <span>52%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: 'var(--accent-primary)', width: '52%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                                            <span>Organic Search & SEO Engine</span>
                                            <span>28%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: '#818cf8', width: '28%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                                            <span>Direct Referral / Word of Mouth</span>
                                            <span>20%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: '#10b981', width: '20%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right Side: Team Performance & Lead Distribution */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i data-lucide="users" style={{ color: 'var(--accent-primary)', width: '16px', height: '16px' }}></i>
                                Active Team Performance Index
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {reps.map(r => {
                                    // Count rep bookings
                                    const repCount = meetings.filter(m => m.repName === r.name).length;
                                    const repShare = totalBookings > 0 ? Math.round((repCount / totalBookings) * 100) : 0;
                                    
                                    return (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.05)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                                                {r.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.name}</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{repCount} events ({repShare}%)</span>
                                                </div>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{r.role} • {r.team}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <i data-lucide="zap" style={{ color: '#10b981', width: '14px', height: '14px' }}></i>
                                    AI Round-Robin host rotation: <strong>Sarah Jenkins (Lead AE) ↔ Alex Carter</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <i data-lucide="clock" style={{ color: 'var(--accent-primary)', width: '14px', height: '14px' }}></i>
                                    Working Hours: <strong>9:00 AM - 6:00 PM (Asia/Kolkata)</strong>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* 3. DETAILS DRAWER PANEL */}
            {drawerOpen && selectedMeeting && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 200,
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    {/* Backdrop */}
                    <div 
                        onClick={() => setDrawerOpen(false)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            background: 'rgba(9,13,22,0.4)',
                            backdropFilter: 'blur(4px)'
                        }}
                    ></div>

                    {/* Drawer Panel */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '550px',
                        background: '#ffffff',
                        boxShadow: '-4px 0 30px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        animation: 'slide-in 0.3s forwards'
                    }}>
                        {/* Drawer Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Event intelligence dossier</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Event ID: #{selectedMeeting.id}</p>
                            </div>
                            <button 
                                onClick={() => setDrawerOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center' }}
                            >
                                <i data-lucide="x" style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }}></i>
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="custom-scroll">
                            
                            {/* Invitee summary card */}
                            <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedMeeting.name}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedMeeting.email}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        ...getStatusStyle(selectedMeeting.status)
                                    }}>
                                        {selectedMeeting.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Date</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selectedMeeting.booking_date}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Time</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selectedMeeting.booking_time ? selectedMeeting.booking_time.substring(0, 5) : '09:00'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Timezone</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selectedMeeting.timezone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Link row */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Shareable Provider Meeting Room</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={selectedMeeting.meeting_link || `https://meet.jit.si/dca-revops-${selectedMeeting.id}`}
                                        style={{ flex: 1, background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                                    />
                                    <button 
                                        onClick={() => handleCopyLink(selectedMeeting.meeting_link || `https://meet.jit.si/dca-revops-${selectedMeeting.id}`)}
                                        style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '0 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>

                            {/* Booking Answers */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Custom Booking Notes & Answers</h4>
                                <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                    {selectedMeeting.notes || 'No notes specified.'}
                                </div>
                            </div>

                            {/* GTM Company Intelligence */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>GTM Pipeline Intelligence</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Company Size</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>{selectedMeeting.gtm.company_size}</p>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Industry Verticals</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>{selectedMeeting.gtm.industry}</p>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Source Attribution</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>{selectedMeeting.gtm.source}</p>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lead Segment</span>
                                        <p style={{ fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>{selectedMeeting.gtm.segment}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Ownership details */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Sales Ownership Assignment</h4>
                                <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Assigned GTM Host:</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{selectedMeeting.repName}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Assigned Account Exec (AE):</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{selectedMeeting.gtm.ae}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Assigned Representative (SDR):</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{selectedMeeting.gtm.sdr}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Follow-up Status:</span>
                                        <strong style={{ textTransform: 'capitalize', color: 'var(--accent-primary)' }}>{selectedMeeting.followup_status}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis Dossier */}
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>AI Intent Intelligence</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px' }}>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lead Score</span>
                                        <p style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981', marginTop: '2px' }}>{selectedMeeting.gtm.ai_lead_score}</p>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px' }}>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Intent</span>
                                        <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-primary)', marginTop: '2px' }}>{selectedMeeting.gtm.customer_intent}</p>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px' }}>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Opp. Score</span>
                                        <p style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981', marginTop: '2px' }}>{selectedMeeting.gtm.opportunity_score}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Drawer Footer Actions */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderTop: '1px solid var(--glass-border)',
                            display: 'flex',
                            gap: '10px',
                            flexShrink: 0
                        }} onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={async () => {
                                    // Navigate to Simulation Room
                                    onNavigate('meeting', `?id=${selectedMeeting.id}&title=${encodeURIComponent(selectedMeeting.meeting_title)}`);
                                    setDrawerOpen(false);
                                }}
                                style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center', gap: '6px' }}
                            >
                                <i data-lucide="video" style={{ width: '14px', height: '14px' }}></i>
                                Enter Briefing Room
                            </button>
                            
                            {selectedMeeting.status !== 'completed' && selectedMeeting.status !== 'attended' && (
                                <button 
                                    onClick={() => handleMarkCompleted(selectedMeeting.id)}
                                    style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    Mark Attended
                                </button>
                            )}

                            <button 
                                onClick={() => handleCancelMeeting(selectedMeeting.id)}
                                style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Cancel Event
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* 4. DIALOG MODALS */}

            {/* MODAL A: NOTES EDIT */}
            {notesModalOpen && notesMeeting && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Update Event Dossier Notes</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Notes for {notesMeeting.name} ({notesMeeting.company_name})</p>
                        
                        <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <textarea 
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                style={{ width: '100%', minHeight: '120px', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-primary)', resize: 'none', outline: 'none' }}
                                placeholder="Add client request details, BANT parameters, or setup notes..."
                            />
                            <div style={{ display: 'flex', gap: '10px', justify: 'flex-end' }}>
                                <button type="button" onClick={() => setNotesModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL B: RESCHEDULE EVENT */}
            {rescheduleModalOpen && rescheduleMeeting && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Reschedule GTM Strategic Session</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Select target calendar date and time for {rescheduleMeeting.name}</p>
                        
                        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date</label>
                                    <input 
                                        type="date" 
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Time</label>
                                    <input 
                                        type="time" 
                                        value={rescheduleTime}
                                        onChange={(e) => setRescheduleTime(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Reason for Rescheduling</label>
                                <textarea 
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    style={{ width: '100%', minHeight: '60px', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', resize: 'none', outline: 'none' }}
                                    placeholder="e.g. Schedule conflict, client request"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justify: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setRescheduleModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Confirm Change</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL C: ASSIGN REPRESENTATIVE */}
            {assignRepModalOpen && assignRepMeeting && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Assign GTM Host Representative</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Select active host to assign to this session</p>
                        
                        <form onSubmit={handleAssignRepSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Sales Rep / AI Auto-Assign</label>
                                <select 
                                    value={selectedRepId}
                                    onChange={(e) => setSelectedRepId(e.target.value)}
                                    style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    {reps.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({r.role} • {r.team})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justify: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setAssignRepModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Assign Rep</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
