const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  reclaimReward: `${API_BASE_URL}/reclaim-reward`,
  mintTree: `${API_BASE_URL}/mint`,
  reduceBalance: `${API_BASE_URL}/reduce-balance`,
  claimStaking: `${API_BASE_URL}/claim-staking`,
  claimFirstParcel: `${API_BASE_URL}/claim-first-parcel`,
  buyParcel: `${API_BASE_URL}/add-parcel`,
  buyNFT: `${API_BASE_URL}/buy-nft`,
  listNFT: `${API_BASE_URL}/list-nft`,
  unlistNFT: `${API_BASE_URL}/unlist-nft`,
  registerUser: `${API_BASE_URL}/register-user`,
  changeName: `${API_BASE_URL}/change-name`,
  sendFriendRequest: `${API_BASE_URL}/send-friend-request`,
} as const;

export const reclaimReward = async (address: string) => {
  const response = await fetch(API_ENDPOINTS.reclaimReward, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error("Error al reclamar la recompensa");
  }

  return response.json();
};

export const mintTree = async (address: string, amount: number) => {
  try {
    const response = await fetch(API_ENDPOINTS.mintTree, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, amount }),
    });

    if (!response.ok) {
      throw new Error("Error al mintear el árbol");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const reduceBalance = async (address: string, amount: number) => {
  try {
    const response = await fetch(API_ENDPOINTS.reduceBalance, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, amount }),
    });

    if (!response.ok) {
      throw new Error("Error al reducir el balance");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const claimStaking = async (address: string, amount: number) => {
  try {
    const response = await fetch(API_ENDPOINTS.claimStaking, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, amount }),
    });

    if (!response.ok) {
      throw new Error("Error al reclamar el staking");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const claimFirstParcel = async (address: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.claimFirstParcel, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error("Error al reclamar la primera parcela");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const buyParcel = async (address: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.buyParcel, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error("Error al comprar la parcela");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const buyNFT = async (
  address: string,
  tokenId: string,
  userBalance: number,
  userParcels: number,
  userTokenCount: number,
  nftPrice: number
) => {
  try {
    // Verificar si el balance del usuario es suficiente
    if (userBalance < nftPrice) {
      throw new Error(
        `Insufficient balance. You need ${nftPrice} FTK but only have ${userBalance} FTK`
      );
    }

    // Verificar si el usuario tiene espacio para más árboles (16 árboles por parcela)
    const maxTrees = userParcels * 16;
    if (userTokenCount >= maxTrees) {
      throw new Error(
        `No space for more trees. You need more parcels (max: ${maxTrees} trees)`
      );
    }

    const response = await fetch(API_ENDPOINTS.buyNFT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, tokenId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error purchasing NFT");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const listNFT = async (
  address: string,
  tokenId: string,
  precio: number
) => {
  try {
    const response = await fetch(API_ENDPOINTS.listNFT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, tokenId, precio }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error listing NFT");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const unlistNFT = async (address: string, tokenId: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.unlistNFT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, tokenId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error unlisting NFT");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const registerUser = async (userAddress: string, name: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.registerUser, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al registrar usuario");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const changeName = async (userAddress: string, newName: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.changeName, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress, newName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al cambiar nombre");
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const sendFriendRequest = async (
  fromAddress: string,
  toAddress: string
) => {
  try {
    const response = await fetch(API_ENDPOINTS.sendFriendRequest, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fromAddress, toAddress }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error al enviar solicitud de amistad"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
