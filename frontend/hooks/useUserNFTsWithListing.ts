import { useEffect } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { MarketplaceContract } from "@/constants/thirdweb";
import { useMarketplaceEvents } from "./useMarketplaceEvents";

export function useUserNFTsWithListing() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address || "";

  // Obtener datos completos de NFTs con estado de listado usando el marketplace
  const {
    data: userNFTsWithListingData,
    refetch: refetchUserNFTs,
    isPending: isLoading,
  } = useReadContract({
    contract: MarketplaceContract,
    method:
      "function getUserNFTsWithListingStatus(address user) view returns (uint256[] tokenIds, bool[] isListedArray, uint256[] prices)",
    params: [address],
    queryOptions: {
      enabled: !!address,
    },
  });

  // Escuchar eventos del marketplace específicos del usuario
  useMarketplaceEvents({
    onNFTListed: (tokenId, seller, price) => {
      // Solo refetch si el evento es del usuario actual
      if (seller.toLowerCase() === address.toLowerCase()) {
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
    },
    onNFTUnlisted: (tokenId, seller) => {
      // Solo refetch si el evento es del usuario actual
      if (seller.toLowerCase() === address.toLowerCase()) {
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
    },
    onNFTSold: (tokenId, seller, buyer, price) => {
      // Solo refetch si el usuario vendió un NFT (no si compró)
      if (seller.toLowerCase() === address.toLowerCase()) {
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
      // No refetch automático cuando el usuario compra, se hará manualmente
    },
  });

  // Refetch automático cada 120 segundos para mantener datos actualizados como backup
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      refetchUserNFTs();
    }, 120000); // Aumentado a 120 segundos (2 minutos)

    return () => clearInterval(interval);
  }, [address, refetchUserNFTs]);

  return {
    address,
    userNFTsWithListingData,
    refetchUserNFTs,
    isLoading,
  };
}
