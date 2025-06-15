import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';

interface TreesContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TreesContext = createContext<TreesContextType | undefined>(undefined);

export function TreesProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRefresh = useCallback(() => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout to debounce rapid calls
    debounceRef.current = setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 500); // 500ms debounce
  }, []);

  // Listen for refresh events from notifications
  useEffect(() => {
    const handleRefresh = () => {
      triggerRefresh();
    };

    const subscription = DeviceEventEmitter.addListener('refreshTreesData', handleRefresh);
    return () => subscription.remove();
  }, [triggerRefresh]);

  return (
    <TreesContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </TreesContext.Provider>
  );
}

export function useTrees() {
  const context = useContext(TreesContext);
  if (context === undefined) {
    throw new Error('useTrees must be used within a TreesProvider');
  }
  return context;
} 