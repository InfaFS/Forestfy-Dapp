import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { MarketplaceContract, NFTContract } from '@/constants/thirdweb';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router } from 'expo-router';

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

export default function MarketplaceScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const account = useActiveAccount();

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Obtener IDs de los NFTs listados activos
  const { data: activeListingIds, isPending: loadingIds, refetch: refetchIds } = useReadContract({
    contract: MarketplaceContract,
    method: "function getActiveListings() view returns (uint256[] memory)",
    params: [],
  });

  // Los detalles se obtienen directamente en MarketplaceNFTItem usando useReadContract

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchIds();
    } catch (error) {
      console.error('Error refreshing listings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!fontsLoaded) {
    return null;
  }

  // Verificar que el contrato esté disponible
  if (!MarketplaceContract) {
    return (
      <ProtectedRoute>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              Marketplace
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Marketplace not available. Please check configuration.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Marketplace
          </ThemedText>
        </ThemedView>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#4a7c59"
            />
          }
        >
          {loadingIds ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading marketplace...</ThemedText>
            </ThemedView>
          ) : activeListingIds && activeListingIds.length > 0 ? (
            <>
              <ThemedText style={styles.countText}>
                {activeListingIds.length} NFTs listed
              </ThemedText>
              {activeListingIds.map((tokenId, index) => (
                <MarketplaceNFTItem key={index} tokenId={tokenId} />
              ))}
            </>
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <Image
                source={require("@/assets/images/marchitado.png")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
                             <ThemedText style={styles.emptyText}>
                 Everything is very quiet around here...
               </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </ProtectedRoute>
  );
}

// Componente para mostrar cada NFT del marketplace
function MarketplaceNFTItem({ tokenId }: { tokenId: bigint }) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener URI del NFT
  const { data: uriData } = useReadContract({
    contract: NFTContract,
    method: "function tokenURI(uint256 tokenId) view returns (string memory)",
    params: [tokenId],
  });

  // Obtener detalles del listing
  const { data: listingData } = useReadContract({
    contract: MarketplaceContract,
    method: "function getListing(uint256 tokenId) view returns ((uint256 tokenId, address seller, uint256 price, bool isActive, uint256 listedAt))",
    params: [tokenId],
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
      console.log('Listing data received:', listingData);
      // Los datos ahora vienen como objeto desde el contrato
      const listing = listingData as {
        tokenId: bigint;
        seller: string;
        price: bigint;
        isActive: boolean;
        listedAt: bigint;
      };
      console.log('Processed listing:', listing);
      setListing(listing);
    } else {
      console.log('No listing data for token:', tokenId.toString());
    }
  }, [listingData, tokenId]);

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1e18).toFixed(2);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePress = () => {
    router.push({
      pathname: '/(screens)/nft-details',
      params: { tokenId: tokenId.toString() }
    });
  };

  return (
    <TouchableOpacity style={styles.nftContainer} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {imageUrl && (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.nftImage}
            resizeMode="contain"
          />
        )}
      </View>
      
      <View style={styles.nftContent}>
        {isLoading ? (
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        ) : (
          <>
            <ThemedText style={styles.nftName}>
              {metadata?.name || `NFT #${tokenId.toString()}`}
            </ThemedText>
            <ThemedText style={styles.nftId}>
              ID: #{tokenId.toString()}
            </ThemedText>
            
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
          </>
        )}
      </View>
    </TouchableOpacity>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
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
  countText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#2d5016',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderWidth: 2,
    borderColor: '#4a7c59',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    textAlign: 'center',
    color: '#4a7c59',
    lineHeight: 14,
  },
  nftContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 3,
    borderColor: '#2d5016',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
  imageContainer: {
    height: 200,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#2d5016',
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  nftContent: {
    padding: 15,
    gap: 8,
  },
  nftName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    lineHeight: 14,
  },
  nftId: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
    lineHeight: 12,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  priceText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    fontWeight: 'bold',
  },

}); 