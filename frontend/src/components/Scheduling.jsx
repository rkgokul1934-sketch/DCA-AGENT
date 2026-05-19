import React, { useState, useEffect } from 'react';
import EventTypeEditor from './EventTypeEditor';

export default function Scheduling({ onNavigate }) {
    // Tab switching: 'event_types', 'single_use', 'polls', 'routing_forms', 'team_events'
    const [activeTab, setActiveTab] = useState('event_types');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedWorkspace, setSelectedWorkspace] = useState('main');
    const [bulkSelected, setBulkSelected] = useState([]);

    // GTM Intelligence view toggles
    const [showGtmIntelligence, setShowGtmIntelligence] = useState(true);

    // Event Templates State
    const [eventTemplates, setEventTemplates] = useState([
        {
            id: 1,
            title: 'Product Demo Call',
            slug: 'demo',
            duration: 30,
            provider: 'google',
            type: 'one-on-one',
            availability: 'Weekdays (9am-5pm)',
            color: '#6366f1',
            active: true,
            desc: 'Deep dive overview of RevOps orchestration and database automation.',
            bookingsCount: 42,
            revenueAttributed: '$126,000',
            approvalType: 'auto',
            questions: ['Company size?', 'CRM in use?']
        },
        {
            id: 2,
            title: 'Executive Strategy Session',
            slug: 'strategy',
            duration: 45,
            provider: 'zoom',
            type: 'round robin',
            availability: 'Mon, Wed, Fri (10am-4pm)',
            color: '#8b5cf6',
            active: true,
            desc: 'Bespoke alignment session covering BANT qualification parameters.',
            bookingsCount: 28,
            revenueAttributed: '$180,000',
            approvalType: 'manual',
            questions: ['Expected deal value?', 'Decision maker involved?']
        },
        {
            id: 3,
            title: 'Technical Integration Review',
            slug: 'deepdive',
            duration: 60,
            provider: 'teams',
            type: 'collective',
            availability: 'Weekdays (9am-5pm)',
            color: '#10b981',
            active: false,
            desc: 'OAuth integrations, webhooks, and enterprise security review.',
            bookingsCount: 15,
            revenueAttributed: '$45,000',
            approvalType: 'manager',
            questions: ['Cloud provider?', 'Security compliance required?']
        },
        {
            id: 4,
            title: 'Discovery & Qualification',
            slug: 'discovery',
            duration: 15,
            provider: 'open',
            type: 'discovery call',
            availability: 'Anytime (24/7 Auto)',
            color: '#f59e0b',
            active: true,
            desc: 'Short check-in to verify lead segment and pipeline requirements.',
            bookingsCount: 89,
            revenueAttributed: '$310,000',
            approvalType: 'auto',
            questions: ['Timeline for implementation?']
        }
    ]);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editTemplate, setEditTemplate] = useState(null);
    const [routingModalOpen, setRoutingModalOpen] = useState(false);
    const [pollModalOpen, setPollModalOpen] = useState(false);
    const [singleLinkModalOpen, setSingleLinkModalOpen] = useState(false);
    // Drawer for EventTypeEditor
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Form inputs for Create/Edit Template
    const [newTitle, setNewTitle] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newDuration, setNewDuration] = useState(30);
    const [newProvider, setNewProvider] = useState('google');
    const [newType, setNewType] = useState('one-on-one');
    const [newColor, setNewColor] = useState('#6366f1');
    const [newDesc, setNewDesc] = useState('');
    const [newApproval, setNewApproval] = useState('auto');
    const [newQuestions, setNewQuestions] = useState('');

    // Single use link state
    const [generatedSingleUrl, setGeneratedSingleUrl] = useState('');
    const [singleExpiry, setSingleExpiry] = useState('24');
    const [singleLimit, setSingleLimit] = useState(true);

    // Meeting poll state
    const [pollTitle, setPollTitle] = useState('Select times for Architecture Review');
    const [pollSlots, setPollSlots] = useState([
        { date: '2026-06-01', time: '10:00', votes: 3 },
        { date: '2026-06-01', time: '14:00', votes: 5 },
        { date: '2026-06-02', time: '11:00', votes: 2 }
    ]);

    // Lead Routing Configuration State
    const [routingRules, setRoutingRules] = useState({
        regionBased: true,
        companySizeBased: true,
        sizeLimit: 500,
        syncToCrm: true,
        crmOpportunityStage: 'Qualified Lead',
        aiLeadScoring: true,
        minLeadScore: 70
    });

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, eventTemplates, createModalOpen, routingModalOpen, pollModalOpen, singleLinkModalOpen, showGtmIntelligence]);

    // Create / Update handler
    const handleSaveTemplate = (e) => {
        e.preventDefault();
        if (editTemplate) {
            // Edit mode
            setEventTemplates(prev => prev.map(t => t.id === editTemplate.id ? {
                ...t,
                title: newTitle,
                slug: newSlug,
                duration: parseInt(newDuration),
                provider: newProvider,
                type: newType,
                color: newColor,
                desc: newDesc,
                approvalType: newApproval,
                questions: newQuestions.split(',').map(q => q.trim()).filter(Boolean)
            } : t));
        } else {
            // Create mode
            const newT = {
                id: Date.now(),
                title: newTitle || 'Custom Strategy Session',
                slug: newSlug || 'custom',
                duration: parseInt(newDuration),
                provider: newProvider,
                type: newType,
                availability: 'Weekdays (9am-5pm)',
                color: newColor,
                active: true,
                desc: newDesc || 'Custom booking template configured via Admin workspace.',
                bookingsCount: 0,
                revenueAttributed: '$0',
                approvalType: newApproval,
                questions: newQuestions.split(',').map(q => q.trim()).filter(Boolean)
            };
            setEventTemplates(prev => [...prev, newT]);
        }
        closeCreateModal();
    };

    const openEditTemplate = (template) => {
        setEditingEvent(template);
        setEditorOpen(true);
    };

    const closeCreateModal = () => {
        setCreateModalOpen(false);
        setEditTemplate(null);
        setNewTitle('');
        setNewSlug('');
        setNewDuration(30);
        setNewProvider('google');
        setNewType('one-on-one');
        setNewColor('#6366f1');
        setNewDesc('');
        setNewApproval('auto');
        setNewQuestions('');
    };

    const handleDuplicate = (template) => {
        const dup = {
            ...template,
            id: Date.now(),
            title: `${template.title} (Copy)`,
            slug: `${template.slug}-copy`,
            bookingsCount: 0,
            revenueAttributed: '$0'
        };
        setEventTemplates(prev => [...prev, dup]);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this event template? This cannot be undone.')) {
            setEventTemplates(prev => prev.filter(t => t.id !== id));
        }
    };

    const toggleActive = (id) => {
        setEventTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    };

    // Bulk actions
    const handleBulkActive = (activeState) => {
        setEventTemplates(prev => prev.map(t => bulkSelected.includes(t.id) ? { ...t, active: activeState } : t));
        setBulkSelected([]);
    };

    const handleBulkDelete = () => {
        if (confirm(`Delete ${bulkSelected.length} templates?`)) {
            setEventTemplates(prev => prev.filter(t => !bulkSelected.includes(t.id)));
            setBulkSelected([]);
        }
    };

    const handleGenerateSingleLink = () => {
        const token = Math.random().toString(36).substring(2, 10);
        setGeneratedSingleUrl(`http://localhost:5173/#/booking?one_time=true&token=${token}&expires_in=${singleExpiry}h`);
    };

    const handleSaveRoutingRules = (e) => {
        e.preventDefault();
        setRoutingModalOpen(false);
        alert('GTM lead routing rule set and CRM opportunities successfully synchronized!');
    };

    // Filters
    const filteredTemplates = eventTemplates.filter(t => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query);
        }
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f8fafc', fontFamily: 'var(--font-family)' }}>

            {/* Top Header Workspace Section */}
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
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sales Sandbox Workspace</span>
                        <i data-lucide="chevron-down" style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }}></i>
                    </div>

                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        style={{ background: '#f1f5f9', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', outline: 'none' }}
                    >
                        <option value="all">Displaying: All Members</option>
                        <option value="me">Rk Gokul (Me)</option>
                        <option value="sarah">Sarah Jenkins</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                    <button
                        onClick={() => { closeCreateModal(); setCreateModalOpen(true); }}
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
                        Create Event Type
                    </button>

                    <button
                        onClick={() => onNavigate('booking')}
                        style={{
                            background: '#ffffff',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <i data-lucide="external-link" style={{ width: '12px', height: '12px' }}></i>
                        Public Landing Page
                    </button>

                </div>
            </header>

            {/* Main Content Workspace Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="custom-scroll">

                {/* DCA GTM Intelligence Dashboard (Event Analytics) */}
                {showGtmIntelligence && (
                    <section style={{ background: 'linear-gradient(135deg, #1e1b4b, #311042)', color: 'white', borderRadius: '24px', padding: '1.75rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, color: '#a5b4fc' }}>GTM Booking Intelligence Engine</span>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '5px', marginBottom: '10px' }}>RevOps Revenue Performance</h2>
                            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '15px' }}>
                                Dynamic routing matches ICP matches to dedicated representatives, automatically generating CRM opportunities.
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setRoutingModalOpen(true)}
                                    style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <i data-lucide="git-merge" style={{ width: '12px', height: '12px' }}></i>
                                    Configure Routing Rules
                                </button>
                                <button
                                    onClick={() => setShowGtmIntelligence(false)}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Total Pipeline</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '5px', color: '#10b981' }}>$661,000</div>
                                <span style={{ fontSize: '0.55rem', color: '#a5b4fc' }}>From 174 bookings</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Routing Qualified</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '5px' }}>88.2%</div>
                                <span style={{ fontSize: '0.55rem', color: '#10b981' }}>ICP Target Match</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1', textTransform: 'uppercase' }}>AI Recommendations</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '5px' }}>96.1%</div>
                                <span style={{ fontSize: '0.55rem', color: '#a5b4fc' }}>Slot predictability</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Top Event Type</span>
                                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Discovery Call</div>
                                <span style={{ fontSize: '0.55rem', color: '#cbd5e1' }}>89 bookings</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Workspace Navigation Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {[
                            { id: 'event_types', label: 'Event Types', icon: 'layers' },
                            { id: 'single_use', label: 'Single-use Links', icon: 'link' },
                            { id: 'polls', label: 'Meeting Polls', icon: 'bar-chart-2' },
                            { id: 'routing_forms', label: 'Routing Forms', icon: 'git-merge' },
                            { id: 'team_events', label: 'Team Events', icon: 'users' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '12px 4px',
                                    fontSize: '0.85rem',
                                    fontWeight: activeTab === tab.id ? 800 : 600,
                                    color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <i data-lucide={tab.icon} style={{ width: '14px', height: '14px' }}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {!showGtmIntelligence && (
                        <button
                            onClick={() => setShowGtmIntelligence(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <i data-lucide="activity" style={{ width: '12px', height: '12px' }}></i>
                            Show Booking Intelligence
                        </button>
                    )}
                </div>

                {/* TAB 1: EVENT TYPES LISTING */}
                {activeTab === 'event_types' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Search & Bulk Operations Toolbar */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, maxWidth: '400px' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Search event templates..."
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
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {bulkSelected.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', padding: '4px 10px', borderRadius: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{bulkSelected.length} Selected:</span>
                                        <button onClick={() => handleBulkActive(true)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Activate</button>
                                        <button onClick={() => handleBulkActive(false)} style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Deactivate</button>
                                        <button onClick={handleBulkDelete} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                                    </div>
                                )}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Total Templates: <strong>{filteredTemplates.length}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Templates Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            {filteredTemplates.map(t => {
                                const isSelected = bulkSelected.includes(t.id);
                                return (
                                    <div key={t.id} style={{
                                        background: '#ffffff',
                                        border: `1px solid ${t.active ? 'var(--glass-border)' : 'rgba(0,0,0,0.03)'}`,
                                        borderRadius: '24px',
                                        padding: '1.5rem',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                                        opacity: t.active ? 1 : 0.65,
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}>
                                        {/* Card Top Banner */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setBulkSelected(prev => [...prev, t.id]);
                                                        } else {
                                                            setBulkSelected(prev => prev.filter(id => id !== t.id));
                                                        }
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }}></div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.title}</h3>
                                            </div>

                                            {/* Active Toggle Switch */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={t.active}
                                                        onChange={() => toggleActive(t.id)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{
                                                        width: '32px',
                                                        height: '18px',
                                                        background: t.active ? 'var(--accent-blue)' : '#cbd5e1',
                                                        borderRadius: '10px',
                                                        display: 'inline-block',
                                                        position: 'relative',
                                                        transition: 'background 0.2s'
                                                    }}>
                                                        <span style={{
                                                            width: '14px',
                                                            height: '14px',
                                                            background: '#ffffff',
                                                            borderRadius: '50%',
                                                            position: 'absolute',
                                                            top: '2px',
                                                            left: t.active ? '16px' : '2px',
                                                            transition: 'left 0.2s'
                                                        }}></span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1.25rem', height: '34px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {t.desc}
                                        </p>

                                        {/* Meta & Credentials Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', marginBottom: '1.25rem' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                Duration: <strong style={{ color: 'var(--text-primary)' }}>{t.duration} Mins</strong>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                Type: <strong style={{ color: 'var(--text-primary)' }}>{t.type}</strong>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                Pipeline: <strong style={{ color: '#10b981' }}>{t.revenueAttributed}</strong>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                Approval: <strong style={{ color: 'var(--accent-primary)' }}>{t.approvalType}</strong>
                                            </div>
                                        </div>

                                        {/* Actions footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`http://localhost:5173/#/booking?event=${t.slug}`)}
                                                    style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <i data-lucide="copy" style={{ width: '12px', height: '12px' }}></i>
                                                    Copy Link
                                                </button>
                                                <button
                                                    onClick={() => onNavigate('booking', `?event=${t.slug}`)}
                                                    style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <i data-lucide="external-link" style={{ width: '12px', height: '12px' }}></i>
                                                    Open
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => openEditTemplate(t)} style={{ background: 'none', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Settings">
                                                    <i data-lucide="edit-3" style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }}></i>
                                                </button>
                                                <button onClick={() => handleDuplicate(t)} style={{ background: 'none', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Duplicate Template">
                                                    <i data-lucide="copy" style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }}></i>
                                                </button>
                                                <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Template">
                                                    <i data-lucide="trash-2" style={{ width: '14px', height: '14px', color: '#ef4444' }}></i>
                                                </button>
                                            </div>

                                        </div>

                                    </div>
                                );
                            })}
                        </div>

                    </div>
                )}

                {/* TAB 2: SINGLE-USE LINKS GENERATOR */}
                {activeTab === 'single_use' && (
                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2.5rem', maxWidth: '600px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Create Single-use Booking URL</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Generate an ephemeral link that expires after a single meeting registration, preventing prospects from reusing or sharing private links.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Link Expiry window</label>
                                <select
                                    value={singleExpiry}
                                    onChange={(e) => setSingleExpiry(e.target.value)}
                                    style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    <option value="24">Expires in 24 Hours</option>
                                    <option value="48">Expires in 48 Hours</option>
                                    <option value="168">Expires in 7 Days</option>
                                </select>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={singleLimit}
                                    onChange={(e) => setSingleLimit(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                Limit to exactly 1 successful registration
                            </label>

                            <button
                                onClick={handleGenerateSingleLink}
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}
                            >
                                Generate Secure URL
                            </button>

                            {generatedSingleUrl && (
                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>One-Time URL Generated</span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={generatedSingleUrl}
                                            style={{ flex: 1, background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                                        />
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(generatedSingleUrl); alert('One-time URL copied!'); }}
                                            style={{ background: '#f1f5f9', border: 'none', padding: '0 15px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: MEETING POLLS */}
                {activeTab === 'polls' && (
                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', maxWidth: '650px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Meeting Polls (Participant Voting)</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Propose multiple slot options and let attendees vote on their preferred slots.</p>
                            </div>
                            <button
                                onClick={() => setPollModalOpen(true)}
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <i data-lucide="plus" style={{ width: '12px', height: '12px' }}></i>
                                Create Poll
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{pollTitle}</strong>
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>Active</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {pollSlots.map((slot, idx) => (
                                        <div key={idx} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem' }}>
                                            <span>{slot.date} at <strong>{slot.time}</strong></span>
                                            <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{slot.votes} Votes</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                    <button
                                        onClick={() => { alert('Auto-confirmed slot: 2026-06-01 at 14:00 (5 votes). Calendar invites dispatched.'); }}
                                        style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Auto-confirm Best Slot
                                    </button>
                                    <button style={{ background: '#f1f5f9', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Close Poll</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: ROUTING FORMS */}
                {activeTab === 'routing_forms' && (
                    <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', maxWidth: '650px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lead Routing Forms</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Qualify leads prior to displaying the booking calendar based on answers.</p>
                            </div>
                            <button
                                onClick={() => setRoutingModalOpen(true)}
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Edit Rules
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.25rem' }}>
                                <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '10px' }}>Current Routing Logic:</strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', justify: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Region-based Assignee:</span>
                                        <strong>Active (Sarah Jenkins EMEA / APAC Auto-assign)</strong>
                                    </div>
                                    <div style={{ display: 'flex', justify: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Company Size Qualifier:</span>
                                        <strong>Active (&gt; {routingRules.sizeLimit} employees to Enterprise AE)</strong>
                                    </div>
                                    <div style={{ display: 'flex', justify: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>CRM Synchronization:</span>
                                        <strong>Active (HubSpot Opp. Created on booking)</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: TEAM EVENTS */}
                {activeTab === 'team_events' && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                        <i data-lucide="users" style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }}></i>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Collective & Round-Robin Team Schedulers</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 1.5rem' }}>
                            Coordinate multiple representatives on the same strategy calendar. Balance SDR rotations automatically.
                        </p>
                        <button
                            onClick={() => { closeCreateModal(); setNewType('round robin'); setCreateModalOpen(true); }}
                            style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                            Configure Round-Robin Slot
                        </button>
                    </div>
                )}

            </div>

            {/* MODALS PANEL */}

            {/* Event Type Editor Drawer */}
            <EventTypeEditor isOpen={editorOpen} onClose={() => { setEditorOpen(false); setEditingEvent(null); }} eventId={editingEvent?.id} />

            {/* MODAL A: CREATE/EDIT TEMPLATE */}
            {createModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)', maxHeight: '90vh', overflowY: 'auto' }} className="custom-scroll">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {editTemplate ? 'Edit Event Template Settings' : 'Create New Strategic Event Template'}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                            Configure Calendly availability options enhanced with GTM lead qualification settings.
                        </p>

                        <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Event Title</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Product Strategy Deep Dive"
                                    required
                                    style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Slug (URL path)</label>
                                    <input
                                        type="text"
                                        value={newSlug}
                                        onChange={(e) => setNewSlug(e.target.value)}
                                        placeholder="strategy-session"
                                        required
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(e.target.value)}
                                        placeholder="30"
                                        required
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Meeting Provider</label>
                                    <select
                                        value={newProvider}
                                        onChange={(e) => setNewProvider(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="google">Google Meet</option>
                                        <option value="zoom">Zoom Video</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="open">Open (Jitsi Room)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Meeting Type</label>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="one-on-one">One-on-one</option>
                                        <option value="group">Group Call</option>
                                        <option value="round robin">Round Robin</option>
                                        <option value="collective">Collective Call</option>
                                        <option value="demo call">Product Demo Call</option>
                                        <option value="support call">Support Call</option>
                                        <option value="discovery call">Discovery Call</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Approval Workflow</label>
                                    <select
                                        value={newApproval}
                                        onChange={(e) => setNewApproval(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="auto">Auto Approve</option>
                                        <option value="manual">Manual Host Approval</option>
                                        <option value="manager">Manager Approval Escalation</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Card Color Pill</label>
                                    <select
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="#6366f1">Indigo Accent</option>
                                        <option value="#8b5cf6">Purple Accent</option>
                                        <option value="#10b981">Emerald Green</option>
                                        <option value="#f59e0b">Orange Warning</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description / Agenda</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Write details shown to clients on booking landing page..."
                                    style={{ width: '100%', minHeight: '60px', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', resize: 'none', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Custom Booking Questions (comma separated)</label>
                                <input
                                    type="text"
                                    value={newQuestions}
                                    onChange={(e) => setNewQuestions(e.target.value)}
                                    placeholder="Company size?, Cloud provider?, Industry?"
                                    style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justify: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={closeCreateModal} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                    {editTemplate ? 'Save Template Settings' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL B: GTM ROUTING CONFIG */}
            {routingModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Lead Routing & CRM Sync Rules</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Configure DCA Autonomous Routing & pipeline attributes.</p>

                        <form onSubmit={handleSaveRoutingRules} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={routingRules.regionBased}
                                    onChange={(e) => setRoutingRules(prev => ({ ...prev, regionBased: e.target.checked }))}
                                />
                                Enable Region-based SDR Assignment
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={routingRules.companySizeBased}
                                    onChange={(e) => setRoutingRules(prev => ({ ...prev, companySizeBased: e.target.checked }))}
                                />
                                Route by Company Size threshold
                            </label>

                            {routingRules.companySizeBased && (
                                <div style={{ paddingLeft: '22px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Enterprise Cutoff (Employees)</label>
                                    <input
                                        type="number"
                                        value={routingRules.sizeLimit}
                                        onChange={(e) => setRoutingRules(prev => ({ ...prev, sizeLimit: parseInt(e.target.value) }))}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                                    />
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={routingRules.syncToCrm}
                                    onChange={(e) => setRoutingRules(prev => ({ ...prev, syncToCrm: e.target.checked }))}
                                />
                                Sync Leads directly to CRM opportunities
                            </label>

                            {routingRules.syncToCrm && (
                                <div style={{ paddingLeft: '22px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CRM Target Opportunity Stage</label>
                                    <select
                                        value={routingRules.crmOpportunityStage}
                                        onChange={(e) => setRoutingRules(prev => ({ ...prev, crmOpportunityStage: e.target.value }))}
                                        style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                                    >
                                        <option value="Qualified Lead">Qualified Lead</option>
                                        <option value="Demo Scheduled">Demo Scheduled</option>
                                        <option value="BANT Analysis">BANT Analysis</option>
                                        <option value="Proposal Sent">Proposal Sent</option>
                                    </select>
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={routingRules.aiLeadScoring}
                                    onChange={(e) => setRoutingRules(prev => ({ ...prev, aiLeadScoring: e.target.checked }))}
                                />
                                Activate AI ICP Lead Scoring match
                            </label>

                            <div style={{ display: 'flex', gap: '10px', justify: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setRoutingModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Save Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL C: CREATE MEETING POLL */}
            {pollModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(9,13,22,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Create Meeting Poll</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Propose multiple slot times for selection.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Poll Title</label>
                                <input
                                    type="text"
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                    style={{ width: '100%', background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    setPollModalOpen(false);
                                    alert('Poll created! Copy link to share with prospects.');
                                }}
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Confirm & Launch Poll
                            </button>

                            <button type="button" onClick={() => setPollModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
