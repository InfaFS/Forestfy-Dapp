// Base types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  hash?: string;
  error?: string;
  data?: T;
}

// Request types
export interface MintTreeRequest {
  address: string;
  amount: number;
}

export interface BuyNFTRequest {
  address: string;
  tokenId: string;
}

export interface ListNFTRequest {
  address: string;
  tokenId: string;
  precio: number;
}

export interface UnlistNFTRequest {
  address: string;
  tokenId: string;
}

export interface RegisterUserRequest {
  userAddress: string;
  name: string;
}

export interface ChangeNameRequest {
  userAddress: string;
  newName: string;
}

export interface FriendRequest {
  fromAddress: string;
  toAddress: string;
}

export interface RemoveFriendRequest {
  userAddress: string;
  friendAddress: string;
}

// Response types
export interface MintTreeResponse extends ApiResponse {
  mintHash?: string;
}

export interface ReclaimRewardResponse extends ApiResponse {
  hash?: string;
}

export interface BuyNFTResponse extends ApiResponse {
  buyer?: string;
  seller?: string;
  tokenId?: string;
  price?: string;
  priceWei?: string;
}

export interface ListNFTResponse extends ApiResponse {
  seller?: string;
  tokenId?: string;
  price?: number;
}

export interface ParcelResponse extends ApiResponse {
  reduceHash?: string;
  addParcelHash?: string;
}

export interface UserResponse extends ApiResponse {
  userAddress?: string;
  name?: string;
}

export interface FriendResponse extends ApiResponse {
  fromAddress?: string;
  toAddress?: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// API endpoints enum
export enum ApiEndpoints {
  RECLAIM_REWARD = "/reclaim-reward",
  MINT_TREE = "/mint",
  REDUCE_BALANCE = "/reduce-balance",
  CLAIM_STAKING = "/claim-staking",
  CLAIM_FIRST_PARCEL = "/claim-first-parcel",
  BUY_PARCEL = "/add-parcel",
  BUY_NFT = "/buy-nft",
  LIST_NFT = "/list-nft",
  UNLIST_NFT = "/unlist-nft",
  REGISTER_USER = "/register-user",
  CHANGE_NAME = "/change-name",
  SEND_FRIEND_REQUEST = "/send-friend-request",
  ACCEPT_FRIEND_REQUEST = "/accept-friend-request",
  REMOVE_FRIEND = "/remove-friend",
  CANCEL_FRIEND_REQUEST = "/cancel-friend-request",
}
