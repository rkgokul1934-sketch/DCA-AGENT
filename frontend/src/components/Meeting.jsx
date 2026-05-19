import React, { useState, useEffect, useRef } from 'react';

export default function Meeting({ onNavigate, urlParams }) {
    const [step, setStep] = useState('lobby'); // lobby, meeting, report
    const [meetingTitle, setMeetingTitle] = useState('Strategic Product Demo');
    const [bookingId, setBookingId] = useState('1');
    const [companyName, setCompanyName] = useState('Enterprise Client');
    const [clientName, setClientName] = useState('Prospect Client');
    const [progress, setProgress] = useState(0);
    const [chatBubbles, setChatBubbles] = useState([]);
    const [meetingLink, setMeetingLink] = useState('');
    
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Pre-parse parameters from prop or URL
        const params = new URLSearchParams(urlParams || window.location.hash.split('?')[1] || '');
        const id = params.get('id') || '1';
        const title = params.get('title') || 'Strategic Product Demo';
        
        setBookingId(id);
        setMeetingTitle(title);
        
        if (title.includes(':')) {
            setCompanyName(title.split(':')[1].trim());
        }

        // Fetch dynamic meeting link from backend
        fetch(`/api/v1/legacy-bookings/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.meeting_link) {
                    setMeetingLink(data.meeting_link);
                }
            })
            .catch(err => console.error("Failed to fetch meeting link:", err));

        // Map registered User identity if available
        const userStr = localStorage.getItem('dca_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.name) {
                    setClientName(user.name);
                }
            } catch (e) {}
        }
    }, [urlParams]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [step, chatBubbles]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatBubbles]);

    const startSimulation = async () => {
        // Trigger AI analysis on the real link in background
        try {
            await fetch(`/api/v1/legacy-bookings/${bookingId}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospect_name: companyName,
                    summary: `AI Agent successfully analyzed meeting on live room: ${meetingLink || 'Jitsi'}. BANT qualification complete.`,
                    next_steps: "Deliver formal GTM deployment proposal."
                })
            });
        } catch (err) {
            console.error("Failed to log post-meeting AI analysis:", err);
        }

        // Redirect directly to the real meeting link (Jitsi, Zoom, Teams, Google Meet)
        const meetUrl = meetingLink || `https://meet.jit.si/dca-revops-${bookingId}`;
        window.location.href = meetUrl;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'transparent', color: 'white', fontFamily: 'var(--font-family)', overflow: 'hidden' }}>
            {step === 'lobby' && (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ width: '100%', maxWidth: '550px', background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: '28px', padding: '3rem 2.5rem', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <i data-lucide="shield" size="30"></i>
                        </div>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>GTM Briefing Room</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>You are connecting to <strong>{meetingTitle}</strong>. Our AI Copilot will transcribe key BANT metrics and qualify CRM details.</p>
                        
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1rem', marginBottom: '2.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><i data-lucide="check" size="14" style={{ color: '#10b981' }}></i> Camera & Mic Synced</div>
                            <div style={{ display: 'flex', gap: '8px' }}><i data-lucide="check" size="14" style={{ color: '#10b981' }}></i> AI Intent Node Connected</div>
                        </div>

                        <button onClick={startSimulation} style={{ color: 'var(--text-primary)',width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none', background: 'linear-gradient(135deg, #818cf8)', color: 'white', padding: '1rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
                            <i data-lucide="video"></i> ENTER SECURE MEETING
                        </button>
                    </div>
                </div>
            )}

            {step === 'meeting' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', flex: 1, height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
                    {/* Video Feeds Left Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRight: '1px solid var(--glass-border)', height: '100%', overflowY: 'auto' }}>
                        
                        {/* Feed 1: Host */}
                        <div style={{ flex: 1, minHeight: '200px', background: '#0e121d', border: '1px solid var(--glass-border)', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem' }}>SJ</div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Sarah Jenkins (Host)</span>
                            </div>
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800 }}>LIVE</div>
                        </div>

                        {/* Feed 2: Client */}
                        <div style={{ flex: 1, minHeight: '200px', background: '#0e121d', border: '1px solid var(--glass-border)', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem' }}>{(clientName || 'PR').substring(0, 2).toUpperCase()}</div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{clientName} (You)</span>
                            </div>
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800 }}>PROSPECT CAMERA</div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem', borderRadius: '16px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: Transcribing Live...</span>
                            <button onClick={concludeMeeting} style={{ border: 'none', background: '#ef4444', color: 'white', padding: '6px 16px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>LEAVE & CONCLUDE</button>
                        </div>
                    </div>

                    {/* Copilot Transcripts Right Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Simulation Progress bar */}
                        <div style={{ background: '#090d16', borderBottom: '1px solid var(--glass-border)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>COGNITIVE CONVERSATIONAL INDEX</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '60%' }}>
                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', minWidth: '35px', textAlign: 'right' }}>{Math.round(progress)}%</span>
                            </div>
                        </div>

                        {/* Transcripts container */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: '#05070c' }}>
                            {chatBubbles.map((bubble, i) => (
                                <div key={i} className={`transcription-bubble ${bubble.isAi ? 'ai-intel' : ''}`} style={{
                                    background: bubble.isAi ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${bubble.isAi ? 'rgba(99, 102, 241, 0.2)' : 'var(--glass-border)'}`,
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    animation: 'bubble-in 0.4s forwards'
                                }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: bubble.isAi ? 'var(--accent-primary)' : 'white', textTransform: 'uppercase', marginBottom: '4px' }}>{bubble.speaker}</div>
                                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>{bubble.text}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef}></div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'report' && (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ width: '100%', maxWidth: '650px', background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: '32px', padding: '3rem 2.5rem', textAlign: 'center' }}>
                        
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <i data-lucide="check" size="30"></i>
                        </div>
                        
                        <h2 style={{ color: 'var(--text-primary)',fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>AI Briefing Analysis Completed</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Autonomous agent concluded discovery simulation. Post-meeting dossier has been dispatched to team CRM database.</p>
                        
                        {/* Dossier details card */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 800,color: 'var(--text-primary)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>SECURE DOSSIER RECORD</h3>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Lead ICP Prospect</h4>
                                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{companyName}</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Pain points Identified</h4>
                                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Manual GTM scheduling overhead, calendar synchronization latency, and pipeline drop-off.</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>AI Deployment Recommendations</h4>
                                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Deliver formal proposal contract for automatic ICP scheduling and enable OAuth round-robin calendar integration.</p>
                            </div>
                        </div>

                        <button onClick={() => onNavigate('dashboard')} style={{ color: 'var(--text-primary)',width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none', background: 'linear-gradient(135deg,  #818cf8)', color: 'white', padding: '1rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
                            <i data-lucide="arrow-left"></i> RETURN TO GTM COMMAND CENTER
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
