// Base event types
export interface BaseContractEvent {
  eventName: string;
  transactionHash: string;
  logIndex: number;
  args: Record<string, any>;
  timestamp?: number;
}

// Event processing configuration
export interface EventProcessorConfig {
  /** Time window for considering events as recent (in milliseconds) */
  recentTimeWindow?: number;
  /** Maximum number of processed events to keep in memory */
  maxProcessedEvents?: number;
  /** Whether to auto-cleanup old processed events */
  autoCleanup?: boolean;
}

// Event filter function type
export type EventFilter<T extends BaseContractEvent> = (event: T) => boolean;

// Event handler function type
export type EventHandler<T extends BaseContractEvent> = (
  event: T
) => void | Promise<void>;

// Event processor hook configuration
export interface UseContractEventsConfig<T extends BaseContractEvent> {
  /** Contract to listen to */
  contract: any;
  /** Events to listen for */
  events: any[];
  /** Event handler function */
  onEvent?: EventHandler<T>;
  /** Optional filter to apply to events */
  filter?: EventFilter<T>;
  /** Processing configuration */
  config?: EventProcessorConfig;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

// Marketplace specific event types
export interface MarketplaceEvent extends BaseContractEvent {
  eventName: "NFTListed" | "NFTUnlisted" | "NFTSold";
}

export interface NFTListedEvent extends MarketplaceEvent {
  eventName: "NFTListed";
  args: {
    tokenId: bigint;
    seller: string;
    price: bigint;
    timestamp: bigint;
  };
}

export interface NFTUnlistedEvent extends MarketplaceEvent {
  eventName: "NFTUnlisted";
  args: {
    tokenId: bigint;
    seller: string;
    timestamp: bigint;
  };
}

export interface NFTSoldEvent extends MarketplaceEvent {
  eventName: "NFTSold";
  args: {
    tokenId: bigint;
    seller: string;
    buyer: string;
    price: bigint;
    fee: bigint;
    timestamp: bigint;
  };
}

// User Registry specific event types
export interface UserRegistryEvent extends BaseContractEvent {
  eventName:
    | "FriendRequestSent"
    | "FriendRequestAccepted"
    | "FriendRequestCancelled"
    | "FriendAdded"
    | "FriendRemoved";
}

export interface FriendRequestSentEvent extends UserRegistryEvent {
  eventName: "FriendRequestSent";
  args: {
    from: string;
    to: string;
    timestamp: bigint;
  };
}

export interface FriendRequestAcceptedEvent extends UserRegistryEvent {
  eventName: "FriendRequestAccepted";
  args: {
    from: string;
    to: string;
    timestamp: bigint;
  };
}

export interface FriendRequestCancelledEvent extends UserRegistryEvent {
  eventName: "FriendRequestCancelled";
  args: {
    from: string;
    to: string;
    timestamp: bigint;
  };
}

export interface FriendAddedEvent extends UserRegistryEvent {
  eventName: "FriendAdded";
  args: {
    user1: string;
    user2: string;
    timestamp: bigint;
  };
}

export interface FriendRemovedEvent extends UserRegistryEvent {
  eventName: "FriendRemoved";
  args: {
    user1: string;
    user2: string;
    timestamp: bigint;
  };
}

// Union types for easier handling
export type AllMarketplaceEvents =
  | NFTListedEvent
  | NFTUnlistedEvent
  | NFTSoldEvent;
export type AllUserRegistryEvents =
  | FriendRequestSentEvent
  | FriendRequestAcceptedEvent
  | FriendRequestCancelledEvent
  | FriendAddedEvent
  | FriendRemovedEvent;
