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
  });

  // Escuchar eventos del marketplace específicos del usuario
  useMarketplaceEvents({
    onNFTListed: (tokenId, seller, price) => {
      // Solo refetch si el evento es del usuario actual
      if (seller.toLowerCase() === address.toLowerCase()) {
        console.log(`🆕 User Listed NFT: #${tokenId} for ${price} FTK`);
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
    },
    onNFTUnlisted: (tokenId, seller) => {
      // Solo refetch si el evento es del usuario actual
      if (seller.toLowerCase() === address.toLowerCase()) {
        console.log(`🗑️ User Unlisted NFT: #${tokenId}`);
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
    },
    onNFTSold: (tokenId, seller, buyer, price) => {
      // Solo refetch si el usuario vendió un NFT (no si compró)
      if (seller.toLowerCase() === address.toLowerCase()) {
        console.log(`💰 User sold NFT: #${tokenId} for ${price} FTK`);
        setTimeout(() => {
          refetchUserNFTs();
        }, 2000);
      }
      // No refetch automático cuando el usuario compra, se hará manualmente
      else if (buyer.toLowerCase() === address.toLowerCase()) {
        console.log(
          `🛒 User bought NFT: #${tokenId} for ${price} FTK, but not auto-refreshing`
        );
      }
    },
  });

  // Refetch automático cada 10 segundos para mantener datos actualizados como backup
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      refetchUserNFTs();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [address, refetchUserNFTs]);

  return {
    address,
    userNFTsWithListingData,
    refetchUserNFTs,
    isLoading,
  };
}
