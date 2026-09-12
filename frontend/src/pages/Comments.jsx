import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import Navbar from '../components/Navbar';

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const ROLE_COLORS = {
    admin: 'hsl(350,85%,62%)', manager: 'hsl(38,92%,55%)',
    developer: 'hsl(232,90%,68%)', tester: 'hsl(280,85%,65%)',
};

export default function Comments() {
    const { user: me } = useAuth();
    const toast = useToast();
    const [comments, setComments] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ issueId: '', message: '' });
    const [search, setSearch] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [commRes, issRes] = await Promise.all([
                API.get('/comments'),
                API.get('/issues'),
            ]);
            setComments(commRes.data.data || []);
            setIssues(issRes.data.data || []);
            if (window.appState) window.appState.comments = commRes.data.data || [];
        } catch {
            toast.error('Failed to load discussions.');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/comments', { issueId: form.issueId, message: form.message });
            toast.success('Comment posted!');
            setForm({ issueId: '', message: '' });
            setShowModal(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post comment.');
        }
    };

    const handleDelete = async (c) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await API.delete(`/comments/${c._id}`);
            toast.success('Comment deleted.');
            fetchAll();
        } catch {
            toast.error('Could not delete comment.');
        }
    };

    const filtered = comments.filter(c =>
        !search ||
        c.message?.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.issue?.title?.toLowerCase().includes(search.toLowerCase())
    );

    const canDelete = (c) => me?.role === 'admin' || c.user?._id === me?._id || c.user?.userId === me?.userId;

    return (
        <div className="app-layout" data-testid="comments-layout">
            <Navbar />
            <div className="container" data-testid="comments-container">

                <div className="page-header">
                    <div>
                        <h1><span className="gradient-text">Discussions</span></h1>
                        <p className="page-header-sub">{comments.length} comment{comments.length !== 1 ? 's' : ''} across all issues</p>
                    </div>
                    <button className="btn" onClick={() => setShowModal(true)} data-testid="add-comment-btn">
                        + New Comment
                    </button>
                </div>

                {/* Search */}
                <div className="filter-toolbar">
                    <div className="search-bar">
                        <span className="search-icon">⌕</span>
                        <input placeholder="Search discussions..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '.82rem' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: 110, borderRadius: 14 }}></div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">◉</div>
                        <div className="empty-state-title">No discussions yet</div>
                        <div className="empty-state-desc">Be the first to comment on an issue.</div>
                        <button className="btn" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>+ New Comment</button>
                    </div>
                ) : (
                    <div className="discussion-list" data-testid="comments-list">
                        {filtered.map((c, idx) => {
                            const color = ROLE_COLORS[c.user?.role] || 'var(--primary)';
                            return (
                                <div key={c._id} className="discussion-item"
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                    data-testid={`comment-item-${c._id}`}>
                                    <div className="discussion-header">
                                        <div className="discussion-author">
                                            <div className="disc-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                                                {getInitials(c.user?.name)}
                                            </div>
                                            <div>
                                                <div className="disc-author-name">{c.user?.name || 'Unknown'}</div>
                                                <div className="disc-author-role">{c.user?.role || ''}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span className="disc-date">
                                                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {canDelete(c) && (
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(c)} title="Delete comment">✕</button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="discussion-body">{c.message}</p>

                                    <div className="discussion-footer">
                                        {c.issue && (
                                            <div className="disc-issue-tag">
                                                ⊘ {c.issue?.issueId || ''} · {c.issue?.title || 'Unknown Issue'}
                                            </div>
                                        )}
                                        {c.issue?.project?.title && (
                                            <span style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>⬡ {c.issue.project.title}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Comment Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>◉ Post a Comment</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Issue *</label>
                                    <select className="form-control" required value={form.issueId}
                                        onChange={e => setForm(f => ({ ...f, issueId: e.target.value }))}
                                        data-testid="comment-issue-select">
                                        <option value="">Select an issue</option>
                                        {issues.map(i => (
                                            <option key={i._id} value={i._id}>
                                                [{i.issueId}] {i.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Comment *</label>
                                    <textarea className="form-control" rows={4} required
                                        placeholder="Write your comment..."
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        data-testid="comment-message-input" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn" data-testid="submit-comment-btn">Post Comment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
