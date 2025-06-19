import React, { createContext, useContext, useState, useEffect } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { DeviceEventEmitter } from 'react-native';
import { NFTContract, UserRegistryContract } from '@/constants/thirdweb';
import { readContract } from 'thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';
import { useUserRegistryEvents } from '@/hooks/useUserRegistryEvents';

export interface Notification {
  id: string;
  type: 'nft_sold' | 'nft_bought' | 'nft_listed' | 'nft_unlisted' | 'friend_request_received' | 'friend_request_accepted';
  title: string;
  message: string;
  timestamp: number;
  tokenId?: string;
  price?: string;
  buyer?: string;
  seller?: string;
  fromUser?: string;
  toUser?: string;
  onDismiss?: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Función para formatear tokens de manera amigable
const formatTokenAmount = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  
  // Si es muy pequeño (notación científica), convertir desde wei
  if (numAmount < 0.001 && numAmount > 0) {
    const fromWei = numAmount * 1e18;
    return fromWei.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }
  
  // Para números normales, formatear con decimales apropiados
  return numAmount.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  });
};

// Función para obtener el nombre de usuario por dirección
const getUserName = async (userAddress: string): Promise<string> => {
  try {
    const userInfo = await readContract({
      contract: UserRegistryContract,
      method: "function getUserInfo(address) view returns (string name, address userAddress, bool exists, address[] friends, uint256 createdAt)",
      params: [userAddress],
    });
    
    // userInfo[0] es el nombre, userInfo[2] es el exists flag
    if (userInfo[2] && userInfo[0]) { // exists && name
      return userInfo[0];
    } else {
      return `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    }
  } catch (error) {
    console.error("Error getting user name:", error);
    return `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  }
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<Set<string>>(new Set());
  const activeAccount = useActiveAccount();

  // Get user's NFT data to check ownership
  const { data: userNFTs } = useReadContract({
    contract: NFTContract,
    method: "function tokensOfOwner(address owner) view returns (uint256[] memory)",
    params: [activeAccount?.address || ""],
    queryOptions: {
      enabled: !!activeAccount?.address,
    },
  });

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove notification after 10 seconds if no onDismiss callback
    if (!notification.onDismiss) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.onDismiss) {
        notification.onDismiss();
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Función para actualizar el balance del vendedor con reintentos agresivos
  const updateSellerBalance = () => {
    console.log('🔄 Actualizando balance del vendedor después de venta confirmada...');
    
    // Actualización inmediata
    DeviceEventEmitter.emit('refreshWalletData');
    
    // Reintento después de 1 segundo (confirmación de transacción)
    setTimeout(() => {
      console.log('🔄 Reintento 1 - Actualizando balance del vendedor...');
      DeviceEventEmitter.emit('refreshWalletData');
    }, 1000);
    
    // Reintento después de 3 segundos (delay de red)
    setTimeout(() => {
      console.log('🔄 Reintento 2 - Actualizando balance del vendedor...');
      DeviceEventEmitter.emit('refreshWalletData');
    }, 3000);
    
    // Reintento después de 5 segundos (asegurar actualización)
    setTimeout(() => {
      console.log('🔄 Reintento 3 - Actualizando balance del vendedor...');
      DeviceEventEmitter.emit('refreshWalletData');
    }, 5000);
    
    // También actualizar otros datos relacionados
    setTimeout(() => {
      console.log('🔄 Actualizando datos relacionados (árboles y marketplace)...');
      // Trigger refresh de árboles/parcelas por si afecta
      DeviceEventEmitter.emit('refreshTreesData');
      // Trigger refresh del marketplace
      DeviceEventEmitter.emit('refreshMarketplaceData');
    }, 1500);
    
    // Segundo refresh de datos relacionados
    setTimeout(() => {
      console.log('🔄 Segundo refresh de datos relacionados...');
      DeviceEventEmitter.emit('refreshTreesData');
      DeviceEventEmitter.emit('refreshMarketplaceData');
    }, 4000);
  };

  // Función para actualizar datos sociales con reintentos
  const updateSocialData = () => {
    console.log('🔄 Actualizando datos sociales después de evento de amistad...');
    
    // Actualización inmediata
    DeviceEventEmitter.emit('refreshSocialData');
    
    // Reintento después de 1 segundo
    setTimeout(() => {
      console.log('🔄 Reintento 1 - Actualizando datos sociales...');
      DeviceEventEmitter.emit('refreshSocialData');
    }, 1000);
    
    // Reintento después de 3 segundos
    setTimeout(() => {
      console.log('🔄 Reintento 2 - Actualizando datos sociales...');
      DeviceEventEmitter.emit('refreshSocialData');
    }, 3000);
  };

  // Listen to marketplace events - SOLO para ventas del usuario
  useMarketplaceEvents({
    onNFTListed: () => {
      // No mostrar notificación para listar NFTs
    },
    onNFTUnlisted: () => {
      // No mostrar notificación para deslistar NFTs
    },
    onNFTSold: (tokenId, seller, buyer, price) => {
      if (!activeAccount?.address) return;
      
      const userAddress = activeAccount.address.toLowerCase();
      const sellerAddress = seller.toLowerCase();
      
      // SOLO mostrar notificación cuando el usuario vende un NFT
      if (sellerAddress === userAddress) {
        // Crear un ID único para esta transacción específica
        const transactionId = `${tokenId}-${sellerAddress}-${buyer.toLowerCase()}-${price}`;
        
        // Verificar si ya procesamos esta transacción
        if (processedTransactions.has(transactionId)) {
          console.log('🔄 Transacción ya procesada, evitando duplicado:', transactionId);
          return;
        }
        
        // Marcar como procesada
        setProcessedTransactions(prev => new Set([...prev, transactionId]));
        
        // Formatear el precio correctamente
        const formattedPrice = formatTokenAmount(Number(price) / 1e18);
        
        console.log('🎉 Agregando notificación de venta:', {
          tokenId: tokenId.toString(),
          price: formattedPrice,
          seller,
          buyer
        });
        
        addNotification({
          type: 'nft_sold',
          title: 'NFT Sold!',
          message: `Your NFT #${tokenId} was sold for ${formattedPrice} FTK`,
          tokenId: tokenId.toString(),
          price: formattedPrice,
          buyer,
          seller,
          onDismiss: () => {
            // Actualizar balance del vendedor cuando acepta la notificación
            console.log('🔄 Actualizando balance del vendedor después de venta confirmada...');
            updateSellerBalance();
          },
        });
      }
      // No mostrar notificación cuando el usuario compra un NFT
    },
  });

  // Listen to UserRegistry events - SOLO para eventos dirigidos al usuario
  useUserRegistryEvents({
    onFriendRequestSent: async (from, to) => {
      if (!activeAccount?.address) return;
      
      const userAddress = activeAccount.address.toLowerCase();
      const toAddress = to.toLowerCase();
      
      // SOLO mostrar notificación cuando el usuario RECIBE una solicitud
      if (toAddress === userAddress) {
        // Crear un ID único para esta solicitud específica
        const requestId = `${from.toLowerCase()}-${toAddress}`;
        
        // Verificar si ya procesamos esta solicitud
        if (processedTransactions.has(requestId)) {
          console.log('🔄 Solicitud ya procesada, evitando duplicado:', requestId);
          return;
        }
        
        // Marcar como procesada
        setProcessedTransactions(prev => new Set([...prev, requestId]));
        
        // Obtener el nombre del usuario que envió la solicitud
        const fromUserName = await getUserName(from);
        
        console.log('👫 Agregando notificación de solicitud de amistad:', {
          from,
          to,
          fromUserName
        });
        
        addNotification({
          type: 'friend_request_received',
          title: 'New Friend Request!',
          message: `${fromUserName} wants to be your friend`,
          fromUser: from,
          toUser: to,
          onDismiss: () => {
            // Actualizar datos sociales cuando acepta la notificación
            console.log('🔄 Actualizando datos sociales después de notificación de solicitud...');
            updateSocialData();
          },
        });
      }
    },
    onFriendRequestAccepted: async (from, to) => {
      if (!activeAccount?.address) return;
      
      const userAddress = activeAccount.address.toLowerCase();
      const fromAddress = from.toLowerCase();
      const toAddress = to.toLowerCase();
      
      // Actualizar datos sociales para cualquier usuario involucrado en la aceptación
      if (fromAddress === userAddress || toAddress === userAddress) {
        // Siempre actualizar datos sociales cuando el usuario actual está involucrado
        console.log('🔄 Actualizando datos sociales para usuario involucrado en aceptación de amistad...');
        updateSocialData();
      }
      
      // SOLO mostrar notificación cuando el usuario que ENVIÓ la solicitud es notificado de la aceptación
      if (fromAddress === userAddress) {
        // Crear un ID único para esta aceptación específica
        const acceptedId = `accepted-${fromAddress}-${to.toLowerCase()}`;
        
        // Verificar si ya procesamos esta aceptación
        if (processedTransactions.has(acceptedId)) {
          console.log('🔄 Aceptación ya procesada, evitando duplicado:', acceptedId);
          return;
        }
        
        // Marcar como procesada
        setProcessedTransactions(prev => new Set([...prev, acceptedId]));
        
        // Obtener el nombre del usuario que aceptó la solicitud
        const toUserName = await getUserName(to);
        
        console.log('🎉 Agregando notificación de aceptación de amistad:', {
          from,
          to,
          toUserName
        });
        
        addNotification({
          type: 'friend_request_accepted',
          title: 'Friend Request Accepted!',
          message: `${toUserName} accepted your friend request`,
          fromUser: from,
          toUser: to,
          onDismiss: () => {
            // Actualizar datos sociales cuando acepta la notificación
            console.log('🔄 Actualizando datos sociales después de notificación de aceptación...');
            updateSocialData();
          },
        });
      }
    },
    onFriendAdded: async (user1, user2) => {
      if (!activeAccount?.address) return;
      
      const userAddress = activeAccount.address.toLowerCase();
      const user1Address = user1.toLowerCase();
      const user2Address = user2.toLowerCase();
      
      // Actualizar datos sociales si el usuario actual está involucrado en la adición de amistad
      if (user1Address === userAddress || user2Address === userAddress) {
        console.log('🔄 Actualizando datos sociales para usuario involucrado en adición de amistad...');
        updateSocialData();
      }
    },
    // No mostrar notificaciones para cancelaciones o eliminaciones de amigos
  });

  // Limpiar transacciones procesadas cada 5 minutos para evitar memory leaks
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessedTransactions(new Set());
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 