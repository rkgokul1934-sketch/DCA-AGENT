import React, { useState, useEffect } from 'react';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [widgets, setWidgets] = useState({
        total_contacts: 0,
        active_leads: 0,
        booked_this_week: 0,
        stale_leads: 0,
        conversion_rate: 0,
        upcoming_follow_ups: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedContact, setSelectedContact] = useState(null);
    const [activeProfileTab, setActiveProfileTab] = useState('intel');
    const [loading, setLoading] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Form fields
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company: '',
        industry: '', company_size: '50-200', revenue_segment: 'Mid-Market ($10M-$100M)',
        lead_source: 'Direct', owner: 'Sarah Jenkins', pipeline_stage: 'Discovery',
        follow_up_status: 'follow-up pending', sales_priority: 'Medium', lead_health: 'Healthy',
        notes: '', tags: ''
    });

    const [importText, setImportText] = useState('');

    // Quick Booking Modal States
    const [bookingContact, setBookingContact] = useState(null);
    const [bookingTemplates, setBookingTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [bookingDate, setBookingDate] = useState('2026-06-01');
    const [bookingSlots, setBookingSlots] = useState([]);
    const [selectedBookingTime, setSelectedBookingTime] = useState('');
    const [loadingBookingSlots, setLoadingBookingSlots] = useState(false);

    const defaultTemplates = [
        { id: 1, title: 'Product Demo Call', duration: 30, slug: 'demo', provider: 'google' },
        { id: 2, title: 'Executive Strategy Session', duration: 45, slug: 'strategy', provider: 'zoom' },
        { id: 3, title: 'Technical Integration Review', duration: 60, slug: 'deepdive', provider: 'teams' }
    ];

    // Load templates on mount for quick booking
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const response = await fetch('/api/v1/event-templates/');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setBookingTemplates(data);
                        setSelectedTemplate(data[0]);
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to load templates in contacts booking:", err);
            }
            setBookingTemplates(defaultTemplates);
            setSelectedTemplate(defaultTemplates[0]);
        };
        loadTemplates();
    }, []);

    const fetchQuickBookingSlots = async (targetDate) => {
        setLoadingBookingSlots(true);
        setBookingSlots([]);
        try {
            const response = await fetch(`/api/v1/legacy-bookings/available-slots?date=${targetDate}`);
            const data = await response.json();
            if (response.ok) {
                setBookingSlots(data);
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        } finally {
            setLoadingBookingSlots(false);
        }
    };

    const handleQuickBookingDateChange = (dateVal) => {
        setBookingDate(dateVal);
        fetchQuickBookingSlots(dateVal);
    };

    const handleQuickBookSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBookingTime) {
            alert("Please select a time slot.");
            return;
        }
        try {
            const meetingTitle = `${selectedTemplate.title}: ${bookingContact.company || 'Enterprise'}`;
            const response = await fetch('/api/v1/legacy-bookings/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: bookingContact.name,
                    email: bookingContact.email,
                    company_name: bookingContact.company || 'Enterprise Client',
                    meeting_title: meetingTitle,
                    booking_date: bookingDate,
                    booking_time: selectedBookingTime,
                    timezone: 'Asia/Kolkata',
                    meeting_type_slug: selectedTemplate.slug,
                    provider: selectedTemplate.provider || 'open'
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ Meeting scheduled successfully with ${bookingContact.name}!\nAn email invitation has been sent to ${bookingContact.email}.`);
                setBookingContact(null);
                setSelectedBookingTime('');
                // Refresh contacts list to update meeting status/timeline
                fetchContacts();
                fetchWidgets();
            } else {
                alert(data.detail || 'Failed to complete scheduling.');
            }
        } catch (err) {
            alert('Connection failure during scheduling.');
        }
    };

    useEffect(() => {
        fetchContacts();
        fetchWidgets();
    }, [activeFilter, searchQuery]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [contacts, loading, selectedContact, activeProfileTab, showAddModal, showEditModal, bookingContact]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('dca_token');
            const url = `/api/v1/contacts/?filter_type=${activeFilter}&search=${encodeURIComponent(searchQuery)}`;
            const res = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
                // Auto-select first contact if none selected
                if (data.length > 0 && !selectedContact) {
                    setSelectedContact(data[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    const getAIRecommendation = (c) => {
        if (!c) return "Select a contact to analyze.";
        if (c.lead_health === 'Critical') {
            return `🚨 Account Health is CRITICAL due to inactive engagement. Schedule an emergency sync call immediately with ${c.owner || 'Sarah Jenkins'} to prevent churn.`;
        }
        if (c.pipeline_stage === 'Closed Won') {
            return `🎉 Lead successfully won! Recommend triggering post-sales onboarding and setting up a recurring QBR integration pipeline.`;
        }
        if (c.pipeline_stage === 'Closed Lost') {
            return `💔 Lead lost. Recommend scheduling a feedback survey email in 30 days and adding to the cold-nurture outreach flow.`;
        }
        if (c.ai_intent_score > 90) {
            if (c.pipeline_stage === 'Discovery') {
                return `🔥 Intent score is extremely high (${Math.round(c.ai_intent_score)}%). Recommend moving stage to "Qualification" and dispatching the customized integration proposal.`;
            }
            if (c.pipeline_stage === 'Proposal') {
                return `🔥 Highly engaged prospect in Proposal stage. Dispatch pricing options deck and propose a technical onboarding kickoff.`;
            }
            return `🔥 Lead shows high engagement. Recommend immediate follow-up outreach regarding CRM integration specifications.`;
        }
        if (!c.next_meeting && !c.last_meeting) {
            return `✉️ Cold Lead. Recommend initializing automated Stark AI outbound email sequence with scheduler links.`;
        }
        return `📈 Warm lead. Recommend dispatching product feature comparison deck tailored to the ${c.industry || 'technology'} sector.`;
    };

    const handleExecuteAIAction = async (c) => {
        if (!c) return;
        
        let updateFields = {};
        let successMessage = "";
        
        if (c.lead_health === 'Critical') {
            updateFields = {
                lead_health: 'Healthy',
                notes: `${c.notes || ''}\n[AI Execution: Triggered emergency review call with Sarah Jenkins on ${new Date().toLocaleDateString()}]`,
                follow_up_status: 'contacted'
            };
            successMessage = "Emergency review call scheduled! Lead Health updated to Healthy.";
        } else if (c.pipeline_stage === 'Closed Won') {
            updateFields = {
                notes: `${c.notes || ''}\n[AI Execution: Initialized customer success onboarding flow on ${new Date().toLocaleDateString()}]`
            };
            successMessage = "Customer Success Onboarding Flow initialized successfully!";
        } else if (c.pipeline_stage === 'Closed Lost') {
            updateFields = {
                notes: `${c.notes || ''}\n[AI Execution: Moved to cold-nurture campaign stream on ${new Date().toLocaleDateString()}]`
            };
            successMessage = "Added to cold-nurture outreach stream!";
        } else if (c.ai_intent_score > 90) {
            if (c.pipeline_stage === 'Discovery') {
                updateFields = {
                    pipeline_stage: 'Qualification',
                    notes: `${c.notes || ''}\n[AI Execution: Upgraded stage to Qualification; dispatched custom integration proposal draft on ${new Date().toLocaleDateString()}]`,
                    follow_up_status: 'proposal sent'
                };
                successMessage = "Pipeline stage updated to Qualification and custom proposal email sent!";
            } else if (c.pipeline_stage === 'Proposal') {
                updateFields = {
                    notes: `${c.notes || ''}\n[AI Execution: Dispatched pricing comparison options deck on ${new Date().toLocaleDateString()}]`
                };
                successMessage = "Pricing comparison deck dispatched to prospect email!";
            } else {
                updateFields = {
                    notes: `${c.notes || ''}\n[AI Execution: Dispatched follow-up email regarding custom API options on ${new Date().toLocaleDateString()}]`
                };
                successMessage = "API options documentation dispatched to prospect email!";
            }
        } else if (!c.next_meeting && !c.last_meeting) {
            updateFields = {
                notes: `${c.notes || ''}\n[AI Execution: Dispatched automated Stark AI scheduler link email on ${new Date().toLocaleDateString()}]`,
                follow_up_status: 'follow-up pending'
            };
            successMessage = "Outbound Stark AI scheduler link sent!";
        } else {
            updateFields = {
                notes: `${c.notes || ''}\n[AI Execution: Dispatched product feature comparison deck tailored to ${c.industry || 'technology'} on ${new Date().toLocaleDateString()}]`
            };
            successMessage = `Product feature deck dispatched to prospect email!`;
        }

        // Add a timeline activity entry
        const actions = (c.timeline_activity && c.timeline_activity.actions) || [];
        const newAction = {
            date: new Date().toISOString().split('T')[0],
            type: "ai_action",
            detail: successMessage
        };
        updateFields.timeline_activity = {
            actions: [newAction, ...actions]
        };

        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch(`/api/v1/contacts/${c.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(updateFields)
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedContact(updated);
                setContacts(prev => prev.map(item => item.id === c.id ? updated : item));
                alert(successMessage);
                fetchWidgets();
            } else {
                alert("Failed to execute AI recommendation.");
            }
        } catch (err) {
            alert("Error communicating with the backend.");
        }
    };

    const getActivityBadgeStyle = (type) => {
        switch (type) {
            case 'meeting':
                return { bg: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
            case 'booking':
                return { bg: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
            case 'event':
                return { bg: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
            case 'contract':
                return { bg: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: '#10b981' };
            case 'ai_action':
                return { bg: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', color: '#6366f1' };
            default:
                return { bg: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.15)', color: '#64748b' };
        }
    };

    const fetchWidgets = async () => {
        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch('/api/v1/contacts/widgets', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setWidgets(data);
            }
        } catch (err) {
            console.error("Error fetching widgets:", err);
        }
    };

    const handleSaveContact = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('dca_token');
            const method = showEditModal ? 'PUT' : 'POST';
            const url = showEditModal ? `/api/v1/contacts/${selectedContact.id}` : '/api/v1/contacts/';
            
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const saved = await res.json();
                setShowAddModal(false);
                setShowEditModal(false);
                fetchContacts();
                fetchWidgets();
                setSelectedContact(saved);
                alert(showEditModal ? "Contact updated successfully!" : "Contact created successfully!");
            } else {
                const errData = await res.json();
                alert(errData.detail || "Action failed.");
            }
        } catch (err) {
            alert("Error saving contact.");
        }
    };

    const handleDeleteContact = async (id) => {
        if (!confirm("Are you sure you want to delete this contact?")) return;
        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch(`/api/v1/contacts/${id}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                setSelectedContact(null);
                fetchContacts();
                fetchWidgets();
                alert("Contact deleted successfully.");
            }
        } catch (err) {
            console.error("Error deleting contact:", err);
        }
    };

    const handleImportContacts = async (e) => {
        e.preventDefault();
        try {
            const parsed = JSON.parse(importText);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const token = localStorage.getItem('dca_token');
            const res = await fetch('/api/v1/contacts/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(list)
            });
            if (res.ok) {
                const out = await res.json();
                alert(out.message);
                setShowImportModal(false);
                setImportText('');
                fetchContacts();
                fetchWidgets();
            } else {
                alert("Import failed. Make sure properties match ContactCreate model schema.");
            }
        } catch (err) {
            alert("Invalid JSON format. Please check syntax.");
        }
    };

    const handleExportContacts = async () => {
        try {
            const token = localStorage.getItem('dca_token');
            const res = await fetch('/api/v1/contacts/export', {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const out = await res.json();
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(out.data, null, 2))}`;
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", jsonString);
                downloadAnchor.setAttribute("download", "gtm_contacts_export.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            }
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const openAddModal = () => {
        setFormData({
            name: '', email: '', phone: '', company: '',
            industry: '', company_size: '50-200', revenue_segment: 'Mid-Market ($10M-$100M)',
            lead_source: 'Direct', owner: 'Sarah Jenkins', pipeline_stage: 'Discovery',
            follow_up_status: 'follow-up pending', sales_priority: 'Medium', lead_health: 'Healthy',
            notes: '', tags: ''
        });
        setShowAddModal(true);
    };

    const openEditModal = () => {
        if (!selectedContact) return;
        setFormData({
            name: selectedContact.name || '',
            email: selectedContact.email || '',
            phone: selectedContact.phone || '',
            company: selectedContact.company || '',
            industry: selectedContact.industry || '',
            company_size: selectedContact.company_size || '50-200',
            revenue_segment: selectedContact.revenue_segment || 'Mid-Market ($10M-$100M)',
            lead_source: selectedContact.lead_source || 'Direct',
            owner: selectedContact.owner || 'Sarah Jenkins',
            pipeline_stage: selectedContact.pipeline_stage || 'Discovery',
            follow_up_status: selectedContact.follow_up_status || 'follow-up pending',
            sales_priority: selectedContact.sales_priority || 'Medium',
            lead_health: selectedContact.lead_health || 'Healthy',
            notes: selectedContact.notes || '',
            tags: selectedContact.tags || ''
        });
        setShowEditModal(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', color: 'var(--text-primary)', overflow: 'hidden' }}>
            
            {/* Header Block */}
            <div style={{ background: '#ffffff', borderBottom: '1px solid var(--glass-border)', padding: '1.5rem 2rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Contacts & Pipelines</h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage calendar prospects, track AI lead scores, and monitor account health in real-time.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleExportContacts} style={{ background: '#ffffff', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i data-lucide="download" style={{ width: '14px' }}></i> Export
                        </button>
                        <button onClick={() => setShowImportModal(true)} style={{ background: '#ffffff', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i data-lucide="upload" style={{ width: '14px' }}></i> Import
                        </button>
                        <button onClick={openAddModal} style={{ background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)', border: 'none', color: '#ffffff', padding: '0.5rem 1.2rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(99,102,241,0.2)' }}>
                            <i data-lucide="user-plus" style={{ width: '14px' }}></i> Add Contact
                        </button>
                    </div>
                </div>

                {/* Dashboard Widgets Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="users" style={{ width: '14px', color: 'var(--accent-blue)' }}></i> Total Contacts
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.total_contacts}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="target" style={{ width: '14px', color: '#10b981' }}></i> Active Leads
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.active_leads}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="calendar" style={{ width: '14px', color: '#f59e0b' }}></i> Booked Demos
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.booked_this_week}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="shield-alert" style={{ width: '14px', color: '#ef4444' }}></i> Stale Leads
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.stale_leads}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="trending-up" style={{ width: '14px', color: '#8b5cf6' }}></i> Conversion %
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.conversion_rate}%</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            <i data-lucide="clock" style={{ width: '14px', color: '#06b6d4' }}></i> Follow-ups
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>{widgets.upcoming_follow_ups}</div>
                    </div>
                </div>
            </div>

            {/* Split Main View Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Side Filters Sidebar (1/4 Width) */}
                <div style={{ width: '240px', background: '#ffffff', borderRight: '1px solid var(--glass-border)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '8px', marginBottom: '10px' }}>Lead Filters</h3>
                    {[
                        { id: 'all', label: 'All Contacts', icon: 'users' },
                        { id: 'new', label: 'New Contacts', icon: 'sparkles' },
                        { id: 'no_meetings', label: 'No Meetings', icon: 'calendar-x' },
                        { id: 'inactive_30_days', label: 'Inactive 30 Days', icon: 'moon' },
                        { id: 'upcoming_meetings', label: 'Upcoming Meetings', icon: 'calendar-days' },
                        { id: 'booked_demos', label: 'Booked Demos', icon: 'monitor' },
                        { id: 'warm_leads', label: 'Warm Leads (70-85)', icon: 'flame' },
                        { id: 'hot_leads', label: 'Hot Leads (>85)', icon: 'zap' }
                    ].map(filt => (
                        <button
                            key={filt.id}
                            onClick={() => setActiveFilter(filt.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: activeFilter === filt.id ? '800' : '600',
                                color: activeFilter === filt.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: activeFilter === filt.id ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide={filt.icon} style={{ width: '14px' }}></i>
                            {filt.label}
                        </button>
                    ))}
                </div>

                {/* Central Contacts Grid & Table Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
                    
                    {/* Search and Filters Bar */}
                    <div style={{ background: '#ffffff', borderBottom: '1px solid var(--glass-border)', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input 
                                type="text"
                                placeholder="Search by name, email, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#f8fafc',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    padding: '8px 12px 8px 36px',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <i data-lucide="search" style={{ position: 'absolute', left: '12px', top: '10px', width: '14px', color: 'var(--text-secondary)' }}></i>
                        </div>
                        <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            Reset
                        </button>
                    </div>

                    {/* Table View */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div key="contacts-loading" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading contacts GTM intelligence...</div>
                        ) : contacts.length === 0 ? (
                            <div key="contacts-empty" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <i data-lucide="users" style={{ width: '40px', height: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                                <div style={{ fontWeight: 800 }}>No Contacts Found</div>
                                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Try adjusting your search or active filters.</div>
                            </div>
                        ) : (
                            <table key="contacts-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: 800 }}>
                                        <th style={{ padding: '12px 20px' }}>Name</th>
                                        <th style={{ padding: '12px 20px' }}>Company</th>
                                        <th style={{ padding: '12px 20px' }}>Meetings (Last/Next)</th>
                                        <th style={{ padding: '12px 20px' }}>Owner</th>
                                        <th style={{ padding: '12px 20px' }}>Status</th>
                                        <th style={{ padding: '12px 20px' }}>GTM Analytics</th>
                                        <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(c => {
                                        const isSelected = selectedContact && selectedContact.id === c.id;
                                        return (
                                            <tr 
                                                key={c.id} 
                                                onClick={() => setSelectedContact(c)}
                                                style={{ 
                                                    background: isSelected ? 'rgba(99,102,241,0.04)' : '#ffffff', 
                                                    borderBottom: '1px solid var(--glass-border)', 
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                            {c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setBookingContact(c);
                                                                    handleQuickBookingDateChange(bookingDate);
                                                                }}
                                                                style={{ 
                                                                    fontWeight: 800, 
                                                                    color: 'var(--accent-blue)', 
                                                                    cursor: 'pointer',
                                                                    textDecoration: 'underline'
                                                                }}
                                                                title="Click to schedule a meeting with this contact"
                                                            >
                                                                {c.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.company || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.industry || 'Tech & Services'}</div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.75rem', color: c.last_meeting ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            🟢 Last: {c.last_meeting || 'None'}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: c.next_meeting ? 'var(--accent-blue)' : 'var(--text-secondary)', fontWeight: c.next_meeting ? 800 : 500 }}>
                                                            🔵 Next: {c.next_meeting || 'None'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                                    {c.owner}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{ 
                                                        background: c.pipeline_stage === 'Closed Won' ? 'rgba(16,185,129,0.1)' : c.pipeline_stage === 'Closed Lost' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.08)',
                                                        color: c.pipeline_stage === 'Closed Won' ? '#10b981' : c.pipeline_stage === 'Closed Lost' ? '#ef4444' : 'var(--accent-blue)',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {c.pipeline_stage}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div title="AI Intent Score" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                                                            🔥 INTENT: {Math.round(c.ai_intent_score)}%
                                                        </div>
                                                        <div title="Lead Score" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                                                            🧠 GTM: {Math.round(c.lead_score)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => { setSelectedContact(c); openEditModal(); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Edit">
                                                            <i data-lucide="edit-3" style={{ width: '14px' }}></i>
                                                        </button>
                                                        <button onClick={() => handleDeleteContact(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete">
                                                            <i data-lucide="trash-2" style={{ width: '14px' }}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Side GTM Profile Intelligence Panel (1/3 Width) */}
                {selectedContact && (
                    <div style={{ width: '380px', background: '#ffffff', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.02)', position: 'relative' }}>
                            <button 
                                onClick={() => setSelectedContact(null)} 
                                style={{ 
                                    position: 'absolute', 
                                    top: '1rem', 
                                    right: '1rem', 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                }} 
                                title="Close details panel"
                            >
                                &times;
                            </button>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingRight: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                                    {selectedContact.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedContact.name}</h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedContact.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '1rem' }}>
                                {selectedContact.tags && selectedContact.tags.split(',').map((t, idx) => (
                                    <span key={idx} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 700 }}>
                                        {t.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: '#ffffff', flexShrink: 0 }}>
                            {[
                                { id: 'intel', label: 'GTM Intel' },
                                { id: 'meetings', label: 'History' },
                                { id: 'scores', label: 'AI Analytics' },
                                { id: 'notes', label: 'Notes' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveProfileTab(tab.id)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 8px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeProfileTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                        color: activeProfileTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        fontSize: '0.75rem',
                                        fontWeight: activeProfileTab === tab.id ? 800 : 600,
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Contents */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem' }}>
                            
                            {/* Tab 1: GTM Intelligence */}
                            {activeProfileTab === 'intel' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    
                                    {/* Company Section */}
                                    <div>
                                        <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Company Information</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 14px', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Company</span><span style={{ fontWeight: 700 }}>{selectedContact.company}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Industry</span><span>{selectedContact.industry || 'N/A'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Domain</span><span>{selectedContact.domain || 'N/A'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Size</span><span>{selectedContact.company_size || 'N/A'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Revenue Segment</span><span>{selectedContact.revenue_segment || 'N/A'}</span></div>
                                        </div>
                                    </div>

                                    {/* Owner Section */}
                                    <div>
                                        <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Sales Ownership</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 14px', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Assigned Rep</span><span style={{ fontWeight: 700 }}>{selectedContact.assigned_rep || selectedContact.owner}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Team segment</span><span>{selectedContact.team || 'Enterprise'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Account Owner</span><span>{selectedContact.account_owner || selectedContact.owner}</span></div>
                                        </div>
                                    </div>

                                    {/* Lifecycle Section */}
                                    <div>
                                        <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Follow-up & Health</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 14px', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Status</span><span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{selectedContact.follow_up_status || 'follow-up pending'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Lead Health</span><span style={{ color: selectedContact.lead_health === 'Healthy' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{selectedContact.lead_health || 'Healthy'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Priority</span><span style={{ fontWeight: 700 }}>{selectedContact.sales_priority || 'Medium'}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Next Action Date</span><span>{selectedContact.next_action_date || 'N/A'}</span></div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Tab 2: Meeting History */}
                            {activeProfileTab === 'meetings' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total Bookings</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>3</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Attended</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>2</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>Timeline Activity Feed</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '14px', marginLeft: '6px' }}>
                                            {selectedContact.timeline_activity && selectedContact.timeline_activity.actions ? (
                                                selectedContact.timeline_activity.actions.map((act, index) => {
                                                    const badge = getActivityBadgeStyle(act.type);
                                                    return (
                                                        <div key={index} style={{
                                                            position: 'relative',
                                                            fontSize: '0.75rem',
                                                            background: badge.bg,
                                                            border: badge.border,
                                                            borderRadius: '12px',
                                                            padding: '10px 12px',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <div style={{ position: 'absolute', left: '-20px', top: '14px', width: '8px', height: '8px', borderRadius: '50%', background: badge.color, border: '2px solid white' }}></div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: badge.color }}>
                                                                    {act.type.replace('_', ' ')}
                                                                </span>
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>{act.date}</span>
                                                            </div>
                                                            <div style={{ color: 'var(--text-primary)', fontSize: '0.72rem', marginTop: '4px', lineHeight: 1.3, fontWeight: 500 }}>
                                                                {act.detail}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No timeline activities registered yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Analytics Scores */}
                            {activeProfileTab === 'scores' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {[
                                        { label: 'AI Intent Score', val: selectedContact.ai_intent_score, color: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
                                        { label: 'Lead Score', val: selectedContact.lead_score, color: 'linear-gradient(90deg, #818cf8, var(--accent-blue))' },
                                        { label: 'Conversion Score', val: selectedContact.conversion_score, color: 'linear-gradient(90deg, #34d399, #10b981)' },
                                        { label: 'Engagement Score', val: selectedContact.engagement_score, color: 'linear-gradient(90deg, #a78bfa, #8b5cf6)' },
                                        { label: 'Response Rate', val: selectedContact.response_rate, color: 'linear-gradient(90deg, #22d3ee, #06b6d4)' }
                                    ].map((score, sidx) => (
                                        <div key={sidx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                                                <span>{score.label}</span>
                                                <span style={{ color: 'var(--text-primary)' }}>{Math.round(score.val)}%</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${score.val}%`, height: '100%', background: score.color, borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedContact.booking_frequency && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Booking Frequency</span>
                                            <span style={{ fontWeight: 800 }}>{selectedContact.booking_frequency}</span>
                                        </div>
                                    )}

                                    {/* AI Recommendation Alert */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(129, 140, 248, 0.04) 100%)',
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                        borderRadius: '16px',
                                        padding: '1.2rem',
                                        marginTop: '0.4rem',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <i data-lucide="sparkles" style={{ width: '14px', height: '14px', color: 'var(--accent-blue)' }}></i>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Recommended Action</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                            {getAIRecommendation(selectedContact)}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Confidence Score: <strong>{selectedContact.lead_score ? Math.round(selectedContact.lead_score * 0.9 + 8) : 85}%</strong></span>
                                            <button 
                                                onClick={() => handleExecuteAIAction(selectedContact)}
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                                                }}
                                            >
                                                Execute Action
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Notes */}
                            {activeProfileTab === 'notes' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>GTM Lead Qualification Notes</h4>
                                    <textarea 
                                        value={formData.notes || selectedContact.notes || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add notes about discovery calls, integrations requirements, pricing alignments..."
                                        style={{
                                            width: '100%',
                                            height: '140px',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            padding: '10px',
                                            fontSize: '0.75rem',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            resize: 'none'
                                        }}
                                    />
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('dca_token');
                                                const res = await fetch(`/api/v1/contacts/${selectedContact.id}`, {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                                    },
                                                    body: JSON.stringify({ notes: formData.notes })
                                                });
                                                if (res.ok) {
                                                    const updated = await res.json();
                                                    setSelectedContact(updated);
                                                    alert("Note saved successfully!");
                                                }
                                            } catch(e) {
                                                alert("Failed to save note.");
                                            }
                                        }}
                                        style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, alignSelf: 'flex-end' }}
                                    >
                                        Save Note
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD CONTACT */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Add New Contact</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveContact} style={{ padding: '1.5rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Full Name *</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Email *</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Phone</label>
                                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Company Name</label>
                                <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Industry</label>
                                <input type="text" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} placeholder="SaaS, Aerospace, Conglomerate..." style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Company Size</label>
                                <select value={formData.company_size} onChange={(e) => setFormData({...formData, company_size: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                    <option value="1-50">1-50 employees</option>
                                    <option value="50-200">50-200 employees</option>
                                    <option value="200-1000">200-1000 employees</option>
                                    <option value="1000-5000">1000-5000 employees</option>
                                    <option value="10,000+">10,000+ employees</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Pipeline Stage</label>
                                <select value={formData.pipeline_stage} onChange={(e) => setFormData({...formData, pipeline_stage: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                    <option value="Discovery">Discovery</option>
                                    <option value="Qualification">Qualification</option>
                                    <option value="Proposal">Proposal</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Lead Owner</label>
                                <input type="text" value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="enterprise, warm_lead, cloud" style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'var(--accent-blue)', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Save Contact</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT CONTACT */}
            {showEditModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Edit Contact Profile</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveContact} style={{ padding: '1.5rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Full Name *</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Email *</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Phone</label>
                                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Company Name</label>
                                <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Industry</label>
                                <input type="text" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Company Size</label>
                                <select value={formData.company_size} onChange={(e) => setFormData({...formData, company_size: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                    <option value="1-50">1-50 employees</option>
                                    <option value="50-200">50-200 employees</option>
                                    <option value="200-1000">200-1000 employees</option>
                                    <option value="1000-5000">1000-5000 employees</option>
                                    <option value="10,000+">10,000+ employees</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Pipeline Stage</label>
                                <select value={formData.pipeline_stage} onChange={(e) => setFormData({...formData, pipeline_stage: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                    <option value="Discovery">Discovery</option>
                                    <option value="Qualification">Qualification</option>
                                    <option value="Proposal">Proposal</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Lead Owner</label>
                                <input type="text" value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="enterprise, warm_lead, cloud" style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'var(--accent-blue)', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: IMPORT CONTACTS */}
            {showImportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Import Contacts JSON</h3>
                            <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&times;</button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Paste raw JSON array matching GTM contacts model details (e.g. {'[{"name": "...", "email": "..."}]'}).</p>
                        <form onSubmit={handleImportContacts} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <textarea 
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder={`[\n  {\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "company": "Example Inc."\n  }\n]`}
                                style={{
                                    width: '100%',
                                    height: '180px',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowImportModal(false)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'var(--accent-blue)', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Run Import</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QUICK BOOKING MODAL */}
            {bookingContact && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Schedule Meeting with {bookingContact.name}</h3>
                            <button onClick={() => setBookingContact(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleQuickBookSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Select a meeting type and available slot. A calendar invitation will be automatically sent to <strong>{bookingContact.email}</strong>.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Meeting Type</label>
                                <select 
                                    value={selectedTemplate ? selectedTemplate.id : ''} 
                                    onChange={(e) => {
                                        const found = bookingTemplates.find(t => t.id === parseInt(e.target.value));
                                        if (found) setSelectedTemplate(found);
                                    }} 
                                    style={{ padding: '10px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.85rem', background: '#f8fafc', outline: 'none', color: 'var(--text-primary)' }}
                                >
                                    {bookingTemplates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title} ({t.duration} min)</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Date</label>
                                <input 
                                    type="date" 
                                    value={bookingDate} 
                                    onChange={(e) => handleQuickBookingDateChange(e.target.value)} 
                                    style={{ padding: '10px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.85rem', background: '#f8fafc', outline: 'none', color: 'var(--text-primary)' }} 
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Time Slot</label>
                                {loadingBookingSlots ? (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', padding: '10px 0' }}>Retrieving availability...</div>
                                ) : bookingSlots.length === 0 ? (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '10px 0' }}>No slots available for this date.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '4px' }}>
                                        {bookingSlots.map((slot, idx) => {
                                            const isAvailable = slot.available !== false;
                                            const displayTime = slot.time ? slot.time.substring(0, 5) : '09:00';
                                            const isSelected = selectedBookingTime === slot.time;
                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    disabled={!isAvailable}
                                                    onClick={() => setSelectedBookingTime(slot.time)}
                                                    style={{
                                                        background: isSelected ? 'var(--accent-blue)' : isAvailable ? '#f1f5f9' : 'rgba(0,0,0,0.02)',
                                                        color: isSelected ? '#ffffff' : isAvailable ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                        border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                                                        borderRadius: '10px',
                                                        padding: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                        opacity: isAvailable ? 1 : 0.5,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {displayTime}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setBookingContact(null)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={!selectedBookingTime} style={{ background: selectedBookingTime ? 'var(--accent-blue)' : '#cbd5e1', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: selectedBookingTime ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: selectedBookingTime ? '0 4px 10px rgba(99,102,241,0.2)' : 'none' }}>
                                    Confirm & Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
