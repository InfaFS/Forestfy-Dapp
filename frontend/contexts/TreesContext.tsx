import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface TreesContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TreesContext = createContext<TreesContextType | undefined>(undefined);

export function TreesProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRefresh = useCallback(() => {
    console.log('🌳 TreesContext: triggerRefresh called, debouncing...');
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout to debounce rapid calls
    debounceRef.current = setTimeout(() => {
      console.log('🌳 TreesContext: executing debounced refresh');
      setRefreshTrigger(prev => {
        const newValue = prev + 1;
        console.log('🌳 TreesContext: refreshTrigger updated from', prev, 'to', newValue);
        return newValue;
      });
    }, 500); // 500ms debounce
  }, []);

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