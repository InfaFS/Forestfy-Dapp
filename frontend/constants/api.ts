const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  reclaimReward: `${API_BASE_URL}/reclaim-reward`,
  mintTree: `${API_BASE_URL}/mint`,
  reduceBalance: `${API_BASE_URL}/reduce-balance`,
  claimStaking: `${API_BASE_URL}/claim-staking`,
  claimFirstParcel: `${API_BASE_URL}/claim-first-parcel`,
  buyParcel: `${API_BASE_URL}/add-parcel`,
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
