import { useNotifications } from "../contexts/NotificationContext";
import {
  Notification,
  NotificationType,
  NFTNotification,
  FriendNotification,
  SessionLostNotification,
  CoinsReceivedNotification,
} from "@/types/notifications";

export interface NotificationOptions {
  type:
    | "success"
    | "error"
    | "info"
    | "warning"
    | "session_lost"
    | "coins_received";
  title: string;
  message: string;
  tokenId?: string;
  price?: string;
  buyer?: string;
  seller?: string;
  fromUser?: string;
  toUser?: string;
  tokensLost?: number;
  amount?: number;
  onDismiss?: () => void;
}

// Map our simple types to the context types
const mapToContextType = (
  type: NotificationOptions["type"]
): NotificationType => {
  switch (type) {
    case "success":
      return "nft_sold";
    case "info":
      return "nft_unlisted";
    case "session_lost":
      return "session_lost";
    case "coins_received":
      return "coins_received";
    case "error":
    case "warning":
    default:
      return "nft_listed";
  }
};

export function useNotification() {
  const { addNotification, ...rest } = useNotifications();

  const showNotification = (options: NotificationOptions) => {
    const notificationType = mapToContextType(options.type);

    // Create appropriate notification based on type
    if (notificationType.startsWith("nft_")) {
      const nftNotification: Omit<NFTNotification, "id" | "timestamp"> = {
        type: notificationType as
          | "nft_sold"
          | "nft_bought"
          | "nft_listed"
          | "nft_unlisted",
        title: options.title,
        message: options.message,
        tokenId: options.tokenId || "",
        price: options.price || "",
        buyer: options.buyer,
        seller: options.seller,
        onDismiss: options.onDismiss,
      };
      addNotification(nftNotification);
    } else if (notificationType.startsWith("friend_")) {
      const friendNotification: Omit<FriendNotification, "id" | "timestamp"> = {
        type: notificationType as
          | "friend_request_received"
          | "friend_request_accepted",
        title: options.title,
        message: options.message,
        fromUser: options.fromUser || "",
        toUser: options.toUser || "",
        onDismiss: options.onDismiss,
      };
      addNotification(friendNotification);
    } else if (notificationType === "session_lost") {
      const sessionLostNotification: Omit<
        SessionLostNotification,
        "id" | "timestamp"
      > = {
        type: "session_lost",
        title: options.title,
        message: options.message,
        tokensLost: options.tokensLost || 0,
        onDismiss: options.onDismiss,
      };
      addNotification(sessionLostNotification);
    } else if (notificationType === "coins_received") {
      const coinsReceivedNotification: Omit<
        CoinsReceivedNotification,
        "id" | "timestamp"
      > = {
        type: "coins_received",
        title: options.title,
        message: options.message,
        amount: options.amount || 0,
        onDismiss: options.onDismiss,
      };
      addNotification(coinsReceivedNotification);
    }
  };

  return {
    showNotification,
    ...rest,
  };
}
