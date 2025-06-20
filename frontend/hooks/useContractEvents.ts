import { useCallback, useState, useRef } from "react";
import { BaseContractEvent, EventProcessorConfig } from "../types/events";

// Default configuration
const DEFAULT_CONFIG: EventProcessorConfig = {
  recentTimeWindow: 30000, // 30 seconds
  maxProcessedEvents: 1000,
  autoCleanup: true,
};

interface EventState<T extends BaseContractEvent> {
  processedEvents: Set<string>;
  recentEvents: T[];
}

/**
 * Simplified event processor hook for use with thirdweb's useContractEvents
 * This hook processes events that are already being listened to by thirdweb
 */
export function useContractEvents<T extends BaseContractEvent>({
  onEvent,
  filter,
  config = DEFAULT_CONFIG,
  enabled = true,
}: {
  onEvent?: (event: T) => void | Promise<void>;
  filter?: (event: T) => boolean;
  config?: EventProcessorConfig;
  enabled?: boolean;
}) {
  const [state, setState] = useState<EventState<T>>({
    processedEvents: new Set(),
    recentEvents: [],
  });

  // Use refs to maintain stable references
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  // Generate unique event key for deduplication
  const generateEventKey = useCallback((event: T): string => {
    return `${event.eventName}-${event.transactionHash}-${event.logIndex}`;
  }, []);

  // Check if event was already processed
  const isEventProcessed = useCallback(
    (event: T): boolean => {
      const key = generateEventKey(event);
      return state.processedEvents.has(key);
    },
    [state.processedEvents, generateEventKey]
  );

  // Mark event as processed
  const markEventAsProcessed = useCallback(
    (event: T) => {
      const key = generateEventKey(event);
      setState((prevState) => ({
        ...prevState,
        processedEvents: new Set([...prevState.processedEvents, key]),
      }));
    },
    [generateEventKey]
  );

  // Add event to recent events with timestamp
  const addToRecentEvents = useCallback((event: T) => {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    setState((prevState) => {
      const newRecentEvents = [...prevState.recentEvents, eventWithTimestamp];

      // Auto-cleanup if enabled
      if (configRef.current.autoCleanup) {
        const cutoffTime =
          Date.now() - (configRef.current.recentTimeWindow || 30000);
        const filteredEvents = newRecentEvents.filter(
          (e) => (e.timestamp || 0) > cutoffTime
        );

        // Also cleanup processed events if we have too many
        let newProcessedEvents = prevState.processedEvents;
        if (
          newProcessedEvents.size >
          (configRef.current.maxProcessedEvents || 1000)
        ) {
          // Keep only the most recent half
          const eventsArray = Array.from(newProcessedEvents);
          const keepCount = Math.floor(eventsArray.length / 2);
          newProcessedEvents = new Set(eventsArray.slice(-keepCount));
        }

        return {
          ...prevState,
          recentEvents: filteredEvents,
          processedEvents: newProcessedEvents,
        };
      }

      return {
        ...prevState,
        recentEvents: newRecentEvents,
      };
    });
  }, []);

  // Process a single event - to be called by the consuming hook
  const processEvent = useCallback(
    async (rawEvent: any, eventName: string) => {
      if (!enabled) return;

      try {
        // Transform raw event to our format
        const event: T = {
          eventName,
          transactionHash: rawEvent.transactionHash || "",
          logIndex: rawEvent.logIndex || 0,
          args: rawEvent.args || rawEvent,
          timestamp: Date.now(),
        } as T;

        // Skip if already processed
        if (isEventProcessed(event)) {
          return;
        }

        // Apply filter if provided
        if (filter && !filter(event)) {
          return;
        }

        // Mark as processed
        markEventAsProcessed(event);

        // Add to recent events
        addToRecentEvents(event);

        // Call event handler if provided
        if (onEvent) {
          await onEvent(event);
        }
      } catch (error) {
        console.error(`Error processing ${eventName} event:`, error);
      }
    },
    [
      enabled,
      isEventProcessed,
      filter,
      markEventAsProcessed,
      addToRecentEvents,
      onEvent,
    ]
  );

  // Public API
  return {
    // State
    recentEvents: state.recentEvents,
    processedEventsCount: state.processedEvents.size,

    // Main processing method - to be called by consuming hooks
    processEvent,

    // Methods
    clearRecentEvents: () =>
      setState((prevState) => ({
        ...prevState,
        recentEvents: [],
      })),
    clearProcessedEvents: () =>
      setState((prevState) => ({
        ...prevState,
        processedEvents: new Set(),
      })),

    // Utilities
    getRecentEventsByType: (eventName: string) =>
      state.recentEvents.filter((event) => event.eventName === eventName),
    getRecentEventsInTimeWindow: (windowMs: number) => {
      const cutoff = Date.now() - windowMs;
      return state.recentEvents.filter(
        (event) => (event.timestamp || 0) > cutoff
      );
    },
  };
}
