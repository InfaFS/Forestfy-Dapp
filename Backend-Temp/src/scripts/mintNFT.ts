import { ethers } from "ethers";
import { ForestNFTAbi } from "../abis/abi";
import dotenv from "dotenv";

dotenv.config();

async function mintNFT() {
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
  if (args.length !== 2) {
    console.log("❌ Usage: ts-node mintNFT.ts <address> <amount>");
    process.exit(1);
  }

  const [address, amount] = args;
  const numberOfNFTs = Number(amount);

  try {
    console.log(`🎨 Iniciando mint de ${numberOfNFTs} NFTs...`);

    for (let i = 0; i < numberOfNFTs; i++) {
      console.log(`\n📦 Minting NFT #${i + 1}...`);
      const mintAmount = 15; // Valor fijo dentro del rango permitido (1.2-6.5)
      console.log(`📊 Cantidad a mintear: ${mintAmount}`);
      const mintTx = await nftContract.mintTo(address, mintAmount);
      await mintTx.wait();
      console.log(`✅ NFT #${i + 1} minteado exitosamente`);
      console.log(`📝 Hash de la transacción: ${mintTx.hash}`);
    }

    console.log("\n✨ Proceso completado exitosamente");
    console.log(`📊 Total de NFTs minteados: ${numberOfNFTs}`);
  } catch (error: any) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  }
}

mintNFT();
