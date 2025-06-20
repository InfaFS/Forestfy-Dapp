// Internal event emitter for app-wide communication without circular dependencies
export type AppEvent =
  | {
      type: "MARKETPLACE_EVENT";
      data: {
        eventType: "NFTListed" | "NFTUnlisted" | "NFTSold";
        tokenId: string;
        seller: string;
        buyer?: string;
        price: string;
        timestamp?: number;
      };
    }
  | {
      type: "USER_REGISTRY_EVENT";
      data: {
        eventType:
          | "FriendRequestSent"
          | "FriendRequestAccepted"
          | "FriendRequestCancelled"
          | "FriendAdded"
          | "FriendRemoved";
        from?: string;
        to?: string;
        user1?: string;
        user2?: string;
        timestamp?: number;
      };
    };

type EventListener = (event: AppEvent) => void;

class AppEventEmitter {
  private listeners: EventListener[] = [];
  private processedEvents = new Set<string>();

  subscribe(listener: EventListener) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(event: AppEvent) {
    // Generate unique key for deduplication
    const eventKey = this.generateEventKey(event);

    // Check for duplicates
    if (this.processedEvents.has(eventKey)) {
      console.log("🔄 Event already processed, skipping duplicate:", eventKey);
      return;
    }

    // Mark as processed
    this.processedEvents.add(eventKey);

    // Emit to all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });

    // Auto-cleanup old events to prevent memory leaks
    if (this.processedEvents.size > 1000) {
      const eventsArray = Array.from(this.processedEvents);
      const keepCount = Math.floor(eventsArray.length / 2);
      this.processedEvents = new Set(eventsArray.slice(-keepCount));
    }
  }

  private generateEventKey(event: AppEvent): string {
    switch (event.type) {
      case "MARKETPLACE_EVENT":
        return `marketplace-${event.data.eventType}-${event.data.tokenId}-${
          event.data.seller
        }-${event.data.buyer || ""}-${event.data.price}`;
      case "USER_REGISTRY_EVENT":
        return `user-registry-${event.data.eventType}-${
          event.data.from || ""
        }-${event.data.to || ""}-${event.data.user1 || ""}-${
          event.data.user2 || ""
        }`;
      default:
        return `unknown-${Date.now()}`;
    }
  }

  // Clear processed events (useful for testing or manual cleanup)
  clearProcessedEvents() {
    this.processedEvents.clear();
  }

  // Get processed events count (for debugging)
  getProcessedEventsCount() {
    return this.processedEvents.size;
  }
}

// Global singleton instance
export const appEventEmitter = new AppEventEmitter();
