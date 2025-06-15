import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useMarketplaceEvents } from "./useMarketplaceEvents";
import { useWallet } from "@/contexts/WalletContext";
import { useTrees } from "@/contexts/TreesContext";
import { useMarketplace } from "@/contexts/MarketplaceContext";
import {
  NOTIFICATION_STYLES,
  NOTIFICATION_MESSAGES,
} from "@/constants/NotificationStyles";

export function useGlobalSaleNotifications() {
  const activeAccount = useActiveAccount();
  const { showNotification } = useNotifications();
  const { refreshBalance } = useWallet();
  const { triggerRefresh: triggerTreesRefresh } = useTrees();
  const { triggerRefresh: triggerMarketplaceRefresh } = useMarketplace();

  const userAddress = activeAccount?.address?.toLowerCase();

  console.log("🔔 Global Sale Notifications Hook - User:", userAddress);

  // Hook para escuchar solo eventos de venta
  useMarketplaceEvents({
    onNFTSold: async (tokenId, seller, buyer, price) => {
      console.log("🔥 NFT SOLD EVENT DETECTED:", {
        tokenId,
        seller: seller.toLowerCase(),
        buyer: buyer.toLowerCase(),
        price,
        userAddress,
      });

      // Siempre mostrar notificación cuando el usuario venda un NFT
      if (userAddress && seller.toLowerCase() === userAddress) {
        console.log("✅ SHOWING SALE NOTIFICATION for user");
        showNotification({
          type: "success",
          title: NOTIFICATION_MESSAGES.nftSold.title,
          message: NOTIFICATION_MESSAGES.nftSold.getMessage(tokenId, price),
          duration: 0, // No auto-hide, requiere dismiss manual
          onDismiss: async () => {
            console.log(
              "💰 User dismissed sale notification, refreshing balance and data..."
            );
            // Pequeño delay para asegurar que la transacción se haya confirmado
            setTimeout(async () => {
              try {
                await refreshBalance();
                triggerTreesRefresh();
                triggerMarketplaceRefresh();
                console.log("✅ Data refreshed after user confirmed NFT sale");
              } catch (error) {
                console.error(
                  "Error refreshing data after NFT sale confirmation:",
                  error
                );
              }
            }, 1000); // 1 segundo de delay
          },
        });
      }

      // No refrescar datos automáticamente cuando compres un NFT
      // Los datos se refrescarán cuando el usuario haga clic en "Aceptar" en la notificación de success
      if (userAddress && buyer.toLowerCase() === userAddress) {
        console.log(
          "🛒 User bought NFT, but not refreshing data automatically"
        );
      }
    },
  });
}
