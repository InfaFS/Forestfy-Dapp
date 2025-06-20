import { apiClient, ApiError } from "../ApiClient";
import {
  ApiEndpoints,
  RegisterUserRequest,
  ChangeNameRequest,
  FriendRequest,
  RemoveFriendRequest,
  UserResponse,
  FriendResponse,
} from "../../types/api";

export class UserService {
  /**
   * Register new user
   */
  static async registerUser(
    userAddress: string,
    name: string
  ): Promise<UserResponse> {
    apiClient.validateAddress(userAddress);
    apiClient.validateUserName(name);

    const request: RegisterUserRequest = { userAddress, name };
    return apiClient.post<UserResponse>(ApiEndpoints.REGISTER_USER, request);
  }

  /**
   * Change user name
   */
  static async changeName(
    userAddress: string,
    newName: string
  ): Promise<UserResponse> {
    apiClient.validateAddress(userAddress);
    apiClient.validateUserName(newName);

    const request: ChangeNameRequest = { userAddress, newName };
    return apiClient.post<UserResponse>(ApiEndpoints.CHANGE_NAME, request);
  }

  /**
   * Send friend request
   */
  static async sendFriendRequest(
    fromAddress: string,
    toAddress: string
  ): Promise<FriendResponse> {
    apiClient.validateAddress(fromAddress);
    apiClient.validateAddress(toAddress);

    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
      throw new ApiError(
        "Cannot send friend request to yourself",
        "VALIDATION_ERROR"
      );
    }

    const request: FriendRequest = { fromAddress, toAddress };
    return apiClient.post<FriendResponse>(
      ApiEndpoints.SEND_FRIEND_REQUEST,
      request
    );
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(
    fromAddress: string,
    toAddress: string
  ): Promise<FriendResponse> {
    apiClient.validateAddress(fromAddress);
    apiClient.validateAddress(toAddress);

    const request: FriendRequest = { fromAddress, toAddress };
    return apiClient.post<FriendResponse>(
      ApiEndpoints.ACCEPT_FRIEND_REQUEST,
      request
    );
  }

  /**
   * Remove friend
   */
  static async removeFriend(
    userAddress: string,
    friendAddress: string
  ): Promise<FriendResponse> {
    apiClient.validateAddress(userAddress);
    apiClient.validateAddress(friendAddress);

    const request: RemoveFriendRequest = { userAddress, friendAddress };
    return apiClient.post<FriendResponse>(ApiEndpoints.REMOVE_FRIEND, request);
  }

  /**
   * Cancel friend request
   */
  static async cancelFriendRequest(
    fromAddress: string,
    toAddress: string
  ): Promise<FriendResponse> {
    apiClient.validateAddress(fromAddress);
    apiClient.validateAddress(toAddress);

    const request: FriendRequest = { fromAddress, toAddress };
    return apiClient.post<FriendResponse>(
      ApiEndpoints.CANCEL_FRIEND_REQUEST,
      request
    );
  }
}
