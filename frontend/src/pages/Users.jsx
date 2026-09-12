import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

const ROLE_COLORS = {
    admin:     'hsl(350,85%,62%)',
    manager:   'hsl(38,92%,55%)',
    developer: 'hsl(232,90%,68%)',
    tester:    'hsl(280,85%,65%)',
};

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Users() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/users');
            const data = res.data.data || [];
            setUsers(data);
            if (window.appState) window.appState.users = data;
        } catch {
            toast.error('Failed to fetch team members.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filtered = users.filter(u =>
        (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
        (!roleFilter || u.role === roleFilter)
    );

    const roleCounts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="app-layout" data-testid="users-layout">
            <Navbar />
            <div className="container" data-testid="users-container">

                <div className="page-header" data-testid="users-header">
                    <div>
                        <h1 data-testid="users-title"><span className="gradient-text">Team Directory</span></h1>
                        <p className="page-header-sub" data-testid="users-subtitle">
                            {users.length} member{users.length !== 1 ? 's' : ''} in the organization
                        </p>
                    </div>
                </div>

                {/* Role summary chips */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {Object.entries(roleCounts).map(([role, count]) => (
                        <div key={role} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)', padding: '6px 14px',
                            fontSize: '.82rem',
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ROLE_COLORS[role] || 'var(--primary)' }}></div>
                            <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{role}s</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="filter-toolbar">
                    <div className="search-bar">
                        <span className="search-icon">⌕</span>
                        <input placeholder="Search by name or email..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>Role</label>
                        <select className="filter-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="developer">Developer</option>
                            <option value="tester">Tester</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="users-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: 140, borderRadius: 14 }}></div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state" data-testid="no-users-message">
                        <div className="empty-state-icon">◎</div>
                        <div className="empty-state-title">No members found</div>
                        <div className="empty-state-desc">Try a different filter or search term.</div>
                    </div>
                ) : (
                    <div className="users-grid" data-testid="users-grid">
                        {filtered.map((u, idx) => {
                            const color = ROLE_COLORS[u.role] || 'var(--primary)';
                            return (
                                <div key={u._id} className="user-card"
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                    data-testid={`user-card-${u.userId}`}>
                                    <div className="user-card-header">
                                        <div className="user-avatar"
                                            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                                            {getInitials(u.name)}
                                        </div>
                                        <div className="user-card-info">
                                            <div className="user-card-name" data-testid={`user-name-${u.userId}`}>{u.name}</div>
                                            <div className="user-card-email" data-testid={`user-email-${u.userId}`}>{u.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                                            {u.department || 'Engineering'}
                                        </span>
                                    </div>
                                    <div className="user-card-footer">
                                        <span className={`badge badge-${u.role}`} data-testid={`user-role-${u.userId}`}>
                                            {u.role}
                                        </span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span className={`badge badge-${u.status === 'inactive' ? 'inactive' : 'active'}`}
                                                data-testid={`user-status-${u.userId}`}>
                                                {u.status || 'active'}
                                            </span>
                                            <span className="user-id" data-testid={`user-id-${u.userId}`}>{u.userId}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
