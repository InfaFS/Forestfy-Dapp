import { readContract } from "thirdweb";
import { UserRegistryContract } from "@/constants/thirdweb";
import {
  Notification,
  NFTNotification,
  FriendNotification,
  MarketplaceEventData,
  UserRegistryEventData,
  DEFAULT_NOTIFICATION_CONFIG,
  ProcessedTransaction,
} from "@/types/notifications";

/**
 * Utility functions for notifications
 */
export class NotificationUtils {
  /**
   * Format token amount for display
   */
  static formatTokenAmount(amount: string | number): string {
    const numAmount = typeof amount === "string" ? Number(amount) : amount;

    // Si es muy pequeño (notación científica), convertir desde wei
    if (numAmount < 0.001 && numAmount > 0) {
      const fromWei = numAmount * 1e18;
      return fromWei.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    // Para números normales, formatear con decimales apropiados
    return numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Get user name by address from blockchain
   */
  static async getUserName(userAddress: string): Promise<string> {
    try {
      const userInfo = await readContract({
        contract: UserRegistryContract,
        method:
          "function getUserInfo(address) view returns (string name, address userAddress, bool exists, address[] friends, uint256 createdAt)",
        params: [userAddress],
      });

      // userInfo[0] es el nombre, userInfo[2] es el exists flag
      if (userInfo[2] && userInfo[0]) {
        // exists && name
        return userInfo[0];
      } else {
        return `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
      }
    } catch (error) {
      console.error("Error getting user name:", error);
      return `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    }
  }

  /**
   * Check if event is within time window (1 minute)
   */
  static isEventRecent(eventTimestamp?: number): boolean {
    if (!eventTimestamp) return true; // If no timestamp, assume recent

    const now = Date.now();
    const eventTime = eventTimestamp * 1000; // Convert from seconds to milliseconds
    const timeDiff = now - eventTime;

    return timeDiff <= DEFAULT_NOTIFICATION_CONFIG.eventTimeWindow;
  }

  /**
   * Generate unique transaction ID
   */
  static generateTransactionId(type: string, ...params: string[]): string {
    return `${type}-${params.join("-").toLowerCase()}`;
  }

  /**
   * Check if transaction was already processed
   */
  static isTransactionProcessed(
    transactionId: string,
    processedTransactions: Set<string>
  ): boolean {
    return processedTransactions.has(transactionId);
  }
}

/**
 * Factory functions for creating specific notification types
 */
export class NotificationFactory {
  /**
   * Create NFT sold notification
   */
  static async createNFTSoldNotification(
    data: MarketplaceEventData,
    userAddress: string
  ): Promise<NFTNotification | null> {
    const { tokenId, seller, buyer, price, timestamp } = data;

    // Only show if user is the seller
    if (seller.toLowerCase() !== userAddress.toLowerCase()) {
      return null;
    }

    // Check if event is recent (within 1 minute)
    if (!NotificationUtils.isEventRecent(timestamp)) {
      console.log(
        `🕐 NFT sold event too old, skipping notification. Event: ${timestamp}, Now: ${Date.now()}`
      );
      return null;
    }

    const formattedPrice = NotificationUtils.formatTokenAmount(Number(price));

    return {
      type: "nft_sold",
      title: "NFT Sold!",
      message: `Your NFT #${tokenId} was sold for ${formattedPrice} FTK`,
      tokenId,
      price: formattedPrice,
      buyer,
      seller,
      eventTimestamp: timestamp,
      onDismiss: () => {
        // Trigger balance update
        console.log(
          "🔄 Updating seller balance after NFT sale confirmation..."
        );
        // This will be handled by the context
      },
    } as NFTNotification;
  }

  /**
   * Create friend request received notification
   */
  static async createFriendRequestReceivedNotification(
    data: UserRegistryEventData,
    userAddress: string
  ): Promise<FriendNotification | null> {
    const { from, to, timestamp } = data;

    if (!from || !to) return null;

    // Only show if user is the recipient
    if (to.toLowerCase() !== userAddress.toLowerCase()) {
      return null;
    }

    // Check if event is recent (within 1 minute)
    if (!NotificationUtils.isEventRecent(timestamp)) {
      console.log(
        `🕐 Friend request event too old, skipping notification. Event: ${timestamp}, Now: ${Date.now()}`
      );
      return null;
    }

    const fromUserName = await NotificationUtils.getUserName(from);

    return {
      type: "friend_request_received",
      title: "New Friend Request!",
      message: `${fromUserName} wants to be your friend`,
      fromUser: from,
      toUser: to,
      fromUserName,
      eventTimestamp: timestamp,
      onDismiss: () => {
        // Trigger social data update
        console.log(
          "🔄 Updating social data after friend request notification..."
        );
        // This will be handled by the context
      },
    } as FriendNotification;
  }

  /**
   * Create friend request accepted notification
   */
  static async createFriendRequestAcceptedNotification(
    data: UserRegistryEventData,
    userAddress: string
  ): Promise<FriendNotification | null> {
    const { from, to, timestamp } = data;

    if (!from || !to) return null;

    // Only show if user is the original sender (from)
    if (from.toLowerCase() !== userAddress.toLowerCase()) {
      return null;
    }

    // Check if event is recent (within 1 minute)
    if (!NotificationUtils.isEventRecent(timestamp)) {
      console.log(
        `🕐 Friend request accepted event too old, skipping notification. Event: ${timestamp}, Now: ${Date.now()}`
      );
      return null;
    }

    const toUserName = await NotificationUtils.getUserName(to);

    return {
      type: "friend_request_accepted",
      title: "Friend Request Accepted!",
      message: `${toUserName} accepted your friend request`,
      fromUser: from,
      toUser: to,
      toUserName,
      eventTimestamp: timestamp,
      onDismiss: () => {
        // Trigger social data update
        console.log(
          "🔄 Updating social data after friend acceptance notification..."
        );
        // This will be handled by the context
      },
    } as FriendNotification;
  }
}

/**
 * Main notification processing service
 */
export class NotificationService {
  private processedTransactions = new Set<string>();

  /**
   * Process marketplace event and create notification if needed
   */
  async processMarketplaceEvent(
    data: MarketplaceEventData,
    userAddress: string
  ): Promise<Notification | null> {
    const { eventType, tokenId, seller, buyer, price } = data;

    switch (eventType) {
      case "NFTSold":
        const transactionId = NotificationUtils.generateTransactionId(
          "nft_sold",
          tokenId,
          seller,
          buyer || "",
          price
        );

        // Check if already processed
        if (
          NotificationUtils.isTransactionProcessed(
            transactionId,
            this.processedTransactions
          )
        ) {
          console.log(
            "🔄 NFT sold transaction already processed, skipping:",
            transactionId
          );
          return null;
        }

        // Mark as processed
        this.processedTransactions.add(transactionId);

        // Create notification
        return await NotificationFactory.createNFTSoldNotification(
          data,
          userAddress
        );

      // Add other marketplace events here if needed
      default:
        return null;
    }
  }

  /**
   * Process user registry event and create notification if needed
   */
  async processUserRegistryEvent(
    data: UserRegistryEventData,
    userAddress: string
  ): Promise<Notification | null> {
    const { eventType, from, to } = data;

    switch (eventType) {
      case "FriendRequestSent":
        if (!from || !to) return null;

        const requestId = NotificationUtils.generateTransactionId(
          "friend_request",
          from,
          to
        );

        // Check if already processed
        if (
          NotificationUtils.isTransactionProcessed(
            requestId,
            this.processedTransactions
          )
        ) {
          console.log(
            "🔄 Friend request already processed, skipping:",
            requestId
          );
          return null;
        }

        // Mark as processed
        this.processedTransactions.add(requestId);

        // Create notification
        return await NotificationFactory.createFriendRequestReceivedNotification(
          data,
          userAddress
        );

      case "FriendRequestAccepted":
        if (!from || !to) return null;

        const acceptedId = NotificationUtils.generateTransactionId(
          "friend_accepted",
          from,
          to
        );

        // Check if already processed
        if (
          NotificationUtils.isTransactionProcessed(
            acceptedId,
            this.processedTransactions
          )
        ) {
          console.log(
            "🔄 Friend acceptance already processed, skipping:",
            acceptedId
          );
          return null;
        }

        // Mark as processed
        this.processedTransactions.add(acceptedId);

        // Create notification
        return await NotificationFactory.createFriendRequestAcceptedNotification(
          data,
          userAddress
        );

      // Add other user registry events here if needed
      default:
        return null;
    }
  }

  /**
   * Clear old processed transactions to prevent memory leaks
   */
  clearOldProcessedTransactions(): void {
    this.processedTransactions.clear();
    console.log("🧹 Cleared old processed transactions");
  }

  /**
   * Get processed transactions count (for debugging)
   */
  getProcessedTransactionsCount(): number {
    return this.processedTransactions.size;
  }
}
