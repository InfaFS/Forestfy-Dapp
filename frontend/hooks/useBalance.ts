import { useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";

export function useBalance() {
  const { balance, isLoadingBalance, refreshBalance } = useWallet();
  const [localBalance, setLocalBalance] = useState<string>(balance);

  // Update local balance when context balance changes
  useState(() => {
    setLocalBalance(balance);
  });

  const updateBalanceAfterTransaction = useCallback(async () => {
    await refreshBalance();
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
    isLoading: isLoadingBalance,
    refreshBalance,
    updateBalanceAfterTransaction,
    hasEnoughBalance,
    formatBalance,
  };
}
