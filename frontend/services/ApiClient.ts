import { ApiResponse, ApiEndpoints } from "../types/api";

export class ApiError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Generic POST request method
   */
  async post<TResponse = ApiResponse, TRequest = any>(
    endpoint: ApiEndpoints | string,
    data: TRequest,
    customHeaders?: Record<string, string>
  ): Promise<TResponse> {
    return this.request<TResponse>("POST", endpoint, data, customHeaders);
  }

  /**
   * Generic GET request method
   */
  async get<TResponse = ApiResponse>(
    endpoint: ApiEndpoints | string,
    customHeaders?: Record<string, string>
  ): Promise<TResponse> {
    return this.request<TResponse>("GET", endpoint, undefined, customHeaders);
  }

  /**
   * Generic request method with error handling
   */
  private async request<TResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: ApiEndpoints | string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`🌐 API Request: ${method} ${url}`, data ? { data } : "");

      const response = await fetch(url, config);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const result = await response.json();

      console.log(`✅ API Response: ${method} ${url}`, {
        success: result.success,
        hash: result.hash,
      });

      return result;
    } catch (error) {
      console.error(`❌ API Error: ${method} ${url}`, error);
      throw this.transformError(error);
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorDetails = errorData;
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new ApiError(errorMessage, `HTTP_${response.status}`, errorDetails);
  }

  /**
   * Transform any error into a consistent ApiError
   */
  private transformError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new ApiError(
        "Network error: Unable to connect to server",
        "NETWORK_ERROR",
        error
      );
    }

    return new ApiError(
      error.message || "Unknown error occurred",
      "UNKNOWN_ERROR",
      error
    );
  }

  /**
   * Validation helpers for common validations
   */
  validateAddress(address: string): void {
    if (!address) {
      throw new ApiError("Address is required", "VALIDATION_ERROR");
    }

    if (!address.startsWith("0x") || address.length !== 42) {
      throw new ApiError("Invalid address format", "VALIDATION_ERROR");
    }
  }

  validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
      throw new ApiError("Valid amount is required", "VALIDATION_ERROR");
    }
  }

  validateTokenId(tokenId: string): void {
    if (tokenId === undefined || tokenId === null) {
      throw new ApiError("Token ID is required", "VALIDATION_ERROR");
    }
  }

  validateUserName(name: string): void {
    if (!name || !name.trim()) {
      throw new ApiError("Name is required", "VALIDATION_ERROR");
    }

    if (name.length > 50) {
      throw new ApiError(
        "Name too long (max 50 characters)",
        "VALIDATION_ERROR"
      );
    }
  }

  /**
   * Business logic validations for NFT operations
   */
  validateNFTPurchase(
    userBalance: number,
    userParcels: number,
    userTokenCount: number,
    nftPrice: number
  ): void {
    if (userBalance < nftPrice) {
      throw new ApiError(
        `Insufficient balance. You need ${nftPrice} FTK but only have ${userBalance} FTK`,
        "INSUFFICIENT_BALANCE"
      );
    }

    const maxTrees = userParcels * 16;
    if (userTokenCount >= maxTrees) {
      throw new ApiError(
        `No space for more trees. You need more parcels (max: ${maxTrees} trees)`,
        "INSUFFICIENT_SPACE"
      );
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
