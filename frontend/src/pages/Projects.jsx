import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = [
    'Web Development', 'Mobile App', 'API / Backend', 'Data Science',
    'DevOps', 'Security', 'UI/UX Design', 'General',
];

const CAT_CLASS = {
    'Web Development': 'proj-web',
    'Mobile App': 'proj-mobile',
    'API / Backend': 'proj-api',
    'Data Science': 'proj-data',
    'General': 'proj-gen',
};

const CAT_ICONS = {
    'Web Development': '🌐',
    'Mobile App': '📱',
    'API / Backend': '⚙',
    'Data Science': '📊',
    'DevOps': '🚀',
    'Security': '🔒',
    'UI/UX Design': '🎨',
    'General': '📁',
};

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Projects() {
    const { user } = useAuth();
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', category: 'General', status: 'active' });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const isAuthorized = ['admin', 'manager'].includes(user?.role);
    const PER_PAGE = 9;

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await API.get('/projects');
            const data = res.data.data || [];
            setProjects(data);
            if (window.appState) window.appState.projects = data;
        } catch {
            toast.error('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const openCreate = () => {
        setEditProject(null);
        setForm({ title: '', description: '', category: 'General', status: 'active' });
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditProject(p);
        setForm({ title: p.title, description: p.description, category: p.category, status: p.status });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editProject) {
                await API.patch(`/projects/${editProject._id}`, form);
                toast.success('Project updated successfully!');
            } else {
                await API.post('/projects', form);
                toast.success('Project created!');
            }
            setShowModal(false);
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.');
        }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete project "${p.title}"?`)) return;
        try {
            await API.delete(`/projects/${p._id}`);
            toast.success('Project deleted.');
            fetchProjects();
        } catch {
            toast.error('Failed to delete project.');
        }
    };

    const filtered = projects
        .filter(p =>
            (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())) &&
            (!statusFilter || p.status === statusFilter)
        );

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    return (
        <div className="app-layout" data-testid="projects-layout">
            <Navbar />
            <div className="container" data-testid="projects-container">

                <div className="page-header" data-testid="projects-header">
                    <div>
                        <h1 data-testid="projects-title"><span className="gradient-text">Projects</span></h1>
                        <p className="page-header-sub" data-testid="projects-subtitle">
                            {projects.length} workspace{projects.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    {isAuthorized && (
                        <button className="btn" onClick={openCreate} data-testid="create-project-btn">
                            + New Project
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="filter-toolbar">
                    <div className="search-bar">
                        <span className="search-icon">⌕</span>
                        <input
                            placeholder="Search projects..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            data-testid="project-search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select className="filter-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '.82rem' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {loading ? (
                    <div className="projects-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: 200, borderRadius: 14 }}></div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">⬡</div>
                        <div className="empty-state-title">No projects found</div>
                        <div className="empty-state-desc">
                            {isAuthorized ? 'Create your first project to get started.' : 'No projects match your filters.'}
                        </div>
                        {isAuthorized && (
                            <button className="btn" style={{ marginTop: 20 }} onClick={openCreate}>+ New Project</button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="projects-grid" data-testid="projects-grid">
                            {paginated.map((p, idx) => {
                                const catClass = CAT_CLASS[p.category] || 'proj-gen';
                                const catIcon = CAT_ICONS[p.category] || '📁';
                                return (
                                    <div key={p._id} className={`project-card ${catClass}`} style={{ animationDelay: `${idx * 0.05}s` }}
                                        data-testid={`project-card-${p.projectId}`}>
                                        <div className="project-card-header">
                                            <div className="project-card-cat">{catIcon} {p.category}</div>
                                            <div className="project-card-title">{p.title}</div>
                                            <div className="project-card-id">{p.projectId}</div>
                                        </div>
                                        <div className="project-card-body">
                                            <p className="project-desc">{p.description || 'No description provided.'}</p>
                                            <div className="project-meta">
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span className={`badge badge-${p.status === 'active' ? 'active' : p.status === 'completed' ? 'resolved' : 'inactive'}`}>
                                                        {p.status}
                                                    </span>
                                                    {p.members?.length > 0 && (
                                                        <div className="member-stack">
                                                            {p.members.slice(0, 4).map((m, mi) => (
                                                                <div key={mi} className="member-avatar" title={m.name}
                                                                    style={{ background: `hsl(${232 + mi * 40}, 75%, 58%)` }}>
                                                                    {getInitials(m.name)}
                                                                </div>
                                                            ))}
                                                            {p.members.length > 4 && (
                                                                <div className="member-avatar" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '.6rem' }}>
                                                                    +{p.members.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isAuthorized && (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">✎</button>
                                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p)} title="Delete">✕</button>
                                                    </div>
                                                )}
                                            </div>
                                            {p.owner && (
                                                <div style={{ marginTop: 10, fontSize: '.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <span>👤 {p.owner.name}</span>
                                                    {p.startDate && <span>· {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                ))}
                                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⬡ {editProject ? 'Edit Project' : 'New Project'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Project Title *</label>
                                    <input className="form-control" placeholder="e.g. Customer Portal v2"
                                        value={form.title} required
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        data-testid="project-title-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" placeholder="What is this project about?"
                                        rows={3} value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        data-testid="project-description-input" />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-control" value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            data-testid="project-category-select">
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-control" value={form.status}
                                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn" data-testid="submit-project-btn">
                                    {editProject ? 'Save Changes' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
