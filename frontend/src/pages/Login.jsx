import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
    { role: 'Admin',     email: 'admin@test.com',     password: 'admin123' },
    { role: 'Manager',   email: 'manager@test.com',   password: 'manager123' },
    { role: 'Developer', email: 'developer@test.com', password: 'dev123' },
    { role: 'Tester',    email: 'tester@test.com',    password: 'tester123' },
];

const FEATURES = [
    { icon: '⊘', label: 'Issue & Bug Tracking' },
    { icon: '⬡', label: 'Multi-Project Management' },
    { icon: '◉', label: 'Team Collaboration & Comments' },
    { icon: '◈', label: 'Real-time Analytics Dashboard' },
];

export default function Login() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const { login, error, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await login(credentials);
        if (ok) navigate('/dashboard');
    };

    const fillDemo = (acc) => {
        setCredentials({ email: acc.email, password: acc.password });
    };

    return (
        <div className="auth-page" data-testid="login-container">
            {/* Left brand panel */}
            <div className="auth-brand">
                <div className="auth-brand-content">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">🎯</div>
                        <span className="auth-logo-text">TrackIt</span>
                    </div>

                    <h1 className="auth-tagline">
                        Ship software<br />
                        <span>faster & smarter</span>
                    </h1>
                    <p className="auth-desc">
                        The complete issue tracking &amp; project management platform built for modern engineering teams.
                    </p>

                    <div className="auth-features">
                        {FEATURES.map(f => (
                            <div key={f.label} className="auth-feature">
                                <div className="auth-feature-icon">{f.icon}</div>
                                <span>{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        TrackIt Pro · v2.0 · MERN Stack
                    </p>
                </div>
            </div>

            {/* Right form panel */}
            <div className="auth-form-side" data-testid="login-card">
                <div className="auth-form-wrap">
                    <h2 className="auth-form-title" data-testid="login-title">Welcome back</h2>
                    <p className="auth-form-sub" data-testid="login-subtitle">Sign in to your TrackIt workspace</p>

                    <form onSubmit={handleSubmit} data-testid="login-form" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                placeholder="you@company.com"
                                required
                                value={credentials.email}
                                onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                data-testid="email-input"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="••••••••"
                                    required
                                    value={credentials.password}
                                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                    data-testid="password-input"
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                        fontSize: '.85rem', padding: 4,
                                    }}
                                >
                                    {showPass ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-alert mb-16" data-testid="login-error">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                            data-testid="login-btn"
                            style={{ width: '100%', padding: '13px', fontSize: '1rem', marginTop: 8 }}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                                    Signing in...
                                </>
                            ) : (
                                '→ Sign In'
                            )}
                        </button>
                    </form>

                    <div className="demo-accounts mt-24" data-testid="demo-accounts-info">
                        <div className="demo-accounts-title">Quick Access — Demo Accounts</div>
                        <div className="demo-btns">
                            {DEMO_ACCOUNTS.map(acc => (
                                <button
                                    key={acc.role}
                                    className="demo-btn"
                                    onClick={() => fillDemo(acc)}
                                    type="button"
                                >
                                    <span className="demo-btn-role">{acc.role}</span>
                                    <span className="demo-btn-email">{acc.email}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
