import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import Navbar from '../components/Navbar';
import DonutChart from '../components/DonutChart';

const ACTION_ICONS = {
    CREATE_PROJECT: '⬡',
    CREATE_ISSUE: '⊘',
    UPDATE_STATUS: '↻',
    ASSIGN_ISSUE: '→',
    ADD_COMMENT: '◉',
    LOGIN_USER: '◈',
    REGISTER_USER: '✦',
    DELETE_COMMENT: '✕',
};

function StatCard({ label, value, icon, color, trend }) {
    return (
        <div className={`stat-card stat-${color}`}>
            <div className={`stat-card-glow`} style={{ background: 'currentColor' }}></div>
            <div className="stat-card-stripe"></div>
            <div className="stat-icon-wrap">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value ?? '—'}</div>
            {trend && <div className="stat-trend">{trend}</div>}
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const toast = useToast();
    const [analytics, setAnalytics] = useState(null);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [syncLoading, setSyncLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, issuesRes] = await Promise.all([
                API.get('/analytics/dashboard'),
                API.get('/issues'),
            ]);

            if (analyticsRes.data.success) {
                setAnalytics(analyticsRes.data.data);
                if (window.appState) window.appState.analytics = analyticsRes.data.data;
            }

            const issues = issuesRes.data.data || [];
            let filtered = [];
            if (user?.role === 'developer') {
                filtered = issues.filter(i =>
                    i.assignedTo?.userId === user.userId &&
                    ['open', 'in-progress', 'testing'].includes(i.status)
                );
            } else if (user?.role === 'tester') {
                filtered = issues.filter(i =>
                    i.reportedBy?.userId === user.userId && i.status !== 'closed'
                );
            } else {
                filtered = issues.filter(i =>
                    !i.assignedTo || ['open', 'in-progress'].includes(i.status)
                );
            }
            setPendingTasks(filtered.slice(0, 6));
        } catch {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user, fetchDashboardData]);

    const handleSync = async () => {
        setSyncLoading(true);
        try {
            const res = await API.post('/sync');
            if (res.data.success) {
                toast.success(`Synced ${res.data.data?.inserted ?? 0} new records`, 'Database Synced');
                fetchDashboardData();
            } else {
                toast.error(res.data.message || 'Sync failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sync failed.');
        } finally {
            setSyncLoading(false);
        }
    };

    const getCount = (arr, id) => (arr?.find(s => s._id === id)?.count) || 0;

    const openCount     = getCount(analytics?.statusStats, 'open');
    const inProgCount   = getCount(analytics?.statusStats, 'in-progress') + getCount(analytics?.statusStats, 'testing');
    const resolvedCount = getCount(analytics?.statusStats, 'resolved');
    const closedCount   = getCount(analytics?.statusStats, 'closed');
    const totalIssues   = openCount + inProgCount + resolvedCount + closedCount;
    const totalProjects = analytics?.projectStats?.length || 0;

    const donutSegments = [
        { label: 'Open',        value: openCount,     color: 'hsl(195,78%,52%)' },
        { label: 'In Progress', value: inProgCount,   color: 'hsl(38,92%,55%)'  },
        { label: 'Resolved',    value: resolvedCount, color: 'hsl(148,65%,45%)' },
        { label: 'Closed',      value: closedCount,   color: 'hsl(148,55%,35%)' },
    ];

    const priorityStats = analytics?.priorityStats || [];

    return (
        <div className="app-layout" data-testid="dashboard-layout">
            <Navbar />
            <div className="container" data-testid="dashboard-container">

                {/* Page header */}
                <div className="page-header" data-testid="dashboard-header">
                    <div>
                        <h1 data-testid="dashboard-title">
                            <span className="gradient-text">Workspace Dashboard</span>
                        </h1>
                        <p className="page-header-sub" data-testid="dashboard-welcome">
                            Welcome back, <strong style={{ color: 'var(--text-primary)' }} data-testid="user-name">{user?.name}</strong> ·{' '}
                            <span className={`badge badge-${user?.role}`} data-testid="user-role">{user?.role}</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link to="/issues" className="btn btn-secondary btn-sm">⊘ View Issues</Link>
                        {user?.role === 'admin' && (
                            <button
                                className="btn btn-sm"
                                onClick={handleSync}
                                disabled={syncLoading}
                                data-testid="sync-btn"
                            >
                                {syncLoading ? (
                                    <><span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Syncing...</>
                                ) : '↻ Sync Dataset'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stat cards */}
                {loading ? (
                    <div className="stats-grid" data-testid="analytics-container">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-card"></div>
                        ))}
                    </div>
                ) : (
                    <div className="stats-grid" data-testid="analytics-container">
                        <StatCard label="Total Issues" value={totalIssues} icon="⊘" color="blue"
                            trend="All tracked issues" data-testid="total-issues-card" />
                        <StatCard label="Active Projects" value={totalProjects} icon="⬡" color="purple"
                            trend="Ongoing workspaces" data-testid="active-projects-card" />
                        <StatCard label="Open Issues" value={openCount} icon="◎" color="amber"
                            trend="Needs attention" data-testid="open-issues-card" />
                        <StatCard label="Resolved" value={resolvedCount + closedCount} icon="✓" color="green"
                            trend="Closed + Resolved" data-testid="closed-issues-card" />
                    </div>
                )}

                {/* Charts row */}
                <div className="grid-2 mb-24">
                    <div className="card" data-testid="issue-chart">
                        <div className="card-title"><span className="card-title-icon">◈</span>Issue Status Overview</div>
                        {loading ? (
                            <div className="loading-wrap"><div className="loading-spinner"></div></div>
                        ) : (
                            <div className="donut-chart-wrap">
                                <DonutChart segments={donutSegments} size={140} thickness={22} />
                                <div className="donut-legend">
                                    {donutSegments.map(seg => (
                                        <div key={seg.label} className="donut-legend-item">
                                            <div className="donut-legend-dot" style={{ background: seg.color }}></div>
                                            <span className="donut-legend-label">{seg.label}</span>
                                            <span className="donut-legend-val">{seg.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">◎</span>Priority Distribution</div>
                        {loading ? (
                            <div className="loading-wrap"><div className="loading-spinner"></div></div>
                        ) : (
                            <div className="progress-bar-wrap">
                                {(['high', 'medium', 'low']).map(prio => {
                                    const count = getCount(priorityStats, prio);
                                    const pct = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
                                    const colors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--info)' };
                                    return (
                                        <div key={prio} className="progress-item">
                                            <div className="progress-header">
                                                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{prio}</span>
                                                <span>{count} · {pct}%</span>
                                            </div>
                                            <div className="progress-track">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: colors[prio] }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                                    <div className="progress-header mb-8">
                                        <span style={{ fontWeight: 600 }}>In-Progress</span>
                                        <span style={{ color: 'var(--warning)' }}>{inProgCount}</span>
                                    </div>
                                    <div className="priority-matrix">
                                        <div className="matrix-cell" style={{ background: 'var(--danger-dim)' }}>
                                            <div className="matrix-cell-label">High</div>
                                            <div className="matrix-cell-num" style={{ color: 'var(--danger)' }}>{getCount(priorityStats, 'high')}</div>
                                        </div>
                                        <div className="matrix-cell" style={{ background: 'var(--warning-dim)' }}>
                                            <div className="matrix-cell-label">Medium</div>
                                            <div className="matrix-cell-num" style={{ color: 'var(--warning)' }}>{getCount(priorityStats, 'medium')}</div>
                                        </div>
                                        <div className="matrix-cell" style={{ background: 'var(--primary-dim)' }}>
                                            <div className="matrix-cell-label">Low</div>
                                            <div className="matrix-cell-num" style={{ color: 'var(--primary)' }}>{getCount(priorityStats, 'low')}</div>
                                        </div>
                                        <div className="matrix-cell" style={{ background: 'var(--success-dim)' }}>
                                            <div className="matrix-cell-label">Resolved</div>
                                            <div className="matrix-cell-num" style={{ color: 'var(--success)' }}>{resolvedCount + closedCount}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Projects & Activity row */}
                <div className="grid-2 mb-24">
                    <div className="card" data-testid="recent-activity">
                        <div className="card-title"><span className="card-title-icon">⏱</span>Recent Activity</div>
                        {loading ? (
                            <div className="loading-wrap"><div className="loading-spinner"></div></div>
                        ) : !analytics?.activityLogs?.length ? (
                            <div className="empty-state" style={{ padding: '24px 0' }}>
                                <div className="empty-state-icon">📋</div>
                                <div className="empty-state-desc">No activity logged yet.</div>
                            </div>
                        ) : (
                            <div className="timeline" data-testid="activity-logs-list">
                                {analytics.activityLogs.map(log => (
                                    <div key={log._id} className="timeline-item" data-testid={`activity-log-${log._id}`}>
                                        <div className="timeline-icon">
                                            {ACTION_ICONS[log.action] || '◦'}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-action">
                                                <strong style={{ color: 'var(--text-primary)' }}>{log.user?.name || 'System'}</strong>{' '}
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {log.details || `changed status to ${log.newStatus}`}
                                                </span>
                                            </div>
                                            <div className="timeline-meta">
                                                {new Date(log.timestamp).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Developer performance */}
                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">◉</span>Top Performers</div>
                        {loading ? (
                            <div className="loading-wrap"><div className="loading-spinner"></div></div>
                        ) : !analytics?.developerStats?.length ? (
                            <div className="empty-state" style={{ padding: '24px 0' }}>
                                <div className="empty-state-icon">👥</div>
                                <div className="empty-state-desc">No resolved issues yet.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[...analytics.developerStats]
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 5)
                                    .map((dev, i) => {
                                        const maxCount = analytics.developerStats[0]?.count || 1;
                                        const pct = Math.round((dev.count / maxCount) * 100);
                                        return (
                                            <div key={dev._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: `hsl(${232 + i * 30}, 75%, 60%)`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '.65rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                                }}>
                                                    {dev.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.83rem', marginBottom: 4 }}>
                                                        <span style={{ fontWeight: 500 }}>{dev.name}</span>
                                                        <span style={{ color: 'var(--success)' }}>{dev.count} resolved</span>
                                                    </div>
                                                    <div className="progress-track">
                                                        <div className="progress-fill" style={{
                                                            width: `${pct}%`,
                                                            background: `hsl(${232 + i * 30}, 75%, 60%)`
                                                        }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending tasks */}
                <div className="card" data-testid="pending-tasks-card">
                    <div className="card-title">
                        <span><span className="card-title-icon">⚡</span>Action Items</span>
                        <Link to="/issues" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }}></div>
                            ))}
                        </div>
                    ) : pendingTasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">✨</div>
                            <div className="empty-state-title">All clear!</div>
                            <div className="empty-state-desc">No pending action items for you right now.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pendingTasks.map(task => (
                                <div
                                    key={task._id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', padding: '12px 16px',
                                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)', transition: 'var(--transition)',
                                    }}
                                    data-testid={`pending-task-${task.issueId}`}
                                >
                                    <div>
                                        <span style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace', display: 'block', marginBottom: 3 }}>
                                            {task.issueId}
                                        </span>
                                        <span style={{ fontSize: '.9rem', fontWeight: 500 }}>{task.title}</span>
                                        {task.project?.title && (
                                            <span style={{ fontSize: '.76rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                                                ⬡ {task.project.title}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
