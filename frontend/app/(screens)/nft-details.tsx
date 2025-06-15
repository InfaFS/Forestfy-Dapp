import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, ScrollView, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useLocalSearchParams, router } from 'expo-router';
import { NFTBuyAlert } from '@/components/NFTBuyAlert';
import { ConfirmNFTBuyAlert } from '@/components/ConfirmNFTBuyAlert';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';
import { useMarketplaceListing } from '@/hooks/useMarketplaceListing';
import { useUserWalletData } from '@/hooks/useUserWalletData';
import { useWallet } from '@/contexts/WalletContext';
import { useTrees } from '@/contexts/TreesContext';
import { PixelBackButton } from '@/components/common/PixelBackButton';
import { formatPrice, formatAddress, formatDate, extractRarity, getRarityColor } from '@/utils/nftHelpers';
import { NFTBuyButton } from '@/components/marketplace/NFTBuyButton';
import { NOTIFICATION_MESSAGES } from '@/constants/NotificationStyles';
import { DeviceEventEmitter } from 'react-native';

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
}

export default function NFTDetailsScreen() {
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>();
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirmBuy, setShowConfirmBuy] = useState(false);
  const [confirmBuyFunction, setConfirmBuyFunction] = useState<(() => Promise<void>) | null>(null);
  const [isPurchaseInProgress, setIsPurchaseInProgress] = useState(false);
  const [cachedListing, setCachedListing] = useState<Listing | null>(null);

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Convertir tokenId string a bigint
  const tokenIdBigInt = tokenId ? BigInt(tokenId) : BigInt(0);

  // Usar hooks personalizados
  const { metadata, imageUrl, isLoading } = useNFTMetadata(tokenIdBigInt);
  const { listing } = useMarketplaceListing(tokenIdBigInt, { disableAutoRefresh: true });
  const { address, refreshUserData } = useUserWalletData();
  const { refreshBalance } = useWallet();
  const { triggerRefresh: triggerTreesRefresh } = useTrees();

  // Cachear el listing activo cuando se carga por primera vez
  useEffect(() => {
    if (listing && listing.isActive && !cachedListing && !isPurchaseInProgress) {
      setCachedListing(listing);
    }
  }, [listing, cachedListing, isPurchaseInProgress, tokenId]);

  // Función para actualizar datos del comprador con reintentos agresivos
  const updateBuyerDataAfterPurchase = () => {
    console.log('🔄 Actualizando datos del comprador después de compra exitosa...');
    
    // Actualización inmediata
    DeviceEventEmitter.emit('refreshWalletData');
    DeviceEventEmitter.emit('refreshTreesData');
    
    // Reintento después de 1 segundo (confirmación de transacción)
    setTimeout(() => {
      console.log('🔄 Reintento 1 - Actualizando datos del comprador...');
      DeviceEventEmitter.emit('refreshWalletData');
      DeviceEventEmitter.emit('refreshTreesData');
    }, 1000);
    
    // Reintento después de 3 segundos (delay de red)
    setTimeout(() => {
      console.log('🔄 Reintento 2 - Actualizando datos del comprador...');
      DeviceEventEmitter.emit('refreshWalletData');
      DeviceEventEmitter.emit('refreshTreesData');
    }, 3000);
    
    // Reintento después de 5 segundos (asegurar actualización)
    setTimeout(() => {
      console.log('🔄 Reintento 3 - Actualizando datos del comprador...');
      DeviceEventEmitter.emit('refreshWalletData');
      DeviceEventEmitter.emit('refreshTreesData');
    }, 5000);
  };

  const handleBuyStart = (confirmBuyFn: () => Promise<void>) => {
    setIsPurchaseInProgress(true);
    setConfirmBuyFunction(() => confirmBuyFn);
    setShowConfirmBuy(true);
  };

  const handleBuyComplete = async (success: boolean, message: string) => {
    setShowConfirmBuy(false);
    setAlertType(success ? 'success' : 'error');
    
    // Usar mensaje personalizado para compras exitosas
    if (success && currentListing && tokenId) {
      const price = formatPrice(currentListing.price);
      const successMessage = NOTIFICATION_MESSAGES.nftPurchased.getMessage(tokenId, price);
      setAlertMessage(successMessage);
    } else {
      setAlertMessage(message);
    }
    
    setShowAlert(true);
  };

  const handleAlertClose = async () => {
    setShowAlert(false);
    
    // Si la alerta era de éxito, actualizar datos con reintentos y redirigir
    if (alertType === 'success') {
      console.log('🎉 Compra exitosa confirmada, actualizando datos del comprador...');
      
      // Usar el sistema de reintentos agresivos
      updateBuyerDataAfterPurchase();
      
      // Redirigir después de un breve delay para permitir que las actualizaciones comiencen
      setTimeout(() => {
        router.back();
      }, 500);
    }
  };

  const handleConfirmBuyClose = () => {
    setShowConfirmBuy(false);
    setIsPurchaseInProgress(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <PixelBackButton />
          <ThemedView style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Loading NFT details...</ThemedText>
          </ThemedView>
        </ThemedView>
      </ProtectedRoute>
    );
  }

  // Usar listing cacheado si estamos en proceso de compra y el listing original no está activo
  const currentListing = (isPurchaseInProgress && cachedListing) ? cachedListing : listing;

  if (!currentListing || !currentListing.isActive) {
    return (
      <ProtectedRoute>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <PixelBackButton />
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>NFT not found or not listed for sale</ThemedText>
          </ThemedView>
        </ThemedView>
      </ProtectedRoute>
    );
  }

  const rarity = extractRarity(metadata?.attributes);
  const rarityColor = rarity ? getRarityColor(rarity) : '#4CAF50';

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <PixelBackButton />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Imagen del NFT */}
          <ThemedView style={styles.imageContainer}>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.nftImage}
                resizeMode="contain"
              />
            )}
          </ThemedView>

          {/* Información del NFT */}
          <ThemedView style={styles.infoContainer}>
            {isLoading ? (
              <ThemedText style={styles.loadingText}>Loading details...</ThemedText>
            ) : (
              <>
                <ThemedText style={styles.nftName}>
                  {metadata?.name || `NFT #${tokenId}`}
                </ThemedText>

                <ThemedText style={styles.tokenId}>
                  ID: #{tokenId}
                </ThemedText>

                <ThemedText style={styles.descriptionText}>
                  {metadata?.description || 'Forest NFT'}
                </ThemedText>
                
                {/* Rareza si existe */}
                {metadata?.attributes?.map((attr, index) => {
                  if (attr.trait_type.toLowerCase() === 'rarity') {
                    return (
                      <ThemedView key={index} style={styles.rarityContainer}>
                        <ThemedText style={styles.rarityLabel}>Rarity: </ThemedText>
                        <ThemedText style={[styles.rarityValue, { color: getRarityColor(attr.value.toString()) }]}>
                          {attr.value.toString().charAt(0).toUpperCase() + attr.value.toString().slice(1)}
                        </ThemedText>
                      </ThemedView>
                    );
                  }
                  return null;
                })}
                
                {/* Información del listing */}
                <ThemedView style={styles.priceContainer}>
                  <Image 
                    source={require("@/assets/images/coin.png")}
                    style={styles.coinIcon}
                    resizeMode="contain"
                  />
                  <ThemedText style={styles.priceText}>
                    {currentListing ? `${formatPrice(currentListing.price)} FTK` : 'Loading price...'}
                  </ThemedText>
                </ThemedView>

                <ThemedText style={styles.ownerText}>
                  Owner: {currentListing ? formatAddress(currentListing.seller) : 'Loading owner...'}
                </ThemedText>
                
                {currentListing && (
                  <ThemedText style={styles.dateText}>
                    Listed: {new Date(Number(currentListing.listedAt) * 1000).toLocaleDateString()}
                  </ThemedText>
                )}

                {/* Botón de compra */}
                {currentListing && tokenId && (
                  <NFTBuyButton
                    listing={currentListing}
                    tokenId={tokenId}
                    onBuyStart={handleBuyStart}
                    onBuyComplete={handleBuyComplete}
                  />
                )}
              </>
            )}
          </ThemedView>
        </ScrollView>

        {/* Alertas */}
        <NFTBuyAlert
          show={showAlert}
          type={alertType}
          message={alertMessage}
          onClose={handleAlertClose}
        />

        <ConfirmNFTBuyAlert
          show={showConfirmBuy}
          nftName={metadata?.name || `Tree #${tokenId}`}
          price={currentListing ? formatPrice(currentListing.price) : '0'}
          onConfirm={() => {
            if (confirmBuyFunction) {
              confirmBuyFunction();
            }
            handleConfirmBuyClose();
          }}
          onClose={handleConfirmBuyClose}
        />
      </ThemedView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 14,
  },
  imageContainer: {
    height: 250,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderWidth: 3,
    borderColor: '#2d5016',
    marginBottom: 15,
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
  },
  infoContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 3,
    borderColor: '#2d5016',
    padding: 15,
    gap: 8,
  },
  nftName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#2d5016',
    lineHeight: 18,
    textAlign: 'center',
  },
  tokenId: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  rarityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#2d5016',
  },
  rarityValue: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  coinIcon: {
    width: 25,
    height: 25,
    marginRight: 10,
  },
  priceText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#2d5016',
    fontWeight: 'bold',
  },
  ownerText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#4a7c59',
    lineHeight: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
}); 