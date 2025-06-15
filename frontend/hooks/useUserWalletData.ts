import { useReadContract, useActiveAccount } from "thirdweb/react";
import { TokenContract, NFTContract } from "@/constants/thirdweb";

export function useUserWalletData() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address || "";

  // Obtener balance del usuario
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    contract: TokenContract,
    method: "function virtualBalance(address user) view returns (uint256)",
    params: [address],
  });

  // Obtener parcelas del usuario
  const { data: parcelData, refetch: refetchParcels } = useReadContract({
    contract: NFTContract,
    method: "function getUserParcels(address user) view returns (uint256)",
    params: [address],
  });

  // Obtener cantidad de tokens del usuario
  const { data: tokenCountData, refetch: refetchTokenCount } = useReadContract({
    contract: NFTContract,
    method: "function getUserTokenCount(address user) view returns (uint256)",
    params: [address],
  });

  // Función para refrescar todos los datos del usuario
  const refreshUserData = async () => {
    try {
      await Promise.all([
        refetchBalance(),
        refetchParcels(),
        refetchTokenCount(),
      ]);
      console.log("✅ Datos del usuario actualizados");
    } catch (error) {
      console.error("❌ Error actualizando datos del usuario:", error);
    }
  };

  return {
    address,
    balanceData,
    parcelData,
    tokenCountData,
    userBalance: balanceData ? Number(balanceData) / 1e18 : 0,
    userParcels: parcelData ? Number(parcelData) : 0,
    userTokenCount: tokenCountData ? Number(tokenCountData) : 0,
    refetchBalance,
    refetchParcels,
    refetchTokenCount,
    refreshUserData,
  };
}
