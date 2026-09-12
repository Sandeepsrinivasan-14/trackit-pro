import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import Navbar from '../components/Navbar';

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

const ROLE_COLORS = {
    admin: 'hsl(350,85%,62%)', manager: 'hsl(38,92%,55%)',
    developer: 'hsl(232,90%,68%)', tester: 'hsl(280,85%,65%)',
};

export default function Profile() {
    const { user } = useAuth();
    const toast = useToast();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statsBy, setStatsBy] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });

    const fetchUserIssues = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await API.get('/issues');
            const all = res.data.data || [];
            let mine = [];
            if (user.role === 'developer') {
                mine = all.filter(i => i.assignedTo?.userId === user.userId);
            } else {
                mine = all.filter(i => i.reportedBy?.userId === user.userId);
            }
            setIssues(mine);
            setStatsBy({
                open:       mine.filter(i => i.status === 'open').length,
                inProgress: mine.filter(i => ['in-progress', 'testing'].includes(i.status)).length,
                resolved:   mine.filter(i => i.status === 'resolved').length,
                closed:     mine.filter(i => i.status === 'closed').length,
            });
        } catch {
            toast.error('Failed to fetch user activity.');
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchUserIssues(); }, [fetchUserIssues]);

    const roleColor = ROLE_COLORS[user?.role] || 'var(--primary)';
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'N/A';

    return (
        <div className="app-layout" data-testid="profile-layout">
            <Navbar />
            <div className="container" data-testid="profile-container">

                {/* Hero */}
                <div className="profile-hero" data-testid="profile-header">
                    <div className="profile-avatar-lg" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)` }}>
                        {getInitials(user?.name)}
                    </div>
                    <div className="profile-hero-info" data-testid="profile-details-card">
                        <div className="profile-hero-name" data-testid="profile-name">{user?.name}</div>
                        <div className="profile-hero-email" data-testid="profile-email">{user?.email}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${user?.role}`} data-testid="profile-role">{user?.role?.toUpperCase()}</span>
                            <span style={{ fontSize: '.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                📅 Member since {memberSince}
                            </span>
                            <span className="user-id" data-testid="profile-userid">{user?.userId}</span>
                        </div>
                    </div>
                    <div className="profile-stats">
                        <div className="profile-stat">
                            <div className="profile-stat-num">{issues.length}</div>
                            <div className="profile-stat-label">Total</div>
                        </div>
                        <div className="profile-stat">
                            <div className="profile-stat-num" style={{ color: 'var(--warning)' }}>{statsBy.open + statsBy.inProgress}</div>
                            <div className="profile-stat-label">Active</div>
                        </div>
                        <div className="profile-stat">
                            <div className="profile-stat-num" style={{ color: 'var(--success)' }}>{statsBy.resolved + statsBy.closed}</div>
                            <div className="profile-stat-label">Done</div>
                        </div>
                    </div>
                </div>

                {/* Info + Issues grid */}
                <div className="grid-2" data-testid="profile-grid">
                    {/* Account info */}
                    <div className="card">
                        <div className="card-title">👤 Account Information</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { label: 'Full Name',   value: user?.name,       testid: 'profile-name-info' },
                                { label: 'Email',       value: user?.email,      testid: 'profile-email-info' },
                                { label: 'User ID',     value: user?.userId,     mono: true },
                                { label: 'Role',        value: user?.role,       badge: true },
                                { label: 'Department',  value: user?.department || 'Engineering' },
                                { label: 'Member Since', value: memberSince },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{row.label}</span>
                                    {row.badge ? (
                                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                                    ) : (
                                        <span style={{ fontWeight: 500, fontSize: '.9rem', fontFamily: row.mono ? 'monospace' : undefined, color: row.mono ? 'var(--primary)' : 'var(--text-primary)' }}>
                                            {row.value || '—'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mini activity bars */}
                        <div style={{ marginTop: 20 }}>
                            <div className="section-title" style={{ marginBottom: 14 }}>Issue Breakdown</div>
                            <div className="progress-bar-wrap">
                                {[
                                    { label: 'Open',        val: statsBy.open,       color: 'var(--info)' },
                                    { label: 'In Progress', val: statsBy.inProgress, color: 'var(--warning)' },
                                    { label: 'Resolved',    val: statsBy.resolved,   color: 'var(--success)' },
                                    { label: 'Closed',      val: statsBy.closed,     color: 'hsl(148,55%,35%)' },
                                ].map(b => (
                                    <div key={b.label} className="progress-item">
                                        <div className="progress-header">
                                            <span>{b.label}</span>
                                            <span style={{ color: b.color }}>{b.val}</span>
                                        </div>
                                        <div className="progress-track">
                                            <div className="progress-fill" style={{
                                                width: `${issues.length > 0 ? (b.val / issues.length) * 100 : 0}%`,
                                                background: b.color
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Issues table */}
                    <div className="card" data-testid="profile-tickets-card">
                        <div className="card-title" data-testid="profile-tickets-title">
                            {user?.role === 'developer' ? '⊘ Assigned to Me' : '⊘ Reported by Me'}
                            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{issues.length} issues</span>
                        </div>

                        {loading ? (
                            <div className="loading-wrap"><div className="loading-spinner"></div></div>
                        ) : issues.length === 0 ? (
                            <div className="empty-state" style={{ padding: '24px 0' }} data-testid="profile-no-tickets">
                                <div className="empty-state-icon">✨</div>
                                <div className="empty-state-desc">No issues linked to your account.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}
                                data-testid="profile-table-container">
                                {issues.map(issue => (
                                    <div key={issue._id} style={{
                                        padding: '10px 14px', background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    }} data-testid={`profile-issue-row-${issue.issueId}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <div>
                                                <span className="mono" style={{ fontSize: '.7rem', color: 'var(--primary)' }}
                                                    data-testid={`profile-issue-id-${issue.issueId}`}>{issue.issueId}</span>
                                                <div style={{ fontWeight: 500, fontSize: '.88rem', marginTop: 2 }}
                                                    data-testid={`profile-issue-title-${issue.issueId}`}>{issue.title}</div>
                                            </div>
                                            <span className={`badge badge-${issue.status}`}
                                                data-testid={`profile-issue-status-${issue.issueId}`}>{issue.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>⬡ {issue.project?.title || 'Unknown'}</span>
                                            <span className={`badge badge-${issue.priority}`}
                                                data-testid={`profile-issue-priority-${issue.issueId}`}>{issue.priority}</span>
                                            <span className={`badge badge-${issue.severity}`}
                                                data-testid={`profile-issue-severity-${issue.issueId}`}>{issue.severity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
