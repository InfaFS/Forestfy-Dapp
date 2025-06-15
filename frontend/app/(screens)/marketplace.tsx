import React, { useState, useRef } from 'react';
import { StyleSheet, StatusBar, ScrollView, RefreshControl, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useActiveListings } from '@/hooks/useMarketplaceListing';
import { MarketplaceNFTItem } from '@/components/marketplace/MarketplaceNFTItem';
import { PixelBackButton } from '@/components/common/PixelBackButton';
import { EmptyState } from '@/components/common/EmptyState';
import { MarketplaceContract } from '@/constants/thirdweb';
import { useMarketplaceEvents } from '@/hooks/useMarketplaceEvents';
import { EventToast } from '@/components/common/EventToast';

export default function MarketplaceScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'listed' | 'unlisted' | 'sold'>('listed');
  
  // Hook para obtener listings activos (ya incluye eventos en tiempo real)
  const { activeListingIds, loadingIds, refetchIds } = useActiveListings();

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
}); 