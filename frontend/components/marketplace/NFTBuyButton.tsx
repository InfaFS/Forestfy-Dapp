import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { buyNFT } from '@/constants/api';
import { useUserWalletData } from '@/hooks/useUserWalletData';
import { useWallet } from '@/contexts/WalletContext';
import { useTrees } from '@/contexts/TreesContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
}

interface NFTBuyButtonProps {
  listing: Listing;
  tokenId: string;
  onBuyStart: (confirmBuyFunction: () => Promise<void>) => void;
  onBuyComplete: (success: boolean, message: string) => void;
}

export function NFTBuyButton({ listing, tokenId, onBuyStart, onBuyComplete }: NFTBuyButtonProps) {
  const [isBuying, setIsBuying] = useState(false);
  const { address, userBalance, userParcels, userTokenCount, refreshUserData } = useUserWalletData();
  const { refreshBalance } = useWallet();
  const { triggerRefresh: triggerTreesRefresh } = useTrees();
  const { triggerRefresh: triggerMarketplaceRefresh } = useMarketplace();

  const handleBuy = () => {
    if (!listing || !address || !tokenId) {
      onBuyComplete(false, 'Insufficient information to proceed with purchase');
      return;
    }

    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      onBuyComplete(false, 'You cannot buy your own NFT');
      return;
    }

    // Mostrar confirmación antes de comprar
    onBuyStart(handleConfirmBuy);
  };

  const handleConfirmBuy = async () => {
    if (!listing || !address || !tokenId) {
      return;
    }
    
    setIsBuying(true);

    try {
      const nftPrice = Number(listing.price) / 1e18;
      await buyNFT(address, tokenId, userBalance, userParcels, userTokenCount, nftPrice);

      // Solo notificar el éxito, sin actualizar datos automáticamente
      console.log('🎉 Compra exitosa, esperando confirmación del usuario...');
      onBuyComplete(true, 'NFT purchased successfully!');
    } catch (error) {
      console.error('❌ Error in handleConfirmBuy:', error);
      onBuyComplete(false, error instanceof Error ? error.message : 'Failed to purchase NFT');
    } finally {
      setIsBuying(false);
    }
  };

  const isDisabled = isBuying || !listing?.isActive || listing.seller.toLowerCase() === address.toLowerCase();

  return (
    <TouchableOpacity
      style={[styles.buyButton, isDisabled && styles.buyButtonDisabled]}
      onPress={handleBuy}
      disabled={isDisabled}
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
  );
}

const styles = StyleSheet.create({
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
  buyButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
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
}); 