import React, { useState, useEffect } from 'react';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import Booking from './components/Booking.jsx';
import Meeting from './components/Meeting.jsx';
import Availability from './components/Availability.jsx';
import Contacts from './components/Contacts.jsx';
import Meetings from './components/Meetings.jsx';
import Scheduling from './components/Scheduling.jsx';
import Analytics from './components/Analytics.jsx';

export default function App() {
    const [currentRoute, setCurrentRoute] = useState('auth');
    const [urlParams, setUrlParams] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState({ name: 'Admin Console', email: 'admin@dca.ai' });

    // Dynamic routing trigger
    const parseHashRoute = () => {
        const hash = window.location.hash || '#/auth';
        const [routePart, queryPart] = hash.split('?');

        const token = localStorage.getItem('dca_token');
        if (!token) {
            setCurrentRoute('auth');
            setAuthenticated(false);
            window.location.hash = '#/auth';
            return;
        }

        setAuthenticated(true);
        setUrlParams(queryPart || '');

        // Fetch logged in profile details
        const userStr = localStorage.getItem('dca_user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) { }
        }

        switch (routePart) {
            case '#/auth':
                // Authenticated users automatically bypass login to Dashboard
                setCurrentRoute('dashboard');
                window.location.hash = '#/dashboard';
                break;
            case '#/dashboard':
                setCurrentRoute('dashboard');
                break;
            case '#/booking':
                setCurrentRoute('booking');
                break;
            case '#/scheduling':
                setCurrentRoute('scheduling');
                break;
            case '#/admin_center':
                setCurrentRoute('admin_center');
                break;
            case '#/meetings':
                setCurrentRoute('meetings');
                break;
            case '#/availability':
                setCurrentRoute('availability');
                break;
            case '#/contacts':
                setCurrentRoute('contacts');
                break;
            case '#/workflows':
                setCurrentRoute('workflows');
                break;
            case '#/reports':
                setCurrentRoute('reports');
                break;
            case '#/integrations':
                setCurrentRoute('integrations');
                break;
            case '#/routing':
                setCurrentRoute('routing');
                break;
            case '#/analytics':
                setCurrentRoute('analytics');
                break;
            case '#/help':
                setCurrentRoute('help');
                break;
            case '#/meeting':
                setCurrentRoute('meeting');
                break;
            default:
                setCurrentRoute('dashboard');
                window.location.hash = '#/dashboard';
                break;
        }
    };

    useEffect(() => {
        // Run once on load
        parseHashRoute();

        // Listen for browser history actions (back/forward or program changes)
        window.addEventListener('hashchange', parseHashRoute);
        return () => window.removeEventListener('hashchange', parseHashRoute);
    }, []);

    // Rerender Lucide icons globally on tab transition
    useEffect(() => {
        if (window.lucide && authenticated) {
            window.lucide.createIcons();
        }
    }, [authenticated, currentRoute, user]);

    const handleNavigate = (page, query = '') => {
        window.location.hash = `#/${page}${query}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('dca_token');
        localStorage.removeItem('dca_user');
        setAuthenticated(false);
        setCurrentRoute('auth');
        window.location.hash = '#/auth';
    };

    const handleLoginSuccess = () => {
        parseHashRoute();
    };



    // Render fullscreen Login/Register View
    if (currentRoute === 'auth') {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    // Render fullscreen simulated courtroom meeting for immersion
    if (currentRoute === 'meeting') {
        return <Meeting onNavigate={handleNavigate} urlParams={urlParams} />;
    }

    // Generate Initials Avatar
    const getInitials = (fullName) => {
        if (!fullName) return 'DC';
        const parts = fullName.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

            {/* Left Pristine White Sidebar */}
            <aside style={{
                width: '260px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(30px)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                zIndex: 100
            }}>
                <div>
                    {/* Brand Header */}
                    <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ background: 'rgba(99,102,241,0.08)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i data-lucide="zap" style={{ color: 'var(--accent-blue)', width: '18px', height: '18px' }}></i>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>DCA <span style={{ color: 'var(--accent-blue)' }}>REVOPS</span></span>
                    </div>

                    {/* Navigation Menu */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '1.2rem 1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }} className="custom-scroll">

                        {/* 1. DASHBOARD */}
                        <button
                            onClick={() => handleNavigate('dashboard')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'dashboard' ? '800' : '600',
                                color: currentRoute === 'dashboard' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'dashboard' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'dashboard' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="layout-dashboard" style={{ width: '16px', height: '16px' }}></i>
                            Dashboard
                        </button>

                        {/* 2. SCHEDULING */}
                        <button
                            onClick={() => handleNavigate('scheduling')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'scheduling' ? '800' : '600',
                                color: currentRoute === 'scheduling' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'scheduling' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'scheduling' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="calendar" style={{ width: '16px', height: '16px' }}></i>
                            Scheduling
                        </button>

                        {/* 3. MEETINGS */}
                        <button
                            onClick={() => handleNavigate('meetings')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'meetings' ? '800' : '600',
                                color: currentRoute === 'meetings' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'meetings' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'meetings' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="video" style={{ width: '16px', height: '16px' }}></i>
                            Meetings
                        </button>

                        {/* 4. AVAILABILITY */}
                        <button
                            onClick={() => handleNavigate('availability')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'availability' ? '800' : '600',
                                color: currentRoute === 'availability' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'availability' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'availability' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="clock" style={{ width: '16px', height: '16px' }}></i>
                            Availability
                        </button>

                        {/* 5. CONTACTS */}
                        <button
                            onClick={() => handleNavigate('contacts')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'contacts' ? '800' : '600',
                                color: currentRoute === 'contacts' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'contacts' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'contacts' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="users" style={{ width: '16px', height: '16px' }}></i>
                            Contacts
                        </button>

                        {/* 6. WORKFLOWS */}
                        {/* <button
                            onClick={() => handleNavigate('workflows')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'workflows' ? '800' : '600',
                                color: currentRoute === 'workflows' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'workflows' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'workflows' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="git-branch" style={{ width: '16px', height: '16px' }}></i>
                            Workflows
                        </button> */}

                        {/* 7. ROUTING */}
                        {/* <button
                            onClick={() => handleNavigate('routing')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'routing' ? '800' : '600',
                                color: currentRoute === 'routing' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'routing' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'routing' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="shuffle" style={{ width: '16px', height: '16px' }}></i>
                            Routing
                        </button> */}

                        {/* 8. INTEGRATIONS */}
                        {/* <button
                            onClick={() => handleNavigate('integrations')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'integrations' ? '800' : '600',
                                color: currentRoute === 'integrations' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'integrations' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'integrations' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="puzzle" style={{ width: '16px', height: '16px' }}></i>
                            Integrations
                        </button> */}

                        {/* 9. ANALYTICS */}
                        <button
                            onClick={() => handleNavigate('analytics')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'analytics' ? '800' : '600',
                                color: currentRoute === 'analytics' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'analytics' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'analytics' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="pie-chart" style={{ width: '16px', height: '16px' }}></i>
                            Analytics
                        </button>

                        {/* 10. ADMIN CENTER */}
                        {/* <button
                            onClick={() => handleNavigate('admin_center')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'admin_center' ? '800' : '600',
                                color: currentRoute === 'admin_center' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'admin_center' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'admin_center' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="shield" style={{ width: '16px', height: '16px' }}></i>
                            Admin Center
                        </button> */}

                        {/* 11. HELP */}
                        <button
                            onClick={() => handleNavigate('help')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: currentRoute === 'help' ? '800' : '600',
                                color: currentRoute === 'help' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                background: currentRoute === 'help' ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderLeft: currentRoute === 'help' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i data-lucide="help-circle" style={{ width: '16px', height: '16px' }}></i>
                            Help
                        </button>

                    </nav>
                </div>

                {/* Sidebar Footer User Details Card */}
                <div style={{ padding: '1.2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            {/* Avatar initials mark */}
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, var(--accent-blue), #818cf8)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                flexShrink: 0
                            }}>
                                {getInitials(user.name)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {user.name || 'Admin'}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {user.email || 'admin@dca.ai'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            style={{
                                border: 'none',
                                background: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                color: '#ef4444',
                                opacity: 0.8,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            <i data-lucide="log-out" style={{ width: '14px', height: '14px' }}></i>
                        </button>
                    </div>
                </div>

            </aside>

            {/* Right Side Main Viewport Shell */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', position: 'relative' }}>
                {currentRoute === 'dashboard' && <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} />}
                {currentRoute === 'booking' && <Booking onNavigate={handleNavigate} urlParams={urlParams} />}
                {currentRoute === 'scheduling' && <Scheduling onNavigate={handleNavigate} />}
                {currentRoute === 'availability' && <Availability />}
                {currentRoute === 'contacts' && <Contacts />}
                {currentRoute === 'meetings' && <Meetings onNavigate={handleNavigate} />}
                {currentRoute === 'analytics' && <Analytics />}
                {['workflows', 'integrations', 'routing', 'help', 'admin_center'].includes(currentRoute) && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
                        <div style={{ textAlign: 'center', maxWidth: '400px', background: '#ffffff', padding: '3rem', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ background: 'rgba(99,102,241,0.06)', color: 'var(--accent-blue)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <i data-lucide={
                                    currentRoute === 'workflows' ? 'git-branch' :
                                        currentRoute === 'integrations' ? 'puzzle' :
                                            currentRoute === 'routing' ? 'shuffle' :
                                                currentRoute === 'analytics' ? 'pie-chart' :
                                                    currentRoute === 'admin_center' ? 'shield' : 'help-circle'
                                } style={{ width: '24px', height: '24px' }}></i>
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'capitalize', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                                {currentRoute === 'admin_center' ? 'Admin Center' : currentRoute} Module
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                The enterprise {currentRoute === 'admin_center' ? 'Admin Center' : currentRoute} orchestration node is currently operational. GTM integrations and automated hooks are active in the background.
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
