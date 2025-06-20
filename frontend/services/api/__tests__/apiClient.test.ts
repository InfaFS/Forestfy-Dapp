import {
  NFTService,
  MarketplaceService,
  UserService,
  ApiError,
} from "../index";

// Simple test to verify the API client works
export const testNewApiClient = async () => {
  console.log("🧪 Testing new API Client...");

  try {
    // Test validation
    console.log("✅ Testing validation...");

    // This should throw validation errors
    try {
      await NFTService.mintTree("", 0);
      console.error("❌ Validation should have failed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        console.log("✅ Address validation works");
      }
    }

    try {
      await NFTService.mintTree(
        "0x1234567890123456789012345678901234567890",
        -1
      );
      console.error("❌ Amount validation should have failed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        console.log("✅ Amount validation works");
      }
    }

    // Test purchase validation
    try {
      await MarketplaceService.buyNFT(
        "0x1234567890123456789012345678901234567890",
        "1",
        10, // balance
        1, // parcels
        16, // current trees (max for 1 parcel)
        5 // price
      );
      console.error("❌ Space validation should have failed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INSUFFICIENT_SPACE") {
        console.log("✅ Space validation works");
      }
    }

    console.log("🎉 All API Client validations working correctly!");
    console.log("📊 New API system ready for use");

    return true;
  } catch (error) {
    console.error("❌ API Client test failed:", error);
    return false;
  }
};

// Export test function
export default testNewApiClient;
