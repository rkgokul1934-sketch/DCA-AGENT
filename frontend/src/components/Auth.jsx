import React, { useState, useEffect } from 'react';

export default function Auth({ onLoginSuccess }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [mode, alert]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setAlert({ show: false, message: '', type: '' });

        try {
            if (mode === 'login') {
                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Authentication failed');
                }

                localStorage.setItem('dca_token', data.access_token);
                
                const username = email.split('@')[0];
                const friendlyName = username.charAt(0).toUpperCase() + username.slice(1);
                const userProfile = {
                    name: friendlyName,
                    email: email,
                    role: 'admin'
                };
                localStorage.setItem('dca_user', JSON.stringify(userProfile));

                setAlert({ show: true, message: 'Access authorized. Accessing Cockpit...', type: 'success' });
                setTimeout(() => {
                    onLoginSuccess();
                }, 1200);

            } else {
                const response = await fetch('/api/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Registration failed');
                }

                setAlert({ show: true, message: 'Account created successfully! Signing in...', type: 'success' });
                
                setTimeout(async () => {
                    try {
                        const loginResponse = await fetch('/api/v1/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });
                        const loginData = await loginResponse.json();
                        if (loginResponse.ok) {
                            localStorage.setItem('dca_token', loginData.access_token);
                            localStorage.setItem('dca_user', JSON.stringify({
                                id: data.id,
                                name: data.name,
                                email: data.email,
                                role: data.role
                            }));
                            onLoginSuccess();
                        }
                    } catch (err) {
                        setMode('login');
                        setAlert({ show: true, message: 'Registration complete. Please sign in.', type: 'success' });
                    }
                }, 1500);
            }
        } catch (error) {
            setAlert({ show: true, message: error.message, type: 'error' });
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            position: 'relative'
        }}>
            <div className="auth-card" style={{
                width: '100%',
                maxWidth: '450px',
                background: 'var(--panel-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '28px',
                boxShadow: 'var(--card-shadow), 0 0 40px rgba(99, 102, 241, 0.1)',
                overflow: 'hidden'
            }}>
                <div className="auth-header" style={{
                    textAlign: 'center',
                    padding: '2.5rem 2rem 1.5rem 2rem',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    <div className="auth-logo" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        marginBottom: '0.5rem'
                    }}>
                        <div className="logo-mark" style={{ width: '28px', height: '28px', background: 'var(--accent-blue)', borderRadius: '8px', boxShadow: '0 0 10px var(--accent-glow)' }}></div>
                        <span>DCA <span className="accent-text">PORTAL</span></span>
                    </div>
                    <div className="auth-subtitle" style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>Revenue Intelligence Gateway</div>
                </div>

                <div className="auth-tabs" style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'rgba(0, 0, 0, 0.01)'
                }}>
                    <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>LOGIN</button>
                    <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>REGISTER</button>
                </div>

                <div className="auth-body" style={{ padding: '2.5rem 2rem' }}>
                    {alert.show && (
                        <div className={`auth-banner ${alert.type}`}>
                            <i data-lucide={alert.type === 'success' ? 'check-circle' : 'alert-circle'} style={{ width: '16px', height: '16px' }}></i>
                            <span>{alert.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="John Doe" 
                                        required 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <i data-lucide="user"></i>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="name@company.com" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <i data-lucide="mail"></i>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    placeholder="••••••••" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i data-lucide="lock"></i>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Role</label>
                                <div className="input-wrapper">
                                    <select 
                                        className="form-control" 
                                        style={{ appearance: 'none', paddingRight: '2.5rem' }}
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="user">Standard User</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                    <i data-lucide="shield"></i>
                                    <i data-lucide="chevron-down" style={{ left: 'auto', right: '1.2rem' }}></i>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-submit">
                            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                            <i data-lucide={mode === 'login' ? 'arrow-right' : 'user-plus'} style={{ width: '16px', height: '16px' }}></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
