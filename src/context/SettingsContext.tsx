/**
 * Settings Context
 * Allows any component to open the settings modal
 */

import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  openSettings: () => void;
  closeSettings: () => void;
  isSettingsVisible: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  openSettings: () => {},
  closeSettings: () => {},
  isSettingsVisible: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const openSettings = () => setIsSettingsVisible(true);
  const closeSettings = () => setIsSettingsVisible(false);

  return (
    <SettingsContext.Provider value={{ openSettings, closeSettings, isSettingsVisible }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
