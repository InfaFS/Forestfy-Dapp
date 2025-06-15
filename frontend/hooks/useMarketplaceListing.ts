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
    queryOptions: {
      enabled: !!tokenId,
    },
  });

  useEffect(() => {
    if (listingData) {
      const listing = listingData as {
        tokenId: bigint;
        seller: string;
        price: bigint;
        isActive: boolean;
        listedAt: bigint;
      };

      setListing(listing);
    }
  }, [listingData, tokenId]);

  // Refetch automático cada 60 segundos solo si no está deshabilitado
  useEffect(() => {
    if (options?.disableAutoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      refetchListing();
    }, 60000); // Aumentado a 60 segundos

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
    queryOptions: {
      enabled: true,
    },
  });

  // Escuchar eventos del marketplace para refetch automático
  useMarketplaceEvents({
    onNFTListed: (tokenId, seller, price) => {
      // Refetch la lista después de un pequeño delay para asegurar que la transacción se haya procesado
      setTimeout(() => {
        refetchIds();
      }, 2000);
    },
    onNFTUnlisted: (tokenId, seller) => {
      // Refetch la lista después de un pequeño delay
      setTimeout(() => {
        refetchIds();
      }, 2000);
    },
    onNFTSold: (tokenId, seller, buyer, price) => {
      // No hacer refetch automático inmediato para evitar interferir con la notificación de success
      // El refresh se hará cuando el usuario regrese al marketplace
    },
  });

  // Refetch automático cada 90 segundos para mantener datos actualizados como backup
  useEffect(() => {
    const interval = setInterval(() => {
      refetchIds();
    }, 90000); // Aumentado a 90 segundos

    return () => clearInterval(interval);
  }, [refetchIds]);

  return {
    activeListingIds,
    loadingIds,
    refetchIds,
  };
}
