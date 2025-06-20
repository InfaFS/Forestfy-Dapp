// Export all API services
export { NFTService } from "./nftService";
export { MarketplaceService } from "./marketplaceService";
export { UserService } from "./userService";

// Export the base client and error class
export { apiClient, ApiError } from "../ApiClient";

// Export types
export * from "../../types/api";

// Legacy compatibility exports (to ease migration)
export { NFTService as nftService } from "./nftService";
export { MarketplaceService as marketplaceService } from "./marketplaceService";
export { UserService as userService } from "./userService";
