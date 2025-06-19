import { useEffect, useRef } from "react";
import { useContractEvents, useActiveAccount } from "thirdweb/react";
import { prepareEvent } from "thirdweb";
import { UserRegistryContract } from "@/constants/thirdweb";

interface UserRegistryEventsHookProps {
  onFriendRequestSent?: (from: string, to: string) => void;
  onFriendRequestAccepted?: (from: string, to: string) => void;
  onFriendRequestCancelled?: (from: string, to: string) => void;
  onFriendAdded?: (user1: string, user2: string) => void;
  onFriendRemoved?: (user1: string, user2: string) => void;
}

export function useUserRegistryEvents({
  onFriendRequestSent,
  onFriendRequestAccepted,
  onFriendRequestCancelled,
  onFriendAdded,
  onFriendRemoved,
}: UserRegistryEventsHookProps = {}) {
  const activeAccount = useActiveAccount();
  const userAddress = activeAccount?.address?.toLowerCase() || "";

  // Referencias para rastrear eventos ya procesados
  const processedEvents = useRef(new Set<string>());
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

  // Escuchar eventos del UserRegistry
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

  // Procesar solo eventos nuevos
  useEffect(() => {
    if (!userRegistryEvents || userRegistryEvents.length === 0) return;

    // Solo procesar si hay nuevos eventos
    if (userRegistryEvents.length <= lastEventCount.current) return;

    // Procesar solo los eventos más recientes (últimos 5 minutos)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Procesar solo eventos nuevos (que no hemos visto antes)
    const newEvents = userRegistryEvents.slice(lastEventCount.current);

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

      switch (event.eventName) {
        case "FriendRequestSent":
          {
            const { from, to } = event.args as {
              from: string;
              to: string;
            };

            if (onFriendRequestSent && from && to) {
              onFriendRequestSent(from, to);
            }
          }
          break;

        case "FriendRequestAccepted":
          {
            const { from, to } = event.args as {
              from: string;
              to: string;
            };

            if (onFriendRequestAccepted && from && to) {
              onFriendRequestAccepted(from, to);
            }
          }
          break;

        case "FriendRequestCancelled":
          {
            const { from, to } = event.args as {
              from: string;
              to: string;
            };

            if (onFriendRequestCancelled && from && to) {
              onFriendRequestCancelled(from, to);
            }
          }
          break;

        case "FriendAdded":
          {
            const { user1, user2 } = event.args as {
              user1: string;
              user2: string;
            };

            if (onFriendAdded && user1 && user2) {
              onFriendAdded(user1, user2);
            }
          }
          break;

        case "FriendRemoved":
          {
            const { user1, user2 } = event.args as {
              user1: string;
              user2: string;
            };

            if (onFriendRemoved && user1 && user2) {
              onFriendRemoved(user1, user2);
            }
          }
          break;
      }
    });

    // Actualizar contador de eventos procesados
    lastEventCount.current = userRegistryEvents.length;

    // Limpiar eventos antiguos del Set para evitar memory leaks
    if (processedEvents.current.size > 100) {
      const eventsArray = Array.from(processedEvents.current);
      processedEvents.current = new Set(eventsArray.slice(-50)); // Mantener solo los últimos 50
    }
  }, [
    userRegistryEvents,
    onFriendRequestSent,
    onFriendRequestAccepted,
    onFriendRequestCancelled,
    onFriendAdded,
    onFriendRemoved,
  ]);

  return {
    userRegistryEvents,
    userAddress,
  };
}
