import React, { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { Save, Loader2 } from 'lucide-react';

const GeneralSettings: React.FC = () => {
  const { settings, loading, error, updateSettings } = useSettings();
  const [formState, setFormState] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateSettings(formState);
      setFeedback({ type: 'success', message: 'Settings saved successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !isSaving) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-10 w-10 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
        {error && !feedback && (
          <div className="mb-6 p-4 rounded-md text-sm bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300">
            {error}
          </div>
        )}
        {feedback && (
          <div className={`mb-6 p-4 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'}`}>
            {feedback.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="onTimeThreshold" className="block text-sm font-medium text-text-secondary dark:text-gray-400">On-Time Threshold</label>
            <p className="text-xs text-text-secondary dark:text-gray-500 mb-1">Arrivals at or before this time are marked 'On-time'.</p>
            <input
              id="onTimeThreshold"
              name="onTimeThreshold"
              type="time"
              value={formState.onTimeThreshold}
              onChange={handleInputChange}
              step="1" // to include seconds
              className="mt-1 block w-full bg-primary border border-accent rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-highlight focus:border-highlight dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <div>
            <label htmlFor="permissionLimit" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Permission Limit</label>
            <p className="text-xs text-text-secondary dark:text-gray-500 mb-1">Number of late arrivals per month that are counted as permissions instead of half-day leaves.</p>
            <input
              id="permissionLimit"
              name="permissionLimit"
              type="number"
              min="0"
              value={formState.permissionLimit}
              onChange={handleInputChange}
              className="mt-1 block w-full bg-primary border border-accent rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-highlight focus:border-highlight dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin"/> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
};

export default GeneralSettings;