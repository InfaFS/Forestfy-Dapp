import { ethers } from "ethers";
import { ForestNFTAbi } from "../abis/abi";
import dotenv from "dotenv";

dotenv.config();

async function withdrawNFT() {
  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Initialize NFT contract
  const nftContract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS!,
    ForestNFTAbi,
    wallet
  );

  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("❌ Usage:");
    console.log(
      "  Single NFT: ts-node withdrawNFT.ts single <toAddress> <tokenId>"
    );
    console.log(
      "  Multiple NFTs: ts-node withdrawNFT.ts multiple <toAddress> <tokenId1,tokenId2,tokenId3>"
    );
    console.log(
      "  All NFTs: ts-node withdrawNFT.ts all <userAddress> <toAddress>"
    );
    process.exit(1);
  }

  const [mode, ...restArgs] = args;

  if (!["single", "multiple", "all"].includes(mode)) {
    console.log("❌ Mode must be: single, multiple, or all");
    process.exit(1);
  }

  try {
    console.log(`🔄 Starting ${mode} withdrawal process...`);

    let tx;

    switch (mode) {
      case "single":
        if (restArgs.length < 2) {
          console.log("❌ Single mode requires: <toAddress> <tokenId>");
          process.exit(1);
        }
        const [toAddress, tokenIdStr] = restArgs;

        if (!ethers.isAddress(toAddress)) {
          console.log("❌ Invalid address format");
          process.exit(1);
        }

        const tokenId = parseInt(tokenIdStr);
        console.log(`🎯 Withdrawing token ID: ${tokenId}`);
        console.log(`📍 Destination: ${toAddress}`);

        tx = await nftContract.withdraw(toAddress, tokenId);
        break;

      case "multiple":
        if (restArgs.length < 2) {
          console.log(
            "❌ Multiple mode requires: <toAddress> <tokenId1,tokenId2,tokenId3>"
          );
          process.exit(1);
        }
        const [multiToAddress, tokenIdsStr] = restArgs;

        if (!ethers.isAddress(multiToAddress)) {
          console.log("❌ Invalid address format");
          process.exit(1);
        }

        const tokenIds = tokenIdsStr
          .split(",")
          .map((id) => parseInt(id.trim()));
        console.log(`🎯 Withdrawing token IDs: [${tokenIds.join(", ")}]`);
        console.log(`📍 Destination: ${multiToAddress}`);

        // Call withdraw for each token individually
        console.log("📦 Processing multiple withdrawals...");
        for (let i = 0; i < tokenIds.length; i++) {
          const id = tokenIds[i];
          console.log(
            `   Withdrawing token ${id}... (${i + 1}/${tokenIds.length})`
          );
          const singleTx = await nftContract.withdraw(multiToAddress, id);
          await singleTx.wait();
          console.log(`   ✅ Token ${id} withdrawn`);
          if (i === tokenIds.length - 1) {
            tx = singleTx; // Use last transaction for final receipt
          }
        }
        break;

      case "all":
        if (restArgs.length < 2) {
          console.log("❌ All mode requires: <userAddress> <toAddress>");
          process.exit(1);
        }
        const [userAddress, allToAddress] = restArgs;

        if (!ethers.isAddress(userAddress) || !ethers.isAddress(allToAddress)) {
          console.log("❌ Invalid address format");
          process.exit(1);
        }

        console.log(`👤 User: ${userAddress}`);
        console.log(`📍 Destination: ${allToAddress}`);

        tx = await nftContract.withdrawAll(userAddress, allToAddress);
        break;
    }

    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log("✅ Withdrawal completed successfully!");
    console.log(`📋 Transaction details:`);
    console.log(`   Hash: ${receipt.hash}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
  } catch (error: any) {
    console.log("❌ Error:", error.message);

    // Handle specific error cases
    if (error.message.includes("Token does not exist")) {
      console.log("💡 Tip: Check if the token ID exists");
    } else if (error.message.includes("User has no tokens")) {
      console.log("💡 Tip: The user has no tokens to withdraw");
    }

    process.exit(1);
  }
}

// Helper function to check user's tokens (can be called separately)
async function checkUserTokens(userAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const nftContract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS!,
    ForestNFTAbi,
    wallet
  );

  try {
    const tokens = await nftContract.tokensOfOwner(userAddress);
    const tokenCount = await nftContract.getUserTokenCount(userAddress);

    console.log(`📊 User ${userAddress} status:`);
    console.log(`   Total tokens: ${tokenCount.toString()}`);
    console.log(`   Token IDs: [${tokens.join(", ")}]`);

    return { tokens, tokenCount };
  } catch (error: any) {
    console.log("❌ Error checking user tokens:", error.message);
    return null;
  }
}

// If script is run with 'check' command, show user tokens
if (process.argv[2] === "check" && process.argv[3]) {
  checkUserTokens(process.argv[3]);
} else {
  withdrawNFT();
}
