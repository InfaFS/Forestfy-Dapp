import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { TokenContract } from '@/constants/thirdweb';

interface WalletContextType {
  balance: string;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;
  hasClaimedReward: boolean;
  refreshClaimStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const [balance, setBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      setIsLoadingBalance(true);
      const data = await readContract({
        contract: TokenContract,
        method: "function virtualBalance(address) view returns (uint256)",
        params: [account.address],
      });
      const balanceInTokens = Number(data) / 1e18;
      setBalance(balanceInTokens.toFixed(2));
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [account?.address]);

  const refreshClaimStatus = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      const data = await readContract({
        contract: TokenContract,
        method: "function hasClaimedReward(address) view returns (bool)",
        params: [account.address],
      });
      setHasClaimedReward(!!data);
    } catch (error) {
      console.error('Error fetching claim status:', error);
    }
  }, [account?.address]);

  useEffect(() => {
    if (account?.address) {
      refreshBalance();
      refreshClaimStatus();
      
      // Actualizar balance cada 30 segundos
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [account?.address, refreshBalance, refreshClaimStatus]);

  const value: WalletContextType = {
    balance,
    isLoadingBalance,
    refreshBalance,
    hasClaimedReward,
    refreshClaimStatus,
  };

  return (
    <WalletContext.Provider value={value}>
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