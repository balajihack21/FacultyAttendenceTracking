import React, { useState } from 'react';
import { useHolidays } from '../hooks/useHolidays';
import { Holiday } from '../types';
import { Loader2, Plus, Calendar, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const HolidayManagement: React.FC = () => {
    const { holidays, loading, error, addHoliday, updateHoliday, deleteHoliday, clearError } = useHolidays();
    const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [deleteHolidayConfirm, setDeleteHolidayConfirm] = useState<Holiday | null>(null);

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.date || !newHoliday.description) return;

        setIsAdding(true);
        setAddError(null);
        clearError();
        try {
            await addHoliday({ date: newHoliday.date, description: newHoliday.description });
            setNewHoliday({ date: '', description: '' });
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Failed to add holiday.");
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleUpdateDescription = async (newDescription: string) => {
        if (!editingHoliday || newDescription === editingHoliday.description) {
            setEditingHoliday(null);
            return;
        }
        try {
            await updateHoliday(editingHoliday.id, { description: newDescription });
        } catch (err) {
            // Error is handled globally in the hook
        } finally {
            setEditingHoliday(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteHolidayConfirm) return;
        try {
            await deleteHoliday(deleteHolidayConfirm.id);
        } catch (err) {
            // Error is handled globally
        } finally {
            setDeleteHolidayConfirm(null);
        }
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 rounded-md text-sm bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300" role="alert">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border border-accent dark:border-gray-700 rounded-lg">
                <div className="md:col-span-1">
                    <label htmlFor="holiday-date" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Date</label>
                    <input type="date" id="holiday-date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({...p, date: e.target.value}))} required className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="holiday-desc" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Description</label>
                    <input type="text" id="holiday-desc" value={newHoliday.description} onChange={e => setNewHoliday(p => ({...p, description: e.target.value}))} placeholder="e.g., Independence Day" required className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <button type="submit" disabled={isAdding} className="w-full flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 dark:bg-teal-500 dark:hover:bg-teal-400">
                    {isAdding ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                    Add Holiday
                </button>
                 {addError && <p className="md:col-span-4 text-sm text-red-600 dark:text-red-400 mt-1">{addError}</p>}
            </form>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-text-primary dark:text-gray-200 sticky top-0 bg-secondary dark:bg-gray-800 py-2">Scheduled Holidays</h3>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-highlight" size={32}/></div>
                ) : holidays.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary dark:text-gray-400">No holidays scheduled.</div>
                ) : (
                    holidays.map(holiday => (
                        <div key={holiday.id} className="bg-primary dark:bg-gray-900/80 p-3 rounded-lg flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar size={20} className="text-highlight dark:text-teal-400"/>
                                <div>
                                    <p className="font-semibold text-text-primary dark:text-gray-200">{holiday.date}</p>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">{holiday.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingHoliday(holiday)} className="p-2 rounded-full hover:bg-accent dark:hover:bg-gray-700"><Edit2 size={16}/></button>
                                <button onClick={() => setDeleteHolidayConfirm(holiday)} className="p-2 rounded-full hover:bg-accent dark:hover:bg-gray-700 text-red-600 dark:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Edit Modal */}
            {editingHoliday && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-medium text-text-primary dark:text-gray-100">Edit Holiday Description</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400">Date: {editingHoliday.date}</p>
                        <input
                          type="text"
                          defaultValue={editingHoliday.description}
                          onBlur={e => handleUpdateDescription(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateDescription((e.target as HTMLInputElement).value) }}
                          autoFocus
                          className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingHoliday(null)} className="px-4 py-2 text-sm rounded-md hover:bg-accent dark:hover:bg-gray-700">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {deleteHolidayConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div className="mt-0 text-center sm:text-left">
                                    <h3 className="text-lg font-medium text-text-primary dark:text-gray-100">Delete Holiday</h3>
                                    <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">
                                        Are you sure you want to delete the holiday for <strong className="dark:text-gray-200">{deleteHolidayConfirm.date} ({deleteHolidayConfirm.description})</strong>? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-accent dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                            <button onClick={handleDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Delete</button>
                            <button onClick={() => setDeleteHolidayConfirm(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagement;