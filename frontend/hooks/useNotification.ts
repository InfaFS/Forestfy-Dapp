import { useNotifications } from "../contexts/NotificationContext";

export interface NotificationOptions {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  tokenId?: string;
  price?: string;
  buyer?: string;
  seller?: string;
  fromUser?: string;
  toUser?: string;
  onDismiss?: () => void;
}

// Map our simple types to the context types
const mapToContextType = (type: NotificationOptions["type"]): string => {
  switch (type) {
    case "success":
      return "nft_sold";
    case "info":
      return "nft_unlisted";
    case "error":
    case "warning":
    default:
      return "nft_listed";
  }
};

export function useNotification() {
  const { addNotification, ...rest } = useNotifications();

  const showNotification = (options: NotificationOptions) => {
    addNotification({
      type: mapToContextType(options.type) as any,
      title: options.title,
      message: options.message,
      tokenId: options.tokenId,
      price: options.price,
      buyer: options.buyer,
      seller: options.seller,
      fromUser: options.fromUser,
      toUser: options.toUser,
      onDismiss: options.onDismiss,
    });
  };

  return {
    showNotification,
    ...rest,
  };
}
