import { useState, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { mintTree, reclaimReward } from "@/constants/api";
import { useWallet } from "@/contexts/WalletContext";

export function useNFTOperations() {
  const account = useActiveAccount();
  const { refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const mintNewTree = useCallback(
    async (amount: number) => {
      if (!account?.address) {
        console.log("❌ Error: Wallet no conectada");
        return false;
      }

      if (amount <= 0) {
        console.log("❌ Error: Cantidad debe ser mayor a 0");
        return false;
      }

      try {
        setIsLoading(true);
        await mintTree(account.address, amount);

        // Refresh balance after successful mint
        await refreshBalance();

        console.log("✅ ¡Árbol plantado exitosamente!");
        return true;
      } catch (error) {
        console.error("❌ Error minting tree:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account?.address, refreshBalance]
  );

  const claimReward = useCallback(async () => {
    if (!account?.address) {
      console.log("❌ Error: Wallet no conectada");
      return false;
    }

    try {
      setIsLoading(true);
      await reclaimReward(account.address);

      // Refresh balance after successful claim
      await refreshBalance();

      console.log("✅ Recompensa reclamada exitosamente");
      return true;
    } catch (error) {
      console.error("❌ Error claiming reward:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, refreshBalance]);

  return {
    isLoading,
    mintNewTree,
    claimReward,
  };
}
