import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import Navbar from '../components/Navbar';

const STATUS_COLS = [
    { id: 'open',        label: 'Open',        color: 'var(--info)',    dot: '#0ea5e9' },
    { id: 'in-progress', label: 'In Progress',  color: 'var(--warning)', dot: '#f59e0b' },
    { id: 'testing',     label: 'Testing',      color: 'var(--accent)',  dot: '#a855f7' },
    { id: 'resolved',    label: 'Resolved',     color: 'var(--success)', dot: '#10b981' },
    { id: 'closed',      label: 'Closed',       color: 'var(--success)', dot: '#059669' },
];

function IssueCard({ issue, onClick }) {
    return (
        <div className="kanban-card" onClick={() => onClick(issue)} data-testid={`issue-card-${issue.issueId}`}>
            <div className="kanban-card-id">{issue.issueId}</div>
            <div className="kanban-card-title">{issue.title}</div>
            <div className="kanban-card-footer">
                <div style={{ display: 'flex', gap: 5 }}>
                    <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                    {issue.severity !== 'minor' && (
                        <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                    )}
                </div>
                {issue.assignedTo && (
                    <div className="kanban-card-assignee">
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--primary)', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '.58rem', fontWeight: 700, color: '#fff'
                        }}>
                            {issue.assignedTo.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        {issue.assignedTo.name?.split(' ')[0]}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Issues() {
    const { user } = useAuth();
    const toast = useToast();
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('kanban');
    const [filters, setFilters] = useState({ project: '', status: '', priority: '', severity: '', search: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newIssue, setNewIssue] = useState({ title: '', description: '', project: '', priority: 'medium', severity: 'minor', assignedTo: '' });
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [issueDetail, setIssueDetail] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    const canCreate = ['admin', 'manager'].includes(user?.role);
    const canEdit   = ['admin', 'manager'].includes(user?.role);

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
            const res = await API.get(`/issues${params.toString() ? '?' + params : ''}`);
            const data = res.data.data || [];
            setIssues(data);
            if (window.appState) { window.appState.issues = data; window.appState.filters = filters; }
        } catch {
            toast.error('Failed to load issues.');
        } finally {
            setLoading(false);
        }
    }, [filters, toast]);

    const fetchDropdowns = async () => {
        try {
            const [pr, us] = await Promise.all([API.get('/projects'), API.get('/users')]);
            setProjects(pr.data.data || []);
            setUsers(us.data.data || []);
        } catch {}
    };

    useEffect(() => { fetchDropdowns(); }, []);
    useEffect(() => { fetchIssues(); }, [filters, fetchIssues]);

    const openDetails = async (issue) => {
        setSelectedIssue(issue);
        setIssueDetail(null);
        setShowDetails(true);
        try {
            const res = await API.get(`/issues/${issue._id}`);
            setIssueDetail(res.data.data);
        } catch {
            toast.error('Failed to load issue details.');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/issues', newIssue);
            toast.success('Issue created!');
            setNewIssue({ title: '', description: '', project: '', priority: 'medium', severity: 'minor', assignedTo: '' });
            setShowCreateModal(false);
            fetchIssues();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create issue.');
        }
    };

    const handleStatusChange = async (issueId, status) => {
        setStatusUpdating(true);
        try {
            await API.patch(`/issues/${issueId}/status`, { status });
            toast.success(`Status → ${status}`);
            if (issueDetail?._id === issueId) {
                setIssueDetail(d => ({ ...d, status }));
            }
            fetchIssues();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Status update failed.');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedIssue) return;
        try {
            const res = await API.post(`/issues/${selectedIssue._id}/comments`, { message: newComment.trim() });
            toast.success('Comment added!');
            setNewComment('');
            setIssueDetail(d => ({
                ...d,
                comments: [...(d?.comments || []), res.data.data]
            }));
        } catch {
            toast.error('Failed to add comment.');
        }
    };

    const handleDelete = async (issue) => {
        if (!window.confirm(`Delete issue "${issue.title}"?`)) return;
        try {
            await API.delete(`/issues/${issue._id}`);
            toast.success('Issue deleted.');
            if (showDetails) setShowDetails(false);
            fetchIssues();
        } catch {
            toast.error('Failed to delete issue.');
        }
    };

    const filteredIssues = issues;

    return (
        <div className="app-layout" data-testid="issues-layout">
            <Navbar />
            <div className="container" data-testid="issues-container">

                <div className="page-header">
                    <div>
                        <h1><span className="gradient-text">Issues</span></h1>
                        <p className="page-header-sub">{issues.length} issue{issues.length !== 1 ? 's' : ''} tracked</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div className="view-toggle">
                            <button className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>⊞ Kanban</button>
                            <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰ List</button>
                        </div>
                        {canCreate && (
                            <button className="btn" onClick={() => setShowCreateModal(true)} data-testid="create-issue-btn">
                                + New Issue
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-toolbar">
                    <div className="search-bar">
                        <span className="search-icon">⌕</span>
                        <input placeholder="Search issues..." value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            data-testid="issue-search-input" />
                    </div>
                    <div className="filter-group">
                        <label>Project</label>
                        <select className="filter-control" value={filters.project}
                            onChange={e => setFilters(f => ({ ...f, project: e.target.value }))}
                            data-testid="project-filter">
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Priority</label>
                        <select className="filter-control" value={filters.priority}
                            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
                            data-testid="priority-filter">
                            <option value="">All</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select className="filter-control" value={filters.status}
                            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                            data-testid="status-filter">
                            <option value="">All</option>
                            {STATUS_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>
                    {Object.values(filters).some(v => v) && (
                        <button className="btn btn-ghost btn-sm"
                            onClick={() => setFilters({ project: '', status: '', priority: '', severity: '', search: '' })}>
                            ✕ Clear
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading-wrap"><div className="loading-spinner"></div><span>Loading issues...</span></div>
                ) : view === 'kanban' ? (
                    /* KANBAN VIEW */
                    <div className="kanban-board" data-testid="kanban-board">
                        {STATUS_COLS.map(col => {
                            const colIssues = filteredIssues.filter(i => i.status === col.id);
                            return (
                                <div key={col.id} className="kanban-col" data-testid={`kanban-col-${col.id}`}>
                                    <div className="kanban-col-header">
                                        <div className="kanban-col-label">
                                            <div className="kanban-col-dot" style={{ background: col.dot }}></div>
                                            <span style={{ color: col.color }}>{col.label}</span>
                                        </div>
                                        <span className="kanban-col-count">{colIssues.length}</span>
                                    </div>
                                    <div className="kanban-cards">
                                        {colIssues.length === 0 ? (
                                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8rem', padding: '20px 0' }}>
                                                Empty
                                            </div>
                                        ) : (
                                            colIssues.map(issue => (
                                                <IssueCard key={issue._id} issue={issue} onClick={openDetails} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }} data-testid="issues-table-card">
                        {filteredIssues.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">⊘</div>
                                <div className="empty-state-title">No issues found</div>
                                <div className="empty-state-desc">Try adjusting filters or create a new issue.</div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table" data-testid="issues-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Project</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Assigned To</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIssues.map(issue => (
                                            <tr key={issue._id} data-testid={`issue-row-${issue.issueId}`}>
                                                <td className="mono" style={{ color: 'var(--primary)', fontSize: '.78rem' }}>{issue.issueId}</td>
                                                <td style={{ fontWeight: 500 }}>{issue.title}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{issue.project?.title || '—'}</td>
                                                <td><span className={`badge badge-${issue.priority}`}>{issue.priority}</span></td>
                                                <td><span className={`badge badge-${issue.status}`}>{issue.status}</span></td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{issue.assignedTo?.name || '—'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openDetails(issue)}>View</button>
                                                        {canEdit && <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(issue)}>✕</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Issue Modal */}
            {showCreateModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⊘ Create New Issue</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input className="form-control" placeholder="Issue title..."
                                        required value={newIssue.title}
                                        onChange={e => setNewIssue(f => ({ ...f, title: e.target.value }))}
                                        data-testid="issue-title-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" rows={3} placeholder="Describe the issue..."
                                        value={newIssue.description}
                                        onChange={e => setNewIssue(f => ({ ...f, description: e.target.value }))}
                                        data-testid="issue-description-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project *</label>
                                    <select className="form-control" required value={newIssue.project}
                                        onChange={e => setNewIssue(f => ({ ...f, project: e.target.value }))}
                                        data-testid="issue-project-select">
                                        <option value="">Select project</option>
                                        {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select className="form-control" value={newIssue.priority}
                                            onChange={e => setNewIssue(f => ({ ...f, priority: e.target.value }))}
                                            data-testid="issue-priority-select">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Severity</label>
                                        <select className="form-control" value={newIssue.severity}
                                            onChange={e => setNewIssue(f => ({ ...f, severity: e.target.value }))}>
                                            <option value="minor">Minor</option>
                                            <option value="major">Major</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assign To</label>
                                    <select className="form-control" value={newIssue.assignedTo}
                                        onChange={e => setNewIssue(f => ({ ...f, assignedTo: e.target.value }))}
                                        data-testid="issue-assignee-select">
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn" data-testid="submit-issue-btn">Create Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Issue Details Modal */}
            {showDetails && selectedIssue && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-content-wide">
                        <div className="modal-header">
                            <h3>
                                <span className="mono" style={{ color: 'var(--primary)', fontSize: '.85rem', fontWeight: 400 }}>{selectedIssue.issueId}</span>
                                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
                                <span style={{ fontSize: '1rem' }}>{selectedIssue.title}</span>
                            </h3>
                            <button className="modal-close" onClick={() => setShowDetails(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {!issueDetail ? (
                                <div className="loading-wrap"><div className="loading-spinner"></div></div>
                            ) : (
                                <>
                                    <div className="issue-details-grid">
                                        <div>
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Description</div>
                                                <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                                    {issueDetail.description || 'No description.'}
                                                </p>
                                            </div>

                                            {/* Status change */}
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Update Status</div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {STATUS_COLS.map(s => (
                                                        <button key={s.id}
                                                            className={`chip ${issueDetail.status === s.id ? 'active' : ''}`}
                                                            onClick={() => handleStatusChange(issueDetail._id, s.id)}
                                                            disabled={statusUpdating || issueDetail.status === s.id}
                                                            style={{ cursor: issueDetail.status === s.id ? 'default' : 'pointer' }}>
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Comments */}
                                            <div className="comment-section">
                                                <div className="section-title" style={{ marginBottom: 12 }}>Comments ({issueDetail.comments?.length || 0})</div>
                                                {issueDetail.comments?.length > 0 ? (
                                                    <div className="comment-list">
                                                        {issueDetail.comments.map(c => (
                                                            <div key={c._id} className="comment-item">
                                                                <div className="comment-meta">
                                                                    <div className="comment-author">
                                                                        <div className="comment-author-avatar">
                                                                            {c.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                                        </div>
                                                                        {c.user?.name}
                                                                        {c.user?.role && <span className={`badge badge-${c.user.role}`}>{c.user.role}</span>}
                                                                    </div>
                                                                    <span className="comment-date">{new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <p className="comment-text">{c.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: 12 }}>No comments yet.</p>
                                                )}
                                                <form className="comment-form" onSubmit={handleAddComment}>
                                                    <textarea className="form-control" rows={2} placeholder="Add a comment..."
                                                        value={newComment} onChange={e => setNewComment(e.target.value)} />
                                                    <button type="submit" className="btn btn-sm" disabled={!newComment.trim()}>
                                                        Send Comment
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Meta sidebar */}
                                        <div>
                                            <div className="meta-box">
                                                <div className="meta-row">
                                                    <span className="meta-label">Status</span>
                                                    <span className={`badge badge-${issueDetail.status}`}>{issueDetail.status}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Priority</span>
                                                    <span className={`badge badge-${issueDetail.priority}`}>{issueDetail.priority}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Severity</span>
                                                    <span className={`badge badge-${issueDetail.severity}`}>{issueDetail.severity}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Project</span>
                                                    <span className="meta-value">{issueDetail.project?.title || '—'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Assigned To</span>
                                                    <span className="meta-value">{issueDetail.assignedTo?.name || 'Unassigned'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Reported By</span>
                                                    <span className="meta-value">{issueDetail.reportedBy?.name || '—'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span className="meta-label">Created</span>
                                                    <span className="meta-value" style={{ fontSize: '.8rem' }}>{new Date(issueDetail.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {issueDetail.dueDate && (
                                                    <div className="meta-row">
                                                        <span className="meta-label">Due Date</span>
                                                        <span className="meta-value" style={{ fontSize: '.8rem' }}>{new Date(issueDetail.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <button className="btn btn-danger btn-sm w-full" style={{ marginTop: 12 }}
                                                    onClick={() => handleDelete(issueDetail)}>
                                                    Delete Issue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
