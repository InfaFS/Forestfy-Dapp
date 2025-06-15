import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';

interface MarketplaceContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Listen for refresh events from notifications
  useEffect(() => {
    const handleRefresh = () => {
      triggerRefresh();
    };

    const subscription = DeviceEventEmitter.addListener('refreshMarketplaceData', handleRefresh);
    return () => subscription.remove();
  }, [triggerRefresh]);

  return (
    <MarketplaceContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
} 