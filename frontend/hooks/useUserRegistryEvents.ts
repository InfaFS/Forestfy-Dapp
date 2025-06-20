import { useEffect, useRef } from "react";
import { useContractEvents, useActiveAccount } from "thirdweb/react";
import { prepareEvent } from "thirdweb";
import { UserRegistryContract } from "@/constants/thirdweb";
import { useContractEvents as useEventProcessor } from "./useContractEvents";
import { AllUserRegistryEvents } from "../types/events";
import { appEventEmitter } from "../utils/eventEmitter";

interface UserRegistryEventsHookProps {
  onFriendRequestSent?: (from: string, to: string) => void;
  onFriendRequestAccepted?: (from: string, to: string) => void;
  onFriendRequestCancelled?: (from: string, to: string) => void;
  onFriendAdded?: (user1: string, user2: string) => void;
  onFriendRemoved?: (user1: string, user2: string) => void;
  enabled?: boolean;
}

export function useUserRegistryEvents({
  onFriendRequestSent,
  onFriendRequestAccepted,
  onFriendRequestCancelled,
  onFriendAdded,
  onFriendRemoved,
  enabled = true,
}: UserRegistryEventsHookProps = {}) {
  const activeAccount = useActiveAccount();
  const userAddress = activeAccount?.address?.toLowerCase() || "";
  const lastEventCount = useRef(0);

  // Preparar eventos del UserRegistry
  const friendRequestSentEvent = prepareEvent({
    signature:
      "event FriendRequestSent(address indexed from, address indexed to, uint256 timestamp)",
  });

  const friendRequestAcceptedEvent = prepareEvent({
    signature:
      "event FriendRequestAccepted(address indexed from, address indexed to, uint256 timestamp)",
  });

  const friendRequestCancelledEvent = prepareEvent({
    signature:
      "event FriendRequestCancelled(address indexed from, address indexed to, uint256 timestamp)",
  });

  const friendAddedEvent = prepareEvent({
    signature:
      "event FriendAdded(address indexed user1, address indexed user2, uint256 timestamp)",
  });

  const friendRemovedEvent = prepareEvent({
    signature:
      "event FriendRemoved(address indexed user1, address indexed user2, uint256 timestamp)",
  });

  // Initialize event processor
  const eventProcessor = useEventProcessor({
    onEvent: async (event: AllUserRegistryEvents) => {
      console.log(`UserRegistry Event: ${event.eventName}`, event);

      switch (event.eventName) {
        case "FriendRequestSent":
          {
            const { from, to } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "USER_REGISTRY_EVENT",
              data: {
                eventType: "FriendRequestSent",
                from,
                to,
              },
            });

            if (onFriendRequestSent && from && to) {
              onFriendRequestSent(from, to);
            }
          }
          break;

        case "FriendRequestAccepted":
          {
            const { from, to } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "USER_REGISTRY_EVENT",
              data: {
                eventType: "FriendRequestAccepted",
                from,
                to,
              },
            });

            if (onFriendRequestAccepted && from && to) {
              onFriendRequestAccepted(from, to);
            }
          }
          break;

        case "FriendRequestCancelled":
          {
            const { from, to } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "USER_REGISTRY_EVENT",
              data: {
                eventType: "FriendRequestCancelled",
                from,
                to,
              },
            });

            if (onFriendRequestCancelled && from && to) {
              onFriendRequestCancelled(from, to);
            }
          }
          break;

        case "FriendAdded":
          {
            const { user1, user2 } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "USER_REGISTRY_EVENT",
              data: {
                eventType: "FriendAdded",
                user1,
                user2,
              },
            });

            if (onFriendAdded && user1 && user2) {
              onFriendAdded(user1, user2);
            }
          }
          break;

        case "FriendRemoved":
          {
            const { user1, user2 } = event.args;

            // Emit internal event for NotificationContext to handle
            appEventEmitter.emit({
              type: "USER_REGISTRY_EVENT",
              data: {
                eventType: "FriendRemoved",
                user1,
                user2,
              },
            });

            if (onFriendRemoved && user1 && user2) {
              onFriendRemoved(user1, user2);
            }
          }
          break;

        default:
          console.warn("Unknown UserRegistry event:", (event as any).eventName);
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
  const { data: userRegistryEvents } = useContractEvents({
    contract: UserRegistryContract,
    events: [
      friendRequestSentEvent,
      friendRequestAcceptedEvent,
      friendRequestCancelledEvent,
      friendAddedEvent,
      friendRemovedEvent,
    ],
  });

  // Process new events
  useEffect(() => {
    if (!userRegistryEvents || userRegistryEvents.length === 0) return;

    // Only process if there are new events
    if (userRegistryEvents.length <= lastEventCount.current) return;

    // Process only new events (that we haven't seen before)
    const newEvents = userRegistryEvents.slice(lastEventCount.current);

    newEvents.forEach((event) => {
      switch (event.eventName) {
        case "FriendRequestSent":
          eventProcessor.processEvent(event, "FriendRequestSent");
          break;
        case "FriendRequestAccepted":
          eventProcessor.processEvent(event, "FriendRequestAccepted");
          break;
        case "FriendRequestCancelled":
          eventProcessor.processEvent(event, "FriendRequestCancelled");
          break;
        case "FriendAdded":
          eventProcessor.processEvent(event, "FriendAdded");
          break;
        case "FriendRemoved":
          eventProcessor.processEvent(event, "FriendRemoved");
          break;
      }
    });

    // Update processed count
    lastEventCount.current = userRegistryEvents.length;
  }, [userRegistryEvents, eventProcessor.processEvent]);

  return {
    // Backward compatibility
    userRegistryEvents: eventProcessor.recentEvents,
    userAddress,

    // New functionality
    ...eventProcessor,
  };
}
