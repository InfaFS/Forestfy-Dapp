import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { MarketplaceContract, NFTContract, TokenContract } from '@/constants/thirdweb';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router, useLocalSearchParams } from 'expo-router';
import { buyNFT } from '@/constants/api';
import { NFTBuyAlert } from '@/components/NFTBuyAlert';
import { ConfirmNFTBuyAlert } from '@/components/ConfirmNFTBuyAlert';
import { useTrees } from '@/contexts/TreesContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export default function NFTDetailsScreen() {
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirmBuy, setShowConfirmBuy] = useState(false);

  // Obtener cuenta activa
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address || '';

  // Contextos para refrescar datos
  const { triggerRefresh: triggerTreesRefresh } = useTrees();
  const { triggerRefresh: triggerMarketplaceRefresh } = useMarketplace();

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Convertir tokenId string a bigint
  const tokenIdBigInt = tokenId ? BigInt(tokenId) : BigInt(0);

  // Obtener URI del NFT
  const { data: uriData } = useReadContract({
    contract: NFTContract,
    method: "function tokenURI(uint256 tokenId) view returns (string memory)",
    params: [tokenIdBigInt],
  });

  // Obtener detalles del listing
  const { data: listingData } = useReadContract({
    contract: MarketplaceContract,
    method: "function getListing(uint256 tokenId) view returns ((uint256 tokenId, address seller, uint256 price, bool isActive, uint256 listedAt))",
    params: [tokenIdBigInt],
  });

  // Obtener balance del usuario
  const { data: balanceData } = useReadContract({
    contract: TokenContract,
    method: "function virtualBalance(address user) view returns (uint256)",
    params: [address],
  });

  // Obtener parcelas del usuario
  const { data: parcelData } = useReadContract({
    contract: NFTContract,
    method: "function getUserParcels(address user) view returns (uint256)",
    params: [address],
  });

  // Obtener cantidad de tokens del usuario
  const { data: tokenCountData } = useReadContract({
    contract: NFTContract,
    method: "function getUserTokenCount(address user) view returns (uint256)",
    params: [address],
  });

  // Cargar metadata del NFT
  useEffect(() => {
    async function fetchMetadata() {
      if (!uriData) return;

      try {
        const uri = uriData.toString();
        const httpsUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        
        const response = await fetch(httpsUri);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setMetadata(data);

        if (data.image) {
          const imageUri = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          setImageUrl(imageUri);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, [uriData]);

  // Procesar datos del listing
  useEffect(() => {
    if (listingData) {
      console.log('NFT Details - Listing data received:', listingData);
      // Los datos ahora vienen como objeto desde el contrato
      const listing = listingData as {
        tokenId: bigint;
        seller: string;
        price: bigint;
        isActive: boolean;
        listedAt: bigint;
      };
      console.log('NFT Details - Processed listing:', listing);
      setListing(listing);
    } else {
      console.log('NFT Details - No listing data for token:', tokenId);
    }
  }, [listingData, tokenId]);

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1e18).toFixed(2);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleBuy = () => {
    if (!listing || !address || !tokenId) {
      setAlertType('error');
      setAlertMessage('Insufficient information to proceed with purchase');
      setShowAlert(true);
      return;
    }

    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      setAlertType('error');
      setAlertMessage('You cannot buy your own NFT');
      setShowAlert(true);
      return;
    }

    // Mostrar confirmación antes de comprar
    setShowConfirmBuy(true);
  };

  const handleConfirmBuy = async () => {
    if (!listing || !address || !tokenId) return;
    
    setIsBuying(true);

    try {
      const userBalance = balanceData ? Number(balanceData) / 1e18 : 0;
      const userParcels = parcelData ? Number(parcelData) : 0;
      const userTokenCount = tokenCountData ? Number(tokenCountData) : 0;
      const nftPrice = Number(listing.price) / 1e18;

      console.log('Purchase Debug Info:');
      console.log('- User Balance:', userBalance, 'FTK');
      console.log('- User Parcels:', userParcels);
      console.log('- User Token Count:', userTokenCount);
      console.log('- NFT Price:', nftPrice, 'FTK');
      console.log('- Balance Data Raw:', balanceData?.toString());

      await buyNFT(address, tokenId, userBalance, userParcels, userTokenCount, nftPrice);

      // Refrescar datos de parcelas y marketplace después de la compra exitosa
      triggerTreesRefresh();
      triggerMarketplaceRefresh();

      setAlertType('success');
      setAlertMessage('You have successfully purchased the NFT!');
      setShowAlert(true);
    } catch (error: any) {
      setAlertType('error');
      setAlertMessage(error.message || 'Error purchasing NFT');
      setShowAlert(true);
    } finally {
      setIsBuying(false);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertType === 'success') {
      router.back();
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '#FFD700'; // Dorado
      case 'rare':
        return '#4169E1'; // Azul
      default:
        return '#4CAF50'; // Verde
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Imagen del NFT */}
          <View style={styles.imageContainer}>
            {imageUrl && (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.nftImage}
                resizeMode="contain"
              />
            )}
          </View>
          
          {/* Información del NFT */}
          <View style={styles.detailsContainer}>
            {isLoading ? (
              <ThemedText style={styles.loadingText}>Loading details...</ThemedText>
            ) : (
              <>
                <ThemedText style={styles.nftName}>
                  {metadata?.name || `NFT #${tokenId}`}
                </ThemedText>
                
                <ThemedText style={styles.nftId}>
                  ID: #{tokenId}
                </ThemedText>
                
                <ThemedText style={styles.nftDescription}>
                  {metadata?.description || 'Forest NFT'}
                </ThemedText>
                
                {/* Rareza si existe */}
                {metadata?.attributes?.map((attr, index) => {
                  if (attr.trait_type.toLowerCase() === 'rarity') {
                    return (
                      <View key={index} style={styles.rarityContainer}>
                        <ThemedText style={styles.rarityLabel}>Rarity: </ThemedText>
                        <ThemedText style={[styles.rarityValue, { color: getRarityColor(attr.value.toString()) }]}>
                          {attr.value.toString().charAt(0).toUpperCase() + attr.value.toString().slice(1)}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })}
                
                {/* Información del listing */}
                <View style={styles.priceContainer}>
                  <Image 
                    source={require("@/assets/images/coin.png")}
                    style={styles.coinIcon}
                    resizeMode="contain"
                  />
                  <ThemedText style={styles.priceText}>
                    {listing ? `${formatPrice(listing.price)} FTK` : 'Loading price...'}
                  </ThemedText>
                </View>
                
                <ThemedText style={styles.ownerText}>
                  Owner: {listing ? formatAddress(listing.seller) : 'Loading owner...'}
                </ThemedText>
                
                {listing && (
                  <ThemedText style={styles.dateText}>
                    Listed: {new Date(Number(listing.listedAt) * 1000).toLocaleDateString()}
                  </ThemedText>
                )}
                
                {/* Botón Comprar */}
                <TouchableOpacity 
                  style={[styles.buyButton, isBuying && styles.buyButtonDisabled]} 
                  onPress={handleBuy}
                  disabled={isBuying}
                >
                  <Image 
                    source={require("@/assets/images/coin.png")}
                    style={styles.buyButtonIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.buyButtonTextContainer}>
                    <ThemedText style={styles.buyButtonText}>
                      {isBuying ? 'Buying...' : 'Buy Now'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
        
        <NFTBuyAlert
          show={showAlert}
          onClose={handleAlertClose}
          type={alertType}
          message={alertMessage}
        />
        
        <ConfirmNFTBuyAlert
          show={showConfirmBuy}
          onClose={() => setShowConfirmBuy(false)}
          onConfirm={handleConfirmBuy}
          nftName={metadata?.name || `NFT #${tokenId}`}
          price={listing ? formatPrice(listing.price) : '0'}
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4a7c59',
    borderWidth: 2,
    borderColor: '#2d5016',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  backButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  detailsContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 3,
    borderColor: '#2d5016',
    padding: 15,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
    textAlign: 'center',
  },
  nftName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#2d5016',
    lineHeight: 18,
    textAlign: 'center',
  },
  nftId: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  nftDescription: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#4a7c59',
    lineHeight: 12,
    textAlign: 'center',
    marginBottom: 8,
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
  buyButton: {
    backgroundColor: '#4a7c59',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderWidth: 3,
    borderColor: '#2d5016',
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
  buyButtonDisabled: {
    backgroundColor: '#999999',
    borderColor: '#666666',
  },
  buyButtonIcon: {
    width: 30,
    height: 30,
    position: 'absolute',
    left: 30,
  },
  buyButtonTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
}); 