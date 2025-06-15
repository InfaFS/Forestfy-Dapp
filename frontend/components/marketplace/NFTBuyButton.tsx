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
    console.log('🎬 handleBuy called');
    
    if (!listing || !address || !tokenId) {
      console.log('❌ Missing data in handleBuy');
      onBuyComplete(false, 'Insufficient information to proceed with purchase');
      return;
    }

    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      console.log('❌ User trying to buy own NFT');
      onBuyComplete(false, 'You cannot buy your own NFT');
      return;
    }

    console.log('✅ Showing purchase confirmation, passing handleConfirmBuy function');
    // Mostrar confirmación antes de comprar
    onBuyStart(handleConfirmBuy);
  };

  const handleConfirmBuy = async () => {
    console.log('🚀 handleConfirmBuy started');
    
    if (!listing || !address || !tokenId) {
      console.log('❌ Missing required data:', { listing: !!listing, address: !!address, tokenId: !!tokenId });
      return;
    }
    
    setIsBuying(true);
    console.log('⏳ Set isBuying to true');

    try {
      const nftPrice = Number(listing.price) / 1e18;

      console.log('🛒 Starting purchase process...');
      console.log('- User Balance:', userBalance, 'FTK');
      console.log('- User Parcels:', userParcels);
      console.log('- User Token Count:', userTokenCount);
      console.log('- NFT Price:', nftPrice, 'FTK');

      console.log('📞 Calling buyNFT API...');
      await buyNFT(address, tokenId, userBalance, userParcels, userTokenCount, nftPrice);
      console.log('✅ buyNFT API completed successfully');

      // No refrescar datos inmediatamente para evitar que la página se actualice
      // Los datos se refrescarán cuando el usuario regrese al marketplace

      console.log('📢 Calling onBuyComplete with success...');
      onBuyComplete(true, 'NFT purchased successfully!');
      console.log('✅ onBuyComplete called successfully');
    } catch (error) {
      console.error('❌ Error in handleConfirmBuy:', error);
      console.log('📢 Calling onBuyComplete with error...');
      onBuyComplete(false, error instanceof Error ? error.message : 'Failed to purchase NFT');
      console.log('✅ onBuyComplete error called');
    } finally {
      console.log('🏁 Setting isBuying to false');
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