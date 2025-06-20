import { useCallback, useEffect, useRef } from "react";
import { useActiveAccount, useContractEvents } from "thirdweb/react";
import { prepareEvent } from "thirdweb";
import { MarketplaceContract } from "@/constants/thirdweb";
import { useContractEvents as useEventProcessor } from "./useContractEvents";
import { AllMarketplaceEvents } from "../types/events";
import { appEventEmitter } from "../utils/eventEmitter";

interface MarketplaceEventsHookProps {
  onNFTListed?: (tokenId: string, seller: string, price: string) => void;
  onNFTUnlisted?: (tokenId: string, seller: string) => void;
  onNFTSold?: (
    tokenId: string,
    seller: string,
    buyer: string,
    price: string
  ) => void;
  enabled?: boolean;
}

export function useMarketplaceEvents({
  onNFTListed,
  onNFTUnlisted,
  onNFTSold,
  enabled = true,
}: MarketplaceEventsHookProps = {}) {
  const activeAccount = useActiveAccount();
  const userAddress = activeAccount?.address?.toLowerCase() || "";
  const lastEventCount = useRef(0);

  // Prepare events for thirdweb
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

  // Initialize event processor
  const eventProcessor = useEventProcessor({
    onEvent: async (event: AllMarketplaceEvents) => {
      console.log(`Marketplace Event: ${event.eventName}`, event);

      switch (event.eventName) {
        case "NFTListed":
          {
            const { tokenId, seller, price } = event.args;
            const formattedPrice = (Number(price) / 1e18).toFixed(2);

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "MARKETPLACE_EVENT",
              data: {
                eventType: "NFTListed",
                tokenId: tokenId.toString(),
                seller,
                price: formattedPrice,
              },
            });

            if (onNFTListed && tokenId && seller && price) {
              onNFTListed(tokenId.toString(), seller, formattedPrice);
            }
          }
          break;

        case "NFTUnlisted":
          {
            const { tokenId, seller } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "MARKETPLACE_EVENT",
              data: {
                eventType: "NFTUnlisted",
                tokenId: tokenId.toString(),
                seller,
                price: "0", // Not applicable for unlisted
              },
            });

            if (onNFTUnlisted && tokenId && seller) {
              onNFTUnlisted(tokenId.toString(), seller);
            }
          }
          break;

        case "NFTSold":
          {
            const { tokenId, seller, buyer, price, timestamp } = event.args;
            const formattedPrice = (Number(price) / 1e18).toFixed(2);

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "MARKETPLACE_EVENT",
              data: {
                eventType: "NFTSold",
                tokenId: tokenId.toString(),
                seller,
                buyer,
                price: formattedPrice,
                timestamp: timestamp ? Number(timestamp) : undefined,
              },
            });

            if (onNFTSold && tokenId && seller && buyer && price) {
              onNFTSold(tokenId.toString(), seller, buyer, formattedPrice);
            }
          }
          break;

        default:
          console.warn("Unknown marketplace event:", (event as any).eventName);
      }
    },
    enabled,
    config: {
      recentTimeWindow: 300000, // 5 minutes
      maxProcessedEvents: 500,
      autoCleanup: true,
    },
  });

  // Listen to thirdweb events
  const { data: marketplaceEvents } = useContractEvents({
    contract: MarketplaceContract,
    events: [nftListedEvent, nftUnlistedEvent, nftSoldEvent],
  });

  // Process new events
  useEffect(() => {
    if (!marketplaceEvents || marketplaceEvents.length === 0) return;

    // Only process if there are new events
    if (marketplaceEvents.length <= lastEventCount.current) return;

    // Process only new events (that we haven't seen before)
    const newEvents = marketplaceEvents.slice(lastEventCount.current);

    newEvents.forEach((event) => {
      switch (event.eventName) {
        case "NFTListed":
          eventProcessor.processEvent(event, "NFTListed");
          break;
        case "NFTUnlisted":
          eventProcessor.processEvent(event, "NFTUnlisted");
          break;
        case "NFTSold":
          eventProcessor.processEvent(event, "NFTSold");
          break;
      }
    });

    // Update processed count
    lastEventCount.current = marketplaceEvents.length;
  }, [marketplaceEvents, eventProcessor.processEvent]);

  return {
    // Backward compatibility
    marketplaceEvents: eventProcessor.recentEvents,
    userAddress,

    // New functionality
    ...eventProcessor,
  };
}
