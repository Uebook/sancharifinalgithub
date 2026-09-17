import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddEventModal = ({ isOpen, onClose, onSave, eventToEdit }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        attendees: 0,
        status: 'pending' // default status
    });

    React.useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title,
                date: eventToEdit.date,
                time: eventToEdit.time,
                attendees: eventToEdit.attendees,
                status: eventToEdit.status
            });
        } else {
            setFormData({
                title: '',
                date: '',
                time: '',
                attendees: 0,
                status: 'pending'
            });
        }
    }, [eventToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            title: '',
            date: '',
            time: '',
            attendees: 0,
            status: 'pending'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">{eventToEdit ? 'Edit Event' : 'Add New Event'}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Event Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="e.g. Science Fair"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                            <input
                                type="date"
                                name="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-emerald-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Time</label>
                            <input
                                type="time"
                                name="time"
                                required
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-emerald-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Expected Attendees</label>
                        <input
                            type="number"
                            name="attendees"
                            min="0"
                            value={formData.attendees}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="e.g. 100"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 font-bold hover:bg-slate-800 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 text-sm"
                        >
                            {eventToEdit ? 'Update Event' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEventModal;
