import React, { createContext, useContext, useState, useCallback } from 'react';

interface TreesContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TreesContext = createContext<TreesContextType | undefined>(undefined);

export function TreesProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
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