import { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { MarketplaceContract } from "@/constants/thirdweb";
import { useMarketplaceEvents } from "./useMarketplaceEvents";

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
}

export function useMarketplaceListing(
  tokenId: bigint,
  options?: { disableAutoRefresh?: boolean }
) {
  const [listing, setListing] = useState<Listing | null>(null);

  // Obtener detalles del listing
  const { data: listingData, refetch: refetchListing } = useReadContract({
    contract: MarketplaceContract,
    method:
      "function getListing(uint256 tokenId) view returns ((uint256 tokenId, address seller, uint256 price, bool isActive, uint256 listedAt))",
    params: [tokenId],
  });

  useEffect(() => {
    if (listingData) {
      console.log(
        "📦 Listing data received for token",
        tokenId.toString(),
        ":",
        listingData
      );
      const listing = listingData as {
        tokenId: bigint;
        seller: string;
        price: bigint;
        isActive: boolean;
        listedAt: bigint;
      };
      console.log("✅ Processed listing for token", tokenId.toString(), ":", {
        ...listing,
        tokenId: listing.tokenId.toString(),
        price: listing.price.toString(),
        listedAt: listing.listedAt.toString(),
        isActive: listing.isActive,
      });

      // Log especial si el listing no está activo
      if (!listing.isActive) {
        console.log(
          "❌ LISTING NOT ACTIVE for token",
          tokenId.toString(),
          "- this will show error page"
        );
      }

      setListing(listing);
    } else {
      console.log("❌ No listing data for token:", tokenId.toString());
    }
  }, [listingData, tokenId]);

  // Refetch automático cada 15 segundos solo si no está deshabilitado
  useEffect(() => {
    if (options?.disableAutoRefresh) {
      console.log("Auto refresh disabled for token:", tokenId.toString());
      return;
    }

    const interval = setInterval(() => {
      refetchListing();
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [refetchListing, options?.disableAutoRefresh, tokenId]);

  return {
    listing,
    listingData,
    refetchListing,
  };
}

export function useActiveListings() {
  // Obtener IDs de los NFTs listados activos
  const {
    data: activeListingIds,
    isPending: loadingIds,
    refetch: refetchIds,
  } = useReadContract({
    contract: MarketplaceContract,
    method: "function getActiveListings() view returns (uint256[] memory)",
    params: [],
  });

  // Escuchar eventos del marketplace para refetch automático
  useMarketplaceEvents({
    onNFTListed: (tokenId, seller, price) => {
      console.log(
        `🆕 New NFT Listed: #${tokenId} by ${seller} for ${price} FTK`
      );
      // Refetch la lista después de un pequeño delay para asegurar que la transacción se haya procesado
      setTimeout(() => {
        refetchIds();
      }, 2000);
    },
    onNFTUnlisted: (tokenId, seller) => {
      console.log(`🗑️ NFT Unlisted: #${tokenId} by ${seller}`);
      // Refetch la lista después de un pequeño delay
      setTimeout(() => {
        refetchIds();
      }, 2000);
    },
    onNFTSold: (tokenId, seller, buyer, price) => {
      console.log(
        `💰 NFT Sold: #${tokenId} from ${seller} to ${buyer} for ${price} FTK`
      );
      // No hacer refetch automático inmediato para evitar interferir con la notificación de success
      // El refresh se hará cuando el usuario regrese al marketplace
    },
  });

  // Refetch automático cada 15 segundos para mantener datos actualizados como backup
  useEffect(() => {
    const interval = setInterval(() => {
      refetchIds();
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [refetchIds]);

  return {
    activeListingIds,
    loadingIds,
    refetchIds,
  };
}
