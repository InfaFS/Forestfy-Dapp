import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, StatusBar, ScrollView, RefreshControl, View, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useActiveListings } from '@/hooks/useMarketplaceListing';
import { MarketplaceNFTItem } from '@/components/marketplace/MarketplaceNFTItem';
import { PixelBackButton } from '@/components/common/PixelBackButton';
import { EmptyState } from '@/components/common/EmptyState';
import { MarketplaceContract, TokenContract } from '@/constants/thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';
import { EventToast } from '@/components/common/EventToast';
import { useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';

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

  if (!fontsLoaded) {
    return null;
  }

  // Verificar que el contrato esté disponible
  if (!MarketplaceContract) {
    return (
      <ProtectedRoute>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <PixelBackButton />
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              Marketplace
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
        <PixelBackButton />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Marketplace
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
    marginBottom: 40,
    position: 'relative',
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
  balanceContainer: {
    position: 'absolute',
    right: 20,
    top: -50,
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
}); 