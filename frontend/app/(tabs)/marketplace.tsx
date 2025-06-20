import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, StatusBar, ScrollView, RefreshControl, View, Image, TouchableOpacity } from 'react-native';
import { ThemedView, ThemedText } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useActiveListings } from '@/hooks/useMarketplaceListing';
import { MarketplaceNFTItem } from '@/components/marketplace';
import { EmptyState } from '@/components/common';
import { MarketplaceContract, TokenContract, UserRegistryContract } from '@/constants/thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';
import { EventToast } from '@/components/common';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { router } from 'expo-router';

export default function MarketplaceScreen() {
  const account = useActiveAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'listed' | 'unlisted' | 'sold'>('listed');
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  
  // Hook para obtener listings activos (ya incluye eventos en tiempo real)
  const { activeListingIds, loadingIds, refetchIds } = useActiveListings();

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Verificar si el usuario está registrado
  const { data: isUserRegistered } = useReadContract({
    contract: UserRegistryContract,
    method: "function isUserRegistered(address) view returns (bool)",
    params: [account?.address || ""],
  });

  // Función para obtener el balance de tokens
  const fetchBalance = useCallback(async () => {
    if (account?.address) {
      try {
        const data = await readContract({
          contract: TokenContract,
          method: "function virtualBalance(address) view returns (uint256)",
          params: [account.address],
        });
        // Convertir el balance de wei a tokens (asumiendo 18 decimales)
        const balance = Number(data) / 1e18;
        setTokenBalance(balance.toFixed(2));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  }, [account?.address]);

  // Efecto para obtener el balance al cargar
  useEffect(() => {
    fetchBalance();
    // Actualizar el balance cada 60 segundos
    const interval = setInterval(fetchBalance, 60000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  // Hook para escuchar eventos (solo para refrescar datos, sin notificaciones)
  useMarketplaceEvents({
    onNFTListed: () => {
      // Sin notificación, solo refresh automático via useActiveListings
    },
    onNFTUnlisted: () => {
      // Sin notificación, solo refresh automático via useActiveListings
    },
    onNFTSold: () => {
      // Sin notificación, solo refresh automático via useActiveListings
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchIds();
      await fetchBalance(); // También actualizar el balance
    } catch (error) {
      console.error('Error refreshing marketplace:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToastHide = () => {
    setShowToast(false);
  };

  const handleGoToMyNFTs = () => {
    router.push('/(screens)/my-nfts');
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
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              Market
            </ThemedText>
          </ThemedView>
          <EmptyState message="Marketplace not available. Please check configuration." />
        </ThemedView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Market
          </ThemedText>
          <ThemedView style={styles.balanceContainer}>
            <ThemedText style={styles.balanceText}>{tokenBalance}</ThemedText>
            <Image 
              source={require("@/assets/images/coin.png")}
              style={styles.coinIcon}
              resizeMode="contain"
            />
          </ThemedView>
        </ThemedView>

        {/* Sell Button */}
        {account && isUserRegistered && (
          <ThemedView style={styles.sellButtonContainer}>
            <TouchableOpacity
              style={styles.sellButton}
              onPress={handleGoToMyNFTs}
            >
              <ThemedText style={styles.sellButtonText}>
                Sell
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        
        {account ? (
          isUserRegistered ? (
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
                <EmptyState message="Everything is very quiet around here..." />
              )}
            </ScrollView>
          ) : (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedView style={styles.notRegisteredContainer}>
                <ThemedText style={styles.notRegisteredText}>
                  Please register in Config to access marketplace features
                </ThemedText>
              </ThemedView>
            </ScrollView>
          )
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedView style={styles.notRegisteredContainer}>
              <ThemedText style={styles.notRegisteredText}>
                Please connect your wallet first
              </ThemedText>
            </ThemedView>
          </ScrollView>
        )}

        {/* Toast para eventos en tiempo real */}
        <EventToast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          onHide={handleToastHide}
          duration={4000}
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  sellButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sellButton: {
    backgroundColor: '#4a7c59',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  sellButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: 'white',
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
  balanceContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2d5016',
  },
  balanceText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    marginRight: 6,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  notRegisteredContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 2,
    borderColor: '#ff6b35',
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  notRegisteredText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#d4572a',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 