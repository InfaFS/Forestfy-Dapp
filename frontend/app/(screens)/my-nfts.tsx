import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { MarketplaceContract, NFTContract } from '@/constants/thirdweb';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router } from 'expo-router';
import { listNFT, unlistNFT } from '@/constants/api';
import { NFTBuyAlert } from '@/components/NFTBuyAlert';
import { ConfirmNFTListAlert } from '@/components/ConfirmNFTListAlert';
import { ConfirmNFTUnlistAlert } from '@/components/ConfirmNFTUnlistAlert';
import { useTrees } from '@/contexts/TreesContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';

interface NFTData {
  tokenId: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
  } | null;
  imageUrl: string | null;
  isListed: boolean;
  price?: string;
}

interface NFTWithListing {
  tokenId: bigint;
  uri: string;
  listing: {
    tokenId: bigint;
    seller: string;
    price: bigint;
    isActive: boolean;
    listedAt: bigint;
  } | null;
}

export default function MyNFTsScreen() {
  const [userNFTs, setUserNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [priceInputs, setPriceInputs] = useState<{[key: string]: string}>({});
  const [processingTokens, setProcessingTokens] = useState<Set<string>>(new Set());
  const [showConfirmList, setShowConfirmList] = useState(false);
  const [showConfirmUnlist, setShowConfirmUnlist] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);

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

  // Obtener cantidad de tokens del usuario
  const { data: tokenCountData } = useReadContract({
    contract: NFTContract,
    method: "function getUserTokenCount(address user) view returns (uint256)",
    params: [address],
  });

  // Obtener tokens del usuario
  const { data: userTokensData } = useReadContract({
    contract: NFTContract,
    method: "function tokensOfOwner(address owner) view returns (uint256[])",
    params: [address],
  });

  // Obtener datos completos de NFTs con estado de listado usando el marketplace
  const { data: userNFTsWithListingData } = useReadContract({
    contract: MarketplaceContract,
    method: "function getUserNFTsWithListingStatus(address user) view returns (uint256[] tokenIds, bool[] isListedArray, uint256[] prices)",
    params: [address],
  });

  // Cargar datos de NFTs del usuario
  useEffect(() => {
    async function loadUserNFTs() {
      if (!userNFTsWithListingData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const [tokenIds, isListedArray, prices] = userNFTsWithListingData as [
          readonly bigint[],
          readonly boolean[],
          readonly bigint[]
        ];

        if (!tokenIds || tokenIds.length === 0) {
          setUserNFTs([]);
          setIsLoading(false);
          return;
        }

        const nftPromises = tokenIds.map(async (tokenId: bigint, index: number) => {
          const tokenIdString = tokenId.toString();
          const isListed = isListedArray[index];
          const price = isListed ? (Number(prices[index]) / 1e18).toFixed(2) : undefined;
          
          try {
            let metadata = null;
            let imageUrl = null;

            // Obtener metadata básica (por ahora simulada)
            metadata = {
              name: `Forest NFT #${tokenIdString}`,
              description: 'A beautiful forest NFT from the Forestfy ecosystem',
            };

            return {
              tokenId: tokenIdString,
              metadata,
              imageUrl,
              isListed,
              price,
            };
          } catch (error) {
            console.error('Error loading NFT data for token', tokenIdString, error);
            return {
              tokenId: tokenIdString,
              metadata: {
                name: `Forest NFT #${tokenIdString}`,
                description: 'A forest NFT',
              },
              imageUrl: null,
              isListed,
              price,
            };
          }
        });

        const nfts = await Promise.all(nftPromises);
        setUserNFTs(nfts);
      } catch (error) {
        console.error('Error processing NFT data:', error);
        setUserNFTs([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (address && userNFTsWithListingData) {
      loadUserNFTs();
    } else if (address) {
      setIsLoading(false);
    }
  }, [address, userNFTsWithListingData]);

  const handleGoBack = () => {
    router.back();
  };

  const handlePriceChange = (tokenId: string, price: string) => {
    setPriceInputs(prev => ({
      ...prev,
      [tokenId]: price
    }));
  };

  const handleListNFT = (tokenId: string) => {
    const price = priceInputs[tokenId];
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setAlertType('error');
      setAlertMessage('Please enter a valid price');
      setShowAlert(true);
      return;
    }

    const nft = userNFTs.find(n => n.tokenId === tokenId);
    if (nft) {
      setSelectedNFT(nft);
      setShowConfirmList(true);
    }
  };

  const handleConfirmListNFT = async () => {
    if (!selectedNFT) return;
    
    const price = priceInputs[selectedNFT.tokenId];
    setProcessingTokens(prev => new Set(prev).add(selectedNFT.tokenId));
    setShowConfirmList(false);

    try {
      await listNFT(address, selectedNFT.tokenId, Number(price));
      
      // Actualizar el estado local
      setUserNFTs(prev => prev.map(nft => 
        nft.tokenId === selectedNFT.tokenId 
          ? { ...nft, isListed: true, price: Number(price).toFixed(2) }
          : nft
      ));

      setAlertType('success');
      setAlertMessage('Success! NFT listed successfully');
      setShowAlert(true);
      
      // Actualizar marketplace y NFTs automáticamente
      triggerMarketplaceRefresh();
      triggerTreesRefresh();
      
      // Limpiar el input de precio
      setPriceInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[selectedNFT.tokenId];
        return newInputs;
      });
    } catch (error: any) {
      setAlertType('error');
      setAlertMessage(error.message || 'Error listing NFT');
      setShowAlert(true);
    } finally {
      setProcessingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedNFT.tokenId);
        return newSet;
      });
      setSelectedNFT(null);
    }
  };

  const handleUnlistNFT = (tokenId: string) => {
    const nft = userNFTs.find(n => n.tokenId === tokenId);
    if (nft) {
      setSelectedNFT(nft);
      setShowConfirmUnlist(true);
    }
  };

  const handleConfirmUnlistNFT = async () => {
    if (!selectedNFT) return;
    
    setProcessingTokens(prev => new Set(prev).add(selectedNFT.tokenId));
    setShowConfirmUnlist(false);

    try {
      await unlistNFT(address, selectedNFT.tokenId);
      
      // Actualizar el estado local
      setUserNFTs(prev => prev.map(nft => 
        nft.tokenId === selectedNFT.tokenId 
          ? { ...nft, isListed: false, price: undefined }
          : nft
      ));

      setAlertType('success');
      setAlertMessage('Success! NFT unlisted successfully');
      setShowAlert(true);
      
      // Actualizar marketplace y NFTs automáticamente
      triggerMarketplaceRefresh();
      triggerTreesRefresh();
    } catch (error: any) {
      setAlertType('error');
      setAlertMessage(error.message || 'Error unlisting NFT');
      setShowAlert(true);
    } finally {
      setProcessingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedNFT.tokenId);
        return newSet;
      });
      setSelectedNFT(null);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
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
        
        <ThemedText style={styles.title}>My NFTs</ThemedText>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <ThemedText style={styles.loadingText}>Loading your NFTs...</ThemedText>
          ) : userNFTs.length === 0 ? (
            <ThemedText style={styles.emptyText}>You don't have any NFTs yet</ThemedText>
          ) : (
            <View style={styles.nftGrid}>
              {userNFTs.map((nft) => (
                <View key={nft.tokenId} style={styles.nftCard}>
                  {nft.imageUrl && (
                    <Image 
                      source={{ uri: nft.imageUrl }} 
                      style={styles.nftImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  <View style={styles.nftInfo}>
                    <ThemedText style={styles.nftName}>
                      {nft.metadata?.name || `NFT #${nft.tokenId}`}
                    </ThemedText>
                    
                    <ThemedText style={styles.nftId}>
                      ID: #{nft.tokenId}
                    </ThemedText>
                    
                    {nft.isListed ? (
                      <View style={styles.listedContainer}>
                        <View style={styles.priceContainer}>
                          <Image 
                            source={require("@/assets/images/coin.png")}
                            style={styles.coinIcon}
                            resizeMode="contain"
                          />
                          <ThemedText style={styles.priceText}>
                            {nft.price} FTK
                          </ThemedText>
                        </View>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.unlistButton, processingTokens.has(nft.tokenId) && styles.disabledButton]}
                          onPress={() => handleUnlistNFT(nft.tokenId)}
                          disabled={processingTokens.has(nft.tokenId)}
                        >
                          <ThemedText style={styles.actionButtonText}>
                            {processingTokens.has(nft.tokenId) ? 'Unlisting...' : 'Unlist'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.unlistedContainer}>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Price in FTK"
                          placeholderTextColor="#999"
                          value={priceInputs[nft.tokenId] || ''}
                          onChangeText={(text) => handlePriceChange(nft.tokenId, text)}
                          keyboardType="numeric"
                        />
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.listButton, processingTokens.has(nft.tokenId) && styles.disabledButton]}
                          onPress={() => handleListNFT(nft.tokenId)}
                          disabled={processingTokens.has(nft.tokenId)}
                        >
                          <ThemedText style={styles.actionButtonText}>
                            {processingTokens.has(nft.tokenId) ? 'Listing...' : 'List'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        <NFTBuyAlert
          show={showAlert}
          onClose={handleAlertClose}
          type={alertType}
          message={alertMessage}
        />

        <ConfirmNFTListAlert
          show={showConfirmList}
          onConfirm={handleConfirmListNFT}
          onClose={() => {
            setShowConfirmList(false);
            setSelectedNFT(null);
          }}
          nftName={selectedNFT?.metadata?.name || `NFT #${selectedNFT?.tokenId}`}
          price={selectedNFT ? priceInputs[selectedNFT.tokenId] || '0' : '0'}
        />

        <ConfirmNFTUnlistAlert
          show={showConfirmUnlist}
          onConfirm={handleConfirmUnlistNFT}
          onClose={() => {
            setShowConfirmUnlist(false);
            setSelectedNFT(null);
          }}
          nftName={selectedNFT?.metadata?.name || `NFT #${selectedNFT?.tokenId}`}
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
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 16,
    color: '#2d5016',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#4a7c59',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  nftGrid: {
    gap: 15,
  },
  nftCard: {
    backgroundColor: '#fef5eb',
    borderWidth: 3,
    borderColor: '#2d5016',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
  nftImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2d5016',
  },
  nftInfo: {
    gap: 8,
  },
  nftName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#2d5016',
    textAlign: 'center',
  },
  nftId: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  listedContainer: {
    alignItems: 'center',
    gap: 10,
  },
  unlistedContainer: {
    gap: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
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
  priceInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2d5016',
    padding: 10,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#2d5016',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  listButton: {
    backgroundColor: '#4a7c59',
  },
  unlistButton: {
    backgroundColor: '#d32f2f',
  },
  disabledButton: {
    backgroundColor: '#999999',
    borderColor: '#666666',
  },
  actionButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: 'white',
  },
}); 