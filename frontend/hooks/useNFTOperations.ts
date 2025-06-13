import { useState, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { mintTree, reclaimReward } from "@/constants/api";
import { useNotification } from "@/contexts/NotificationContext";
import { useWallet } from "@/contexts/WalletContext";

export function useNFTOperations() {
  const account = useActiveAccount();
  const { showNotification } = useNotification();
  const { refreshBalance, refreshClaimStatus } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const mintNewTree = useCallback(
    async (amount: number) => {
      if (!account?.address) {
        showNotification({
          type: "error",
          title: "Error",
          message: "Wallet no conectada",
        });
        return false;
      }

      if (amount <= 0) {
        showNotification({
          type: "error",
          title: "Error",
          message: "Cantidad debe ser mayor a 0",
        });
        return false;
      }

      try {
        setIsLoading(true);
        await mintTree(account.address, amount);

        // Refresh balance after successful mint
        await refreshBalance();

        showNotification({
          type: "success",
          title: "¡Árbol plantado exitosamente!",
          duration: 2000,
        });

        return true;
      } catch (error) {
        console.error("Error minting tree:", error);
        showNotification({
          type: "error",
          title: "Error",
          message: "No se pudo plantar el árbol",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account?.address, showNotification, refreshBalance]
  );

  const claimReward = useCallback(async () => {
    if (!account?.address) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Wallet no conectada",
      });
      return false;
    }

    try {
      setIsLoading(true);
      await reclaimReward(account.address);

      // Refresh both balance and claim status
      await Promise.all([refreshBalance(), refreshClaimStatus()]);

      showNotification({
        type: "success",
        title: "Recompensa reclamada exitosamente",
      });

      return true;
    } catch (error) {
      console.error("Error claiming reward:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo reclamar la recompensa",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, showNotification, refreshBalance, refreshClaimStatus]);

  return {
    isLoading,
    mintNewTree,
    claimReward,
  };
}
