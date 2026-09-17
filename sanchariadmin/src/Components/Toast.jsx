import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-800',
                    icon: <CheckCircle size={20} className="text-emerald-600" />
                };
            case 'error':
                return {
                    bg: 'bg-rose-50',
                    border: 'border-rose-200',
                    text: 'text-rose-800',
                    icon: <XCircle size={20} className="text-rose-600" />
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'text-amber-800',
                    icon: <AlertCircle size={20} className="text-amber-600" />
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: <AlertCircle size={20} className="text-blue-600" />
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div className={`fixed top-6 right-6 z-100 ${styles.bg} ${styles.border} border rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[320px] animate-in slide-in-from-top-5 duration-300`}>
            {styles.icon}
            <p className={`${styles.text} font-medium flex-1`}>{message}</p>
            <button
                onClick={onClose}
                className={`${styles.text} hover:opacity-70 transition-opacity`}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default Toast;
