import { useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";

export function useBalance() {
  const { balance, refreshBalance } = useWallet();
  const [localBalance, setLocalBalance] = useState<string>(balance);
  const [isLoading, setIsLoading] = useState(false);

  // Update local balance when context balance changes
  useState(() => {
    setLocalBalance(balance);
  });

  const updateBalanceAfterTransaction = useCallback(async () => {
    setIsLoading(true);
    await refreshBalance();
    setIsLoading(false);
  }, [refreshBalance]);

  const hasEnoughBalance = useCallback(
    (amount: number): boolean => {
      return Number(balance) >= amount;
    },
    [balance]
  );

  const formatBalance = useCallback((value: string): string => {
    const num = Number(value);
    return num.toFixed(2);
  }, []);

  return {
    balance: localBalance,
    isLoading,
    refreshBalance,
    updateBalanceAfterTransaction,
    hasEnoughBalance,
    formatBalance,
  };
}
