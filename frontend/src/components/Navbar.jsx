import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
    { to: '/dashboard', label: 'Dashboard', icon: '◈' },
    { to: '/projects',  label: 'Projects',  icon: '⬡' },
    { to: '/issues',    label: 'Issues',    icon: '⊘' },
    { to: '/users',     label: 'Team',      icon: '◎' },
    { to: '/comments',  label: 'Discussions', icon: '◉' },
];

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [dropOpen, setDropOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setDropOpen(false);
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar" data-testid="navbar">
            <Link to="/dashboard" className="navbar-brand" data-testid="nav-brand">
                <div className="navbar-logo">🎯</div>
                <span className="navbar-brand-text">TrackIt</span>
            </Link>

            <div className="navbar-menu" data-testid="navbar-menu">
                {NAV_LINKS.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
                        data-testid={`${link.label.toLowerCase()}-link`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="navbar-right" ref={dropRef}>
                <button
                    className="navbar-icon-btn"
                    title="Notifications"
                    onClick={() => { setNotifOpen(o => !o); setDropOpen(false); }}
                >
                    🔔
                    <span className="notif-dot"></span>
                </button>

                <div className="profile-dropdown">
                    <div
                        className="nav-avatar"
                        role="button"
                        tabIndex={0}
                        onClick={() => { setDropOpen(o => !o); setNotifOpen(false); }}
                        onKeyDown={e => e.key === 'Enter' && setDropOpen(o => !o)}
                        data-testid="nav-link-profile"
                        title={user?.name}
                    >
                        {getInitials(user?.name)}
                    </div>

                    {dropOpen && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-user-info">
                                <div className="dropdown-user-name" data-testid="profile-name-display">{user?.name}</div>
                                <div className="dropdown-user-role">
                                    <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                                </div>
                            </div>
                            <Link
                                to="/profile"
                                className="dropdown-item"
                                onClick={() => setDropOpen(false)}
                                data-testid="profile-link"
                            >
                                👤 My Profile
                            </Link>
                            <Link
                                to="/dashboard"
                                className="dropdown-item"
                                onClick={() => setDropOpen(false)}
                            >
                                ◈ Dashboard
                            </Link>
                            <button
                                className="dropdown-item danger"
                                onClick={handleLogout}
                                data-testid="logout-btn"
                            >
                                ⏏ Sign Out
                            </button>
                        </div>
                    )}

                    {notifOpen && (
                        <div className="profile-dropdown-menu" style={{ minWidth: 280 }}>
                            <div className="dropdown-user-info">
                                <div className="dropdown-user-name">Notifications</div>
                            </div>
                            <div style={{ padding: '8px 0' }}>
                                {[
                                    { icon: '⊘', text: 'New issue assigned to you', time: '2m ago', color: 'var(--primary)' },
                                    { icon: '✓', text: 'Issue ISS-1001 resolved', time: '1h ago', color: 'var(--success)' },
                                    { icon: '◉', text: 'New comment on your issue', time: '3h ago', color: 'var(--accent)' },
                                ].map((n, i) => (
                                    <div key={i} className="dropdown-item" style={{ gap: 10 }}>
                                        <span style={{ color: n.color, fontSize: '1rem' }}>{n.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '.82rem', color: 'var(--text-primary)' }}>{n.text}</div>
                                            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{n.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
