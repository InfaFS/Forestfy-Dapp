import React, { createContext, useContext, useEffect, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { DeviceEventEmitter } from 'react-native';
import { TokenContract } from '@/constants/thirdweb';

interface WalletContextType {
  balance: string;
  isLoading: boolean;
  refreshBalance: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const activeAccount = useActiveAccount();
  const [balance, setBalance] = useState('0');

  const { 
    data: balanceData, 
    isPending: isLoading, 
    refetch: refreshBalance 
  } = useReadContract({
    contract: TokenContract,
    method: "function virtualBalance(address user) view returns (uint256)",
    params: [activeAccount?.address || ""],
    queryOptions: {
      enabled: !!activeAccount?.address,
    },
  });

  useEffect(() => {
    if (balanceData) {
      const formattedBalance = (Number(balanceData) / 1e18).toFixed(2);
      setBalance(formattedBalance);
    }
  }, [balanceData]);

  // Auto-refresh balance every 90 seconds
  useEffect(() => {
    if (!activeAccount?.address) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 90000); // Aumentado a 90 segundos

    return () => clearInterval(interval);
  }, [activeAccount?.address, refreshBalance]);

  // Listen for custom refresh events using DeviceEventEmitter for React Native
  useEffect(() => {
    const handleRefresh = () => {
      refreshBalance();
    };

    const subscription = DeviceEventEmitter.addListener('refreshWalletData', handleRefresh);
    return () => subscription.remove();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider value={{
      balance,
      isLoading,
      refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 