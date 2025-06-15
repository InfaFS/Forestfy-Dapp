import React, { createContext, useContext, useState, useEffect } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { DeviceEventEmitter } from 'react-native';
import { NFTContract } from '@/constants/thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';

export interface Notification {
  id: string;
  type: 'nft_sold' | 'nft_bought' | 'nft_listed' | 'nft_unlisted';
  title: string;
  message: string;
  timestamp: number;
  tokenId?: string;
  price?: string;
  buyer?: string;
  seller?: string;
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