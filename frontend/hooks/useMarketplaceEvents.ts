import { useEffect, useRef } from "react";
import { useContractEvents, useActiveAccount } from "thirdweb/react";
import { prepareEvent } from "thirdweb";
import { MarketplaceContract } from "@/constants/thirdweb";

interface MarketplaceEventsHookProps {
  onNFTListed?: (tokenId: string, seller: string, price: string) => void;
  onNFTUnlisted?: (tokenId: string, seller: string) => void;
  onNFTSold?: (
    tokenId: string,
    seller: string,
    buyer: string,
    price: string
  ) => void;
}

export function useMarketplaceEvents({
  onNFTListed,
  onNFTUnlisted,
  onNFTSold,
}: MarketplaceEventsHookProps = {}) {
  const activeAccount = useActiveAccount();
  const userAddress = activeAccount?.address?.toLowerCase() || "";

  // Referencias para rastrear eventos ya procesados y tiempo de inicio
  const processedEvents = useRef(new Set<string>());
  const startTime = useRef(Date.now());
  const lastEventCount = useRef(0);

  // Preparar eventos
  const nftListedEvent = prepareEvent({
    signature:
      "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 timestamp)",
  });

  const nftUnlistedEvent = prepareEvent({
    signature:
      "event NFTUnlisted(uint256 indexed tokenId, address indexed seller, uint256 timestamp)",
  });

  const nftSoldEvent = prepareEvent({
    signature:
      "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 fee, uint256 timestamp)",
  });

  // Escuchar eventos del marketplace
  const { data: marketplaceEvents } = useContractEvents({
    contract: MarketplaceContract,
    events: [nftListedEvent, nftUnlistedEvent, nftSoldEvent],
  });

  // Procesar solo eventos nuevos
  useEffect(() => {
    if (!marketplaceEvents || marketplaceEvents.length === 0) return;

    // Solo procesar si hay nuevos eventos
    if (marketplaceEvents.length <= lastEventCount.current) return;

    // Procesar solo los eventos más recientes (últimos 5 minutos)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Procesar solo eventos nuevos (que no hemos visto antes)
    const newEvents = marketplaceEvents.slice(lastEventCount.current);

    newEvents.forEach((event) => {
      // Crear ID único para el evento
      const eventId = `${event.eventName}-${event.transactionHash}-${event.logIndex}`;

      // Skip si ya procesamos este evento
      if (processedEvents.current.has(eventId)) return;

      // Verificar que el evento sea reciente (timestamp del blockchain)
      const eventTimestamp = event.args?.timestamp
        ? Number(event.args.timestamp) * 1000
        : Date.now();
      if (eventTimestamp < fiveMinutesAgo) return;

      // Marcar como procesado
      processedEvents.current.add(eventId);

      console.log("🔥 Processing New Event:", event.eventName, eventId);

      switch (event.eventName) {
        case "NFTListed":
          {
            const { tokenId, seller, price } = event.args as {
              tokenId: bigint;
              seller: string;
              price: bigint;
            };

            console.log("🆕 NFT Listed:", {
              tokenId: tokenId?.toString(),
              seller,
              price: price?.toString(),
            });

            if (onNFTListed && tokenId && seller && price) {
              onNFTListed(
                tokenId.toString(),
                seller,
                (Number(price) / 1e18).toFixed(2)
              );
            }
          }
          break;

        case "NFTUnlisted":
          {
            const { tokenId, seller } = event.args as {
              tokenId: bigint;
              seller: string;
            };

            console.log("🗑️ NFT Unlisted:", {
              tokenId: tokenId?.toString(),
              seller,
            });

            if (onNFTUnlisted && tokenId && seller) {
              onNFTUnlisted(tokenId.toString(), seller);
            }
          }
          break;

        case "NFTSold":
          {
            const { tokenId, seller, buyer, price } = event.args as {
              tokenId: bigint;
              seller: string;
              buyer: string;
              price: bigint;
            };

            console.log("💰 NFT Sold:", {
              tokenId: tokenId?.toString(),
              seller,
              buyer,
              price: price?.toString(),
            });

            if (onNFTSold && tokenId && seller && buyer && price) {
              onNFTSold(
                tokenId.toString(),
                seller,
                buyer,
                (Number(price) / 1e18).toFixed(2)
              );
            }
          }
          break;
      }
    });

    // Actualizar contador de eventos procesados
    lastEventCount.current = marketplaceEvents.length;

    // Limpiar eventos antiguos del Set para evitar memory leaks
    if (processedEvents.current.size > 100) {
      const eventsArray = Array.from(processedEvents.current);
      processedEvents.current = new Set(eventsArray.slice(-50)); // Mantener solo los últimos 50
    }
  }, [marketplaceEvents, onNFTListed, onNFTUnlisted, onNFTSold]);

  return {
    marketplaceEvents,
    userAddress,
  };
}
