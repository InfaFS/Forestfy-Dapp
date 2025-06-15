import express, { Request, Response, Router, RequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { ForestNFTAbi, ForestTokenAbi, FrestMarketplaceAbi } from "./abis/abi";
import path from "path";

// Configurar dotenv con la ruta absoluta al archivo .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const router = Router();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Initialize both contracts
const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS!,
  ForestNFTAbi,
  wallet
);

const tokenContract = new ethers.Contract(
  process.env.TOKEN_CONTRACT_ADDRESS!,
  ForestTokenAbi,
  wallet
);

const marketplaceContract = new ethers.Contract(
  process.env.MARKETPLACE_CONTRACT_ADDRESS!,
  FrestMarketplaceAbi,
  wallet
);

// Helper function to validate address and amount
const validateMintRequest = (address: string, amount: number) => {
  if (!address) {
    return { valid: false, error: "Address is required" };
  }
  if (!amount || amount <= 0) {
    return { valid: false, error: "Valid amount is required" };
  }
  return { valid: true };
};

// Helper function to check virtual balance
const checkVirtualBalance = async (address: string, amount: string) => {
  const amountInWei = ethers.parseUnits(amount, 18);
  const virtualBalance = await tokenContract.virtualBalance(address);

  if (virtualBalance < amountInWei) {
    return {
      sufficient: false,
      currentBalance: ethers.formatUnits(virtualBalance, 18),
      requiredAmount: amount,
    };
  }

  return { sufficient: true, amountInWei };
};

router.post("/mint", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de mint recibida");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Error de validación:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    console.log("🎨 Minteando NFT...");
    const mintAmount = Math.round(amount * 10);
    console.log(`📊 Cantidad a mintear: ${mintAmount}`);
    const mintTx = await nftContract.mintTo(address, mintAmount);
    await mintTx.wait();
    console.log("✅ NFT minteado exitosamente");

    res.json({
      success: true,
      mintHash: mintTx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/reclaim-reward", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de reclaim reward recibida");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Check if user has already claimed reward
    const hasClaimedReward = await tokenContract.hasClaimedReward(address);
    if (hasClaimedReward) {
      console.log("❌ Usuario ya reclamó su reward inicial");
      res.status(400).json({ error: "Initial reward already claimed" });
      return;
    }

    console.log("🎁 Reclamando reward inicial...");
    const tx = await tokenContract.claimInitialReward(address);
    await tx.wait();
    console.log("✅ Reward reclamado exitosamente");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de withdraw recibida");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Error de validación:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    // Check virtual balance
    const balanceCheck = await checkVirtualBalance(address, amount.toString());
    if (!balanceCheck.sufficient) {
      console.log("❌ Balance insuficiente");
      res.status(400).json({
        error: "Insufficient balance",
        currentBalance: balanceCheck.currentBalance,
        requiredAmount: balanceCheck.requiredAmount,
      });
      return;
    }

    console.log("💸 Ejecutando withdraw...");
    const tx = await tokenContract.withdraw(address, balanceCheck.amountInWei);
    await tx.wait();
    console.log("✅ Withdraw completado exitosamente");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/reduce-balance", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de reduce balance recibida");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Error de validación:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    console.log("💸 Ejecutando reduce balance...");
    const tx = await tokenContract.reduceBalance(address, amountInWei);
    await tx.wait();
    console.log("✅ Reduce balance completado exitosamente");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/claim-staking", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de claim staking recibida");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Error de validación:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    console.log("🎁 Ejecutando claim staking...");
    const tx = await tokenContract.claimStaking(address, amountInWei);
    await tx.wait();
    console.log("✅ Claim staking completado exitosamente");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-parcel", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de add parcel recibida");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Verificar que el usuario tenga al menos 5 tokens virtuales
    const virtualBalance = await tokenContract.virtualBalance(address);
    const requiredAmount = ethers.parseUnits("5", 18); // 5 tokens

    if (virtualBalance < requiredAmount) {
      console.log("❌ Balance insuficiente para comprar parcela");
      res.status(400).json({
        error: "Insufficient balance to buy parcel",
        required: "5",
        current: ethers.formatUnits(virtualBalance, 18),
      });
      return;
    }

    console.log("💸 Reduciendo 5 tokens del balance...");
    const reduceTx = await tokenContract.reduceBalance(address, requiredAmount);
    await reduceTx.wait();
    console.log("✅ Tokens reducidos exitosamente");

    console.log("🏞️ Agregando parcela...");
    const addTx = await nftContract.addParcels(address, 1);
    await addTx.wait();
    console.log("✅ Parcela agregada exitosamente");

    res.json({
      success: true,
      reduceHash: reduceTx.hash,
      addParcelHash: addTx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/claim-first-parcel", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de claim first parcel recibida");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Check if user already has parcels using userParcels mapping
    const userParcels = await nftContract.userParcels(address);
    if (userParcels > 0) {
      console.log("❌ Usuario ya tiene parcelas");
      res.status(400).json({ error: "User already has parcels" });
      return;
    }

    console.log("🏞️ Agregando parcel...");
    const tx = await nftContract.addParcels(address, 1);
    await tx.wait();
    console.log("✅ Parcel agregado exitosamente");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/list-nft", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de list NFT recibida");

  try {
    const { address, tokenId, precio } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID no proporcionado");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    if (!precio || precio <= 0) {
      console.log("❌ Error: Precio no válido");
      res.status(400).json({ error: "Valid price is required" });
      return;
    }

    // Convertir precio a Wei (asumimos que el precio está en tokens)
    const priceInWei = ethers.parseUnits(precio.toString(), 18);

    console.log(`🏷️ Listando NFT en marketplace...`);
    console.log(`📍 Address: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);
    console.log(`💰 Precio: ${precio} tokens`);

    // Llamar al método listNFT del contrato Marketplace
    const tx = await marketplaceContract.listNFT(address, tokenId, priceInWei);
    await tx.wait();

    console.log("✅ NFT listado exitosamente en el marketplace");

    res.json({
      success: true,
      hash: tx.hash,
      seller: address,
      tokenId: tokenId,
      price: precio,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/unlist-nft", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de unlist NFT recibida");

  try {
    const { address, tokenId } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID no proporcionado");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    console.log(`🚫 Removiendo NFT del marketplace...`);
    console.log(`📍 Address: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);

    // Llamar al método unlistNFT del contrato Marketplace
    const tx = await marketplaceContract.unlistNFT(address, tokenId);
    await tx.wait();

    console.log("✅ NFT removido exitosamente del marketplace");

    res.json({
      success: true,
      hash: tx.hash,
      seller: address,
      tokenId: tokenId,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-listings/:address", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición para obtener listings de usuario");

  try {
    const { address } = req.params;

    // Validar que el address esté presente
    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Validar formato de address (básico)
    if (!ethers.isAddress(address)) {
      console.log("❌ Error: Address no válido");
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    console.log(`🔍 Obteniendo listings para address: ${address}`);

    // Obtener los tokenIds listados por el usuario
    const userTokenIds = await marketplaceContract.getUserListings(address);
    console.log(`📋 Token IDs encontrados: ${userTokenIds.length}`);

    if (userTokenIds.length === 0) {
      console.log("📭 No se encontraron listings para este usuario");
      res.json({
        success: true,
        address: address,
        listings: [],
        totalListings: 0,
      });
      return;
    }

    // Obtener detalles de cada listing
    const listings = [];
    for (const tokenId of userTokenIds) {
      try {
        const listing = await marketplaceContract.getListing(tokenId);

        // Solo incluir listings activos
        if (listing.isActive) {
          listings.push({
            tokenId: listing.tokenId.toString(),
            seller: listing.seller,
            price: ethers.formatUnits(listing.price, 18), // Convertir de Wei a tokens
            priceWei: listing.price.toString(),
            isActive: listing.isActive,
            listedAt: listing.listedAt.toString(),
            listedAtDate: new Date(
              Number(listing.listedAt) * 1000
            ).toISOString(),
          });
        }
      } catch (error) {
        console.log(
          `⚠️ Error obteniendo detalles del token ${tokenId}:`,
          error
        );
        // Continuar con el siguiente token en caso de error
      }
    }

    console.log(`✅ Listings activos encontrados: ${listings.length}`);

    res.json({
      success: true,
      address: address,
      listings: listings,
      totalListings: listings.length,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/buy-nft", async (req: Request, res: Response) => {
  console.log("📥 Nueva petición de compra de NFT recibida");

  try {
    const { address, tokenId } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address no proporcionado");
      res.status(400).json({ error: "Buyer address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID no proporcionado");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    // Validar formato de address
    if (!ethers.isAddress(address)) {
      console.log("❌ Error: Address no válido");
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    console.log(`🛒 Comprando NFT...`);
    console.log(`👤 Comprador: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);

    // Obtener detalles del listing antes de la compra para logs
    try {
      const listing = await marketplaceContract.getListing(tokenId);
      if (!listing.isActive) {
        console.log("❌ Error: NFT no está listado");
        res.status(400).json({ error: "NFT is not listed for sale" });
        return;
      }

      const listingPriceInTokens = ethers.formatUnits(listing.price, 18);
      console.log(`💰 Precio: ${listingPriceInTokens} tokens`);
      console.log(`👨‍💼 Vendedor: ${listing.seller}`);

      // Verificar que el comprador no sea el vendedor
      if (listing.seller.toLowerCase() === address.toLowerCase()) {
        console.log("❌ Error: No se puede comprar propio NFT");
        res.status(400).json({ error: "Cannot buy your own NFT" });
        return;
      }

      // Verificar que el comprador tenga espacio disponible en sus parcelas
      const userParcels = await nftContract.getUserParcels(address);
      const currentTrees = await nftContract.getUserTokenCount(address);
      const treesPerParcel = 16; // TREES_PER_PARCEL constante del contrato
      const maxTreesAllowed = userParcels * treesPerParcel;

      console.log(`🏞️ Parcelas del comprador: ${userParcels}`);
      console.log(`🌳 Árboles actuales: ${currentTrees}`);
      console.log(`📊 Máximo permitido: ${maxTreesAllowed}`);

      if (currentTrees >= maxTreesAllowed) {
        console.log("❌ Error: Comprador no tiene espacio en sus parcelas");
        res.status(400).json({
          error: "Not enough parcel space to buy this NFT",
          currentTrees: currentTrees.toString(),
          maxTreesAllowed: maxTreesAllowed.toString(),
          userParcels: userParcels.toString(),
        });
        return;
      }

      // Verificar que el comprador tenga fondos suficientes
      const buyerBalance = await tokenContract.virtualBalance(address);
      const priceInTokens = ethers.formatUnits(listing.price, 18);
      const balanceInTokens = ethers.formatUnits(buyerBalance, 18);

      console.log(`💰 Precio del NFT: ${priceInTokens} tokens`);
      console.log(`🏦 Balance del comprador: ${balanceInTokens} tokens`);

      if (buyerBalance < listing.price) {
        console.log("❌ Error: Fondos insuficientes para comprar el NFT");
        res.status(400).json({
          error: "Insufficient token balance to buy this NFT",
          required: priceInTokens,
          current: balanceInTokens,
          shortfall: ethers.formatUnits(listing.price - buyerBalance, 18),
        });
        return;
      }

      // Llamar al método buyNFT del contrato Marketplace
      const tx = await marketplaceContract.buyNFT(address, tokenId);
      await tx.wait();

      console.log("✅ NFT comprado exitosamente");

      res.json({
        success: true,
        hash: tx.hash,
        buyer: address,
        seller: listing.seller,
        tokenId: tokenId,
        price: listingPriceInTokens,
        priceWei: listing.price.toString(),
      });
    } catch (listingError: any) {
      console.log(
        "❌ Error obteniendo detalles del listing:",
        listingError.message
      );

      // Intentar la compra de todas formas, por si el error es solo de consulta
      try {
        const tx = await marketplaceContract.buyNFT(address, tokenId);
        await tx.wait();

        console.log("✅ NFT comprado exitosamente (sin detalles previos)");

        res.json({
          success: true,
          hash: tx.hash,
          buyer: address,
          tokenId: tokenId,
        });
      } catch (buyError: any) {
        throw buyError; // Re-lanzar el error de compra
      }
    }
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Insufficient token balance")) {
      errorMessage = "Insufficient token balance to buy this NFT";
    } else if (err.message.includes("Listing not active")) {
      errorMessage = "NFT is not listed for sale";
    } else if (err.message.includes("Cannot buy your own NFT")) {
      errorMessage = "Cannot buy your own NFT";
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
