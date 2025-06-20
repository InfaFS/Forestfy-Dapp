import { apiClient } from "../ApiClient";
import {
  ApiEndpoints,
  BuyNFTRequest,
  BuyNFTResponse,
  ListNFTRequest,
  ListNFTResponse,
  UnlistNFTRequest,
  ApiResponse,
} from "../../types/api";

export class MarketplaceService {
  /**
   * Buy NFT from marketplace
   */
  static async buyNFT(
    address: string,
    tokenId: string,
    userBalance: number,
    userParcels: number,
    userTokenCount: number,
    nftPrice: number
  ): Promise<BuyNFTResponse> {
    apiClient.validateAddress(address);
    apiClient.validateTokenId(tokenId);

    // Validate purchase eligibility
    apiClient.validateNFTPurchase(
      userBalance,
      userParcels,
      userTokenCount,
      nftPrice
    );

    const request: BuyNFTRequest = { address, tokenId };
    return apiClient.post<BuyNFTResponse>(ApiEndpoints.BUY_NFT, request);
  }

  /**
   * List NFT on marketplace
   */
  static async listNFT(
    address: string,
    tokenId: string,
    precio: number
  ): Promise<ListNFTResponse> {
    apiClient.validateAddress(address);
    apiClient.validateTokenId(tokenId);
    apiClient.validateAmount(precio);

    const request: ListNFTRequest = { address, tokenId, precio };
    return apiClient.post<ListNFTResponse>(ApiEndpoints.LIST_NFT, request);
  }

  /**
   * Remove NFT from marketplace
   */
  static async unlistNFT(
    address: string,
    tokenId: string
  ): Promise<ApiResponse> {
    apiClient.validateAddress(address);
    apiClient.validateTokenId(tokenId);

    const request: UnlistNFTRequest = { address, tokenId };
    return apiClient.post<ApiResponse>(ApiEndpoints.UNLIST_NFT, request);
  }
}
