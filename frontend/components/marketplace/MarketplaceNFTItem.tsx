import React from 'react';
import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ThemedView, ThemedText } from '@/components/ui';
import { router } from 'expo-router';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';
import { useMarketplaceListing } from '@/hooks/useMarketplaceListing';
import { formatPrice, extractRarity, getRarityColor } from '@/utils/nftHelpers';

interface MarketplaceNFTItemProps {
  tokenId: bigint;
}

export function MarketplaceNFTItem({ tokenId }: MarketplaceNFTItemProps) {
  const { metadata, imageUrl, isLoading } = useNFTMetadata(tokenId);
  const { listing } = useMarketplaceListing(tokenId);

  const handlePress = () => {
    router.push({
      pathname: '/(screens)/nft-details',
      params: { tokenId: tokenId.toString() }
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.itemContainer}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!listing || !listing.isActive) {
    return null;
  }

  const rarity = extractRarity(metadata?.attributes);
  const rarityColor = rarity ? getRarityColor(rarity) : '#4CAF50';

  return (
    <TouchableOpacity style={styles.nftCard} onPress={handlePress}>
      <ThemedView style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.nftImage}
            resizeMode="contain"
          />
        ) : (
          <ThemedView style={styles.placeholderImage}>
            <ThemedText style={styles.placeholderText}>No Image</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.nftName}>
          {metadata?.name || `NFT #${tokenId.toString()}`}
        </ThemedText>
        <ThemedText style={styles.tokenId}>
          ID: #{tokenId.toString()}
        </ThemedText>
        
        <ThemedView style={styles.priceContainer}>
          <Image 
            source={require("@/assets/images/coin.png")}
            style={styles.coinIcon}
            resizeMode="contain"
          />
          <ThemedText style={styles.priceText}>
            {formatPrice(listing.price)} FTK
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 12,
  },
  nftCard: {
    flexDirection: 'row', // Layout horizontal
    backgroundColor: '#fef5eb',
    borderWidth: 3,
    borderColor: '#2d5016',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
    minHeight: 100, // Altura mínima fija
  },
  imageContainer: {
    width: 100, // Ancho fijo para la imagen
    height: 100, // Altura fija
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderRightWidth: 2,
    borderRightColor: '#2d5016',
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
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1, // Toma el resto del espacio
    padding: 12,
    justifyContent: 'space-between', // Distribuir contenido
  },
  nftName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    lineHeight: 14,
    marginBottom: 4,
  },
  tokenId: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
    lineHeight: 12,
    marginBottom: 8,
  },
  rarityBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // Alinear a la izquierda
    padding: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  priceText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 9,
    color: '#2d5016',
    fontWeight: 'bold',
  },
  coinIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  loadingText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
    textAlign: 'center',
    padding: 20,
  },
}); 