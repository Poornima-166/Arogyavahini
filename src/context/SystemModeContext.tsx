import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

export type SystemMode = 'LIVE' | 'DEMO';

interface SystemModeContextType {
  mode: SystemMode;
  setMode: (mode: SystemMode) => void;
  toggleMode: () => void;
  isLive: boolean;
  isDemo: boolean;
  isSocketConnected: boolean;
}

const SystemModeContext = createContext<SystemModeContextType | undefined>(undefined);

export const SystemModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<SystemMode>(() => {
    try {
      const saved = localStorage.getItem('arogyavahini_system_mode');
      if (saved === 'DEMO' || saved === 'LIVE') return saved;
    } catch {
      // fallback
    }
    return 'LIVE'; // Default to REAL-WORLD LIVE MODE as requested
  });

  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);

  useEffect(() => {
    // Initialize Socket.IO connection
    socketService.connect();
    const unsub = socketService.onConnectionChange((connected) => {
      setIsSocketConnected(connected);
    });

    return () => {
      unsub();
    };
  }, []);

  const setMode = (newMode: SystemMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('arogyavahini_system_mode', newMode);
    } catch {
      // ignore
    }
  };

  const toggleMode = () => {
    setMode(mode === 'LIVE' ? 'DEMO' : 'LIVE');
  };

  return (
    <SystemModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isLive: mode === 'LIVE',
        isDemo: mode === 'DEMO',
        isSocketConnected,
      }}
    >
      {children}
    </SystemModeContext.Provider>
  );
};

export const useSystemMode = (): SystemModeContextType => {
  const context = useContext(SystemModeContext);
  if (!context) {
    throw new Error('useSystemMode must be used within a SystemModeProvider');
  }
  return context;
};
