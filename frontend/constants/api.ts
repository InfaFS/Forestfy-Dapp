import { NFTService, MarketplaceService, UserService } from "../services/api";

// Legacy API endpoints for backward compatibility
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  reclaimReward: `${API_BASE_URL}/reclaim-reward`,
  mintTree: `${API_BASE_URL}/mint`,
  reduceBalance: `${API_BASE_URL}/reduce-balance`,
  claimStaking: `${API_BASE_URL}/claim-staking`,
  claimFirstParcel: `${API_BASE_URL}/claim-first-parcel`,
  buyParcel: `${API_BASE_URL}/add-parcel`,
  buyNFT: `${API_BASE_URL}/buy-nft`,
  listNFT: `${API_BASE_URL}/list-nft`,
  unlistNFT: `${API_BASE_URL}/unlist-nft`,
  registerUser: `${API_BASE_URL}/register-user`,
  changeName: `${API_BASE_URL}/change-name`,
  sendFriendRequest: `${API_BASE_URL}/send-friend-request`,
  acceptFriendRequest: `${API_BASE_URL}/accept-friend-request`,
  removeFriend: `${API_BASE_URL}/remove-friend`,
  cancelFriendRequest: `${API_BASE_URL}/cancel-friend-request`,
} as const;

// ===================================================================
// LEGACY FUNCTION WRAPPERS (for backward compatibility)
// These maintain the exact same API as before but use the new services
// ===================================================================

export const reclaimReward = async (address: string) => {
  return NFTService.reclaimReward(address);
};

export const mintTree = async (address: string, amount: number) => {
  return NFTService.mintTree(address, amount);
};

export const reduceBalance = async (address: string, amount: number) => {
  return NFTService.reduceBalance(address, amount);
};

export const claimStaking = async (address: string, amount: number) => {
  return NFTService.claimStaking(address, amount);
};

export const claimFirstParcel = async (address: string) => {
  return NFTService.claimFirstParcel(address);
};

export const buyParcel = async (address: string) => {
  return NFTService.buyParcel(address);
};

export const buyNFT = async (
  address: string,
  tokenId: string,
  userBalance: number,
  userParcels: number,
  userTokenCount: number,
  nftPrice: number
) => {
  return MarketplaceService.buyNFT(
    address,
    tokenId,
    userBalance,
    userParcels,
    userTokenCount,
    nftPrice
  );
};

export const listNFT = async (
  address: string,
  tokenId: string,
  precio: number
) => {
  return MarketplaceService.listNFT(address, tokenId, precio);
};

export const unlistNFT = async (address: string, tokenId: string) => {
  return MarketplaceService.unlistNFT(address, tokenId);
};

export const registerUser = async (userAddress: string, name: string) => {
  return UserService.registerUser(userAddress, name);
};

export const changeName = async (userAddress: string, newName: string) => {
  return UserService.changeName(userAddress, newName);
};

export const sendFriendRequest = async (
  fromAddress: string,
  toAddress: string
) => {
  return UserService.sendFriendRequest(fromAddress, toAddress);
};

export const acceptFriendRequest = async (
  fromAddress: string,
  toAddress: string
) => {
  return UserService.acceptFriendRequest(fromAddress, toAddress);
};

export const removeFriend = async (
  userAddress: string,
  friendAddress: string
) => {
  return UserService.removeFriend(userAddress, friendAddress);
};

export const cancelFriendRequest = async (
  fromAddress: string,
  toAddress: string
) => {
  return UserService.cancelFriendRequest(fromAddress, toAddress);
};
