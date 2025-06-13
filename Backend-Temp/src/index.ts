import express, { Request, Response, Router, RequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { ForestNFTAbi, ForestTokenAbi } from "./abis/abi";
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

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
