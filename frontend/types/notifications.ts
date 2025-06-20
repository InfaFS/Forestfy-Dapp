// Base notification interface
export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  eventTimestamp?: number; // Timestamp from blockchain event
  onDismiss?: () => void;
}

// Notification types
export type NotificationType =
  | "nft_sold"
  | "nft_bought"
  | "nft_listed"
  | "nft_unlisted"
  | "friend_request_received"
  | "friend_request_accepted"
  | "session_lost"
  | "coins_received";

// Specific notification interfaces
export interface NFTNotification extends BaseNotification {
  type: "nft_sold" | "nft_bought" | "nft_listed" | "nft_unlisted";
  tokenId: string;
  price: string;
  buyer?: string;
  seller?: string;
}

export interface FriendNotification extends BaseNotification {
  type: "friend_request_received" | "friend_request_accepted";
  fromUser: string;
  toUser: string;
  fromUserName?: string;
  toUserName?: string;
}

export interface SessionLostNotification extends BaseNotification {
  type: "session_lost";
  tokensLost: number;
}

export interface CoinsReceivedNotification extends BaseNotification {
  type: "coins_received";
  amount: number;
}

// Union type for all notifications
export type Notification =
  | NFTNotification
  | FriendNotification
  | SessionLostNotification
  | CoinsReceivedNotification;

// Notification context interface
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  clearOldNotifications: () => void;
}

// Event data interfaces for processing
export interface MarketplaceEventData {
  eventType: "NFTListed" | "NFTUnlisted" | "NFTSold";
  tokenId: string;
  seller: string;
  buyer?: string;
  price: string;
  timestamp?: number;
}

export interface UserRegistryEventData {
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
}

// Notification configuration
export interface NotificationConfig {
  autoRemoveDelay: number; // milliseconds
  eventTimeWindow: number; // milliseconds (1 minute = 60000)
  maxNotifications: number;
  cleanupInterval: number; // milliseconds
}

// Default configuration
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  autoRemoveDelay: 10000, // 10 seconds
  eventTimeWindow: 60000, // 1 minute
  maxNotifications: 10,
  cleanupInterval: 30000, // 30 seconds
};

// Notification factory functions
export type NotificationFactory<T extends Notification> = (
  data: any,
  userAddress: string
) => Promise<T | null>;

// Processed transaction tracking
export interface ProcessedTransaction {
  id: string;
  timestamp: number;
  type: string;
}
