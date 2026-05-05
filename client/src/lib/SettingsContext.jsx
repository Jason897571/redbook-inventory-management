import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const refresh = useCallback(() => {
    return api.getSettings().then((s) => { setSettings(s); return s; });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
