import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const t = setTimeout(() => onRemove(toast.id), toast.duration || 3500);
        return () => clearTimeout(t);
    }, [toast, onRemove]);

    return (
        <div className={`toast ${toast.type}`} role="alert">
            <div className="toast-icon">{ICONS[toast.type] || ICONS.info}</div>
            <div className="toast-text">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-msg">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => onRemove(toast.id)}>✕</button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback(({ type = 'info', title, message, duration }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
    }, []);

    const toast = {
        success: (message, title) => show({ type: 'success', title, message }),
        error:   (message, title) => show({ type: 'error',   title, message, duration: 5000 }),
        info:    (message, title) => show({ type: 'info',    title, message }),
        warning: (message, title) => show({ type: 'warning', title, message }),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
