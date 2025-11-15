import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { db } from '../firebase/config';
import { Settings } from '../types';
import { ref, get, set } from "firebase/database";

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Settings) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  onTimeThreshold: '08:15:00',
  permissionLimit: 2,
  accountCreationEnabled: true,
  userAccountRequestEnabled: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const settingsSnapshot = await get(ref(db, "settings"));

        if (settingsSnapshot.exists()) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...settingsSnapshot.val(),
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings. Using defaults.");
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    setLoading(true);
    setError(null);

    try {
      await set(ref(db, "settings"), newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to save settings.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = { settings, loading, error, updateSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
