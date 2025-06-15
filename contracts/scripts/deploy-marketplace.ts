import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting Marketplace deployment...");

  // Get the deployed contract addresses (you'll need to update these)
  const FOREST_NFT_ADDRESS = "0x73eD3836DB40CF8a4837ff6Bf87dEC402EfDf1e3"; // Update with your ForestNFT address
  const FOREST_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your ForestToken address

  console.log(`📍 ForestNFT Address: ${FOREST_NFT_ADDRESS}`);
  console.log(`📍 ForestToken Address: ${FOREST_TOKEN_ADDRESS}`);

  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    FOREST_NFT_ADDRESS,
    FOREST_TOKEN_ADDRESS
  );
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log(`✅ Marketplace deployed to: ${marketplaceAddress}`);

  // Set up authorizations
  console.log("\n🔐 Setting up authorizations...");

  // Get ForestNFT and ForestToken contracts
  const ForestNFT = await ethers.getContractFactory("ForestNFT");
  const forestNFT = ForestNFT.attach(FOREST_NFT_ADDRESS);

  const ForestToken = await ethers.getContractFactory("ForestToken");
  const forestToken = ForestToken.attach(FOREST_TOKEN_ADDRESS);

  // Authorize Marketplace to operate on ForestNFT
  console.log("📝 Authorizing Marketplace on ForestNFT...");
  const nftTx = await forestNFT.addAuthorizedContract(marketplaceAddress);
  await nftTx.wait();
  console.log("✅ ForestNFT authorization complete");

  // Authorize Marketplace to operate on ForestToken
  console.log("📝 Authorizing Marketplace on ForestToken...");
  const tokenTx = await forestToken.addAuthorizedContract(marketplaceAddress);
  await tokenTx.wait();
  console.log("✅ ForestToken authorization complete");

  // Verify authorizations
  console.log("\n🔍 Verifying authorizations...");
  const isNFTAuthorized = await forestNFT.authorizedContracts(
    marketplaceAddress
  );
  const isTokenAuthorized = await forestToken.authorizedContracts(
    marketplaceAddress
  );

  console.log(`🎯 ForestNFT authorized: ${isNFTAuthorized}`);
  console.log(`🎯 ForestToken authorized: ${isTokenAuthorized}`);

  // Get initial marketplace settings
  console.log("\n📊 Marketplace initial settings:");
  const marketplaceFee = await marketplace.marketplaceFee();
  console.log(`💰 Marketplace fee: ${marketplaceFee}%`);

  console.log("\n🎉 Deployment complete!");
  console.log("📋 Summary:");
  console.log(`   Marketplace: ${marketplaceAddress}`);
  console.log(`   ForestNFT: ${FOREST_NFT_ADDRESS}`);
  console.log(`   ForestToken: ${FOREST_TOKEN_ADDRESS}`);
  console.log(`   Marketplace Fee: ${marketplaceFee}%`);

  // Instructions for next steps
  console.log("\n📝 Next steps:");
  console.log(
    "1. Update your backend/frontend with the new Marketplace address"
  );
  console.log("2. Test listing an NFT using the listNFT function");
  console.log("3. Test buying an NFT using the buyNFT function");
  console.log("4. Verify the marketplace fee and adjust if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
