import { apiClient } from "../ApiClient";
import {
  ApiEndpoints,
  MintTreeRequest,
  MintTreeResponse,
  ReclaimRewardResponse,
  ParcelResponse,
} from "../../types/api";

export class NFTService {
  /**
   * Mint new tree NFTs
   */
  static async mintTree(
    address: string,
    amount: number
  ): Promise<MintTreeResponse> {
    apiClient.validateAddress(address);
    apiClient.validateAmount(amount);

    const request: MintTreeRequest = { address, amount };
    return apiClient.post<MintTreeResponse>(ApiEndpoints.MINT_TREE, request);
  }

  /**
   * Reclaim initial reward
   */
  static async reclaimReward(address: string): Promise<ReclaimRewardResponse> {
    apiClient.validateAddress(address);

    return apiClient.post<ReclaimRewardResponse>(ApiEndpoints.RECLAIM_REWARD, {
      address,
    });
  }

  /**
   * Reduce user balance
   */
  static async reduceBalance(
    address: string,
    amount: number
  ): Promise<ReclaimRewardResponse> {
    apiClient.validateAddress(address);
    apiClient.validateAmount(amount);

    return apiClient.post<ReclaimRewardResponse>(ApiEndpoints.REDUCE_BALANCE, {
      address,
      amount,
    });
  }

  /**
   * Claim staking rewards
   */
  static async claimStaking(
    address: string,
    amount: number
  ): Promise<ReclaimRewardResponse> {
    apiClient.validateAddress(address);
    apiClient.validateAmount(amount);

    return apiClient.post<ReclaimRewardResponse>(ApiEndpoints.CLAIM_STAKING, {
      address,
      amount,
    });
  }

  /**
   * Claim first parcel (free)
   */
  static async claimFirstParcel(address: string): Promise<ParcelResponse> {
    apiClient.validateAddress(address);

    return apiClient.post<ParcelResponse>(ApiEndpoints.CLAIM_FIRST_PARCEL, {
      address,
    });
  }

  /**
   * Buy additional parcel
   */
  static async buyParcel(address: string): Promise<ParcelResponse> {
    apiClient.validateAddress(address);

    return apiClient.post<ParcelResponse>(ApiEndpoints.BUY_PARCEL, { address });
  }
}
