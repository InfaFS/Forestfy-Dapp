import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, StatusBar, ScrollView, RefreshControl, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useActiveListings } from '@/hooks/useMarketplaceListing';
import { MarketplaceNFTItem } from '@/components/marketplace/MarketplaceNFTItem';
import { EmptyState } from '@/components/common/EmptyState';
import { MarketplaceContract, TokenContract } from '@/constants/thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';
import { EventToast } from '@/components/common/EventToast';
import { useActiveAccount, useReadContract } from 'thirdweb/react';

export default function MarketplaceTab() {
  const account = useActiveAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'listed' | 'unlisted' | 'sold'>('listed');
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  
  // Hook para obtener listings activos (ya incluye eventos en tiempo real)
  const { activeListingIds, loadingIds, refetchIds } = useActiveListings();

  // Leer el balance de tokens
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    contract: TokenContract,
    method: "function virtualBalance(address) view returns (uint256)",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: {
      enabled: !!account?.address,
    },
  });

  // Función para refrescar el balance
  const refreshBalance = useCallback(async () => {
    try {
      await refetchBalance();
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  }, [refetchBalance]);

  useEffect(() => {
    if (balanceData !== undefined) {
      const balance = Number(balanceData) / 1e18;
      setTokenBalance(balance.toFixed(2));
    }
  }, [balanceData]);

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

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
        {/* Header con balance en esquina superior derecha */}
        <ThemedView style={styles.header}>
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
    backgroundColor: '#fef5eb',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  balanceContainer: {
    position: 'absolute',
    right: 20,
    top: 60,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
}); 