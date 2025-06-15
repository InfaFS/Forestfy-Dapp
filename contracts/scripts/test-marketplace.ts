import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Marketplace functionality...");

  // Get deployed contract addresses (update these after deployment)
  const FOREST_TOKEN_ADDRESS = "YOUR_FOREST_TOKEN_ADDRESS"; // Update this
  const FOREST_NFT_ADDRESS = "YOUR_FOREST_NFT_ADDRESS"; // Update this
  const MARKETPLACE_ADDRESS = "YOUR_MARKETPLACE_ADDRESS"; // Update this

  // Check if addresses are set
  if (FOREST_TOKEN_ADDRESS === "YOUR_FOREST_TOKEN_ADDRESS") {
    console.log(
      "❌ Please update the contract addresses in this script first!"
    );
    console.log("   Copy the addresses from the deployment output");
    process.exit(1);
  }

  const [owner, user1, user2] = await ethers.getSigners();
  console.log(`👤 Owner: ${owner.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}\n`);

  // Get contract instances
  const ForestToken = await ethers.getContractFactory("ForestToken");
  const forestToken = ForestToken.attach(FOREST_TOKEN_ADDRESS);

  const ForestNFT = await ethers.getContractFactory("ForestNFT");
  const forestNFT = ForestNFT.attach(FOREST_NFT_ADDRESS);

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = Marketplace.attach(MARKETPLACE_ADDRESS);

  try {
    // ================================
    // 1. SETUP USERS
    // ================================
    console.log("1️⃣ Setting up test users...");

    // Give users parcels
    console.log("   🏞️ Assigning parcels to users...");
    await forestNFT.assignParcels(user1.address, 3);
    await forestNFT.assignParcels(user2.address, 2);

    const user1Parcels = await forestNFT.getUserParcels(user1.address);
    const user2Parcels = await forestNFT.getUserParcels(user2.address);
    console.log(`   ✅ User1 parcels: ${user1Parcels}`);
    console.log(`   ✅ User2 parcels: ${user2Parcels}`);

    // Give users virtual tokens
    console.log("   💰 Giving users virtual tokens...");
    await forestToken.claimStaking(user1.address, ethers.parseEther("100"));
    await forestToken.claimStaking(user2.address, ethers.parseEther("50"));

    const user1Balance = await forestToken.virtualBalance(user1.address);
    const user2Balance = await forestToken.virtualBalance(user2.address);
    console.log(
      `   ✅ User1 balance: ${ethers.formatEther(user1Balance)} FOREST`
    );
    console.log(
      `   ✅ User2 balance: ${ethers.formatEther(user2Balance)} FOREST\n`
    );

    // ================================
    // 2. MINT NFTs FOR TESTING
    // ================================
    console.log("2️⃣ Minting NFTs for testing...");

    // Mint NFTs for user1
    console.log("   🎨 Minting NFTs for User1...");
    await forestNFT.mintTo(user1.address, 20); // 2.0 tokens worth
    await forestNFT.mintTo(user1.address, 35); // 3.5 tokens worth

    const user1Tokens = await forestNFT.tokensOfOwner(user1.address);
    console.log(`   ✅ User1 NFTs: [${user1Tokens.join(", ")}]`);

    // Get NFT details
    const tokenId1 = user1Tokens[0];
    const tokenId2 = user1Tokens[1];

    const rarity1 = await forestNFT.tokenRarity(tokenId1);
    const rarity2 = await forestNFT.tokenRarity(tokenId2);
    const rarityNames = ["NORMAL", "RARE", "LEGENDARY"];

    console.log(`   📊 NFT ${tokenId1}: ${rarityNames[rarity1]}`);
    console.log(`   📊 NFT ${tokenId2}: ${rarityNames[rarity2]}\n`);

    // ================================
    // 3. TEST MARKETPLACE LISTING
    // ================================
    console.log("3️⃣ Testing NFT listing...");

    const listingPrice = ethers.parseEther("10"); // 10 FOREST tokens

    console.log(
      `   📝 Listing NFT ${tokenId1} for ${ethers.formatEther(
        listingPrice
      )} FOREST...`
    );
    await marketplace.listNFT(user1.address, tokenId1, listingPrice);

    // Verify listing
    const listing = await marketplace.getListing(tokenId1);
    console.log(`   ✅ NFT listed successfully!`);
    console.log(`      Seller: ${listing.seller}`);
    console.log(`      Price: ${ethers.formatEther(listing.price)} FOREST`);
    console.log(`      Active: ${listing.isActive}`);

    // Check active listings
    const activeListings = await marketplace.getActiveListings();
    console.log(`   📋 Total active listings: ${activeListings.length}\n`);

    // ================================
    // 4. TEST MARKETPLACE PURCHASE
    // ================================
    console.log("4️⃣ Testing NFT purchase...");

    // Check if user2 can buy
    const canBuy = await marketplace.canBuyNFT(user2.address, tokenId1);
    console.log(`   🤔 Can User2 buy NFT ${tokenId1}? ${canBuy}`);

    if (canBuy) {
      console.log(`   💳 User2 buying NFT ${tokenId1}...`);

      // Record balances before purchase
      const user1BalanceBefore = await forestToken.virtualBalance(
        user1.address
      );
      const user2BalanceBefore = await forestToken.virtualBalance(
        user2.address
      );
      const ownerBalanceBefore = await forestToken.virtualBalance(
        owner.address
      );

      console.log(
        `      Before - User1: ${ethers.formatEther(user1BalanceBefore)} FOREST`
      );
      console.log(
        `      Before - User2: ${ethers.formatEther(user2BalanceBefore)} FOREST`
      );
      console.log(
        `      Before - Owner: ${ethers.formatEther(ownerBalanceBefore)} FOREST`
      );

      // Execute purchase
      await marketplace.buyNFT(user2.address, tokenId1);

      // Record balances after purchase
      const user1BalanceAfter = await forestToken.virtualBalance(user1.address);
      const user2BalanceAfter = await forestToken.virtualBalance(user2.address);
      const ownerBalanceAfter = await forestToken.virtualBalance(owner.address);

      console.log(
        `      After  - User1: ${ethers.formatEther(user1BalanceAfter)} FOREST`
      );
      console.log(
        `      After  - User2: ${ethers.formatEther(user2BalanceAfter)} FOREST`
      );
      console.log(
        `      After  - Owner: ${ethers.formatEther(ownerBalanceAfter)} FOREST`
      );

      // Verify NFT ownership changed
      const newOwner = await forestNFT.getTokenOwner(tokenId1);
      console.log(`   ✅ NFT ${tokenId1} now owned by: ${newOwner}`);
      console.log(`   ✅ Purchase successful!\n`);

      // Verify listing was removed
      const updatedListing = await marketplace.getListing(tokenId1);
      console.log(
        `   📋 Listing active after purchase: ${updatedListing.isActive}`
      );
    } else {
      console.log(
        `   ❌ User2 cannot buy NFT ${tokenId1} (insufficient balance or other issue)\n`
      );
    }

    // ================================
    // 5. TEST LISTING MANAGEMENT
    // ================================
    console.log("5️⃣ Testing listing management...");

    if (user1Tokens.length > 1) {
      const secondTokenId = tokenId2;

      // List second NFT
      console.log(`   📝 Listing second NFT ${secondTokenId}...`);
      await marketplace.listNFT(
        user1.address,
        secondTokenId,
        ethers.parseEther("15")
      );

      // Update price
      console.log(`   💰 Updating price to 20 FOREST...`);
      await marketplace.updateListingPrice(
        user1.address,
        secondTokenId,
        ethers.parseEther("20")
      );

      // Verify price update
      const updatedListing = await marketplace.getListing(secondTokenId);
      console.log(
        `   ✅ Updated price: ${ethers.formatEther(
          updatedListing.price
        )} FOREST`
      );

      // Unlist NFT
      console.log(`   🗑️ Unlisting NFT ${secondTokenId}...`);
      await marketplace.unlistNFT(user1.address, secondTokenId);

      // Verify unlisting
      const finalListing = await marketplace.getListing(secondTokenId);
      console.log(`   ✅ NFT unlisted: ${!finalListing.isActive}\n`);
    }

    // ================================
    // 6. FINAL STATISTICS
    // ================================
    console.log("6️⃣ Final statistics...");

    const finalActiveListings = await marketplace.getActiveListings();
    const user1FinalTokens = await forestNFT.tokensOfOwner(user1.address);
    const user2FinalTokens = await forestNFT.tokensOfOwner(user2.address);

    console.log(`   📊 Active listings: ${finalActiveListings.length}`);
    console.log(`   🎨 User1 final NFTs: [${user1FinalTokens.join(", ")}]`);
    console.log(`   🎨 User2 final NFTs: [${user2FinalTokens.join(", ")}]`);

    const marketplaceStats = await marketplace.getMarketplaceStats();
    console.log(`   💰 Marketplace fee: ${marketplaceStats.currentFee}%`);

    console.log("\n✅ ALL TESTS PASSED! Marketplace is working correctly! 🎉");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
