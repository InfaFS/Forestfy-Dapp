import React from 'react';
import { StyleSheet, StatusBar, ScrollView, TouchableOpacity, Image, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router } from 'expo-router';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { UserRegistryContract } from '@/constants/thirdweb';

export default function MarketplaceScreen() {
  const account = useActiveAccount();
  
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

  if (!fontsLoaded) {
    return null;
  }

  const handleGoToMarketplace = () => {
    router.push('/(screens)/marketplace');
  };

  const handleGoToMyNFTs = () => {
    router.push('/(screens)/my-nfts');
  };

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Marketplace
          </ThemedText>
        </ThemedView>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <ThemedView style={styles.contentContainer}>
            <ThemedText style={styles.sectionTitle}>
              Trade Your NFTs
            </ThemedText>
            <ThemedText style={styles.descriptionText}>
              Buy and sell NFTs in the Forestfy marketplace
            </ThemedText>
            
            {account ? (
              isUserRegistered ? (
                <ThemedView style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={handleGoToMarketplace}
                  >
                    <View style={styles.textContainer}>
                      <ThemedText style={styles.customButtonText}>
                        Browse Marketplace
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={handleGoToMyNFTs}
                  >
                    <View style={styles.textContainer}>
                      <ThemedText style={styles.customButtonText}>
                        List NFTs
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView style={styles.notRegisteredContainer}>
                  <ThemedText style={styles.notRegisteredText}>
                    Please register in Config to access marketplace features
                  </ThemedText>
                </ThemedView>
              )
            ) : (
              <ThemedView style={styles.notRegisteredContainer}>
                <ThemedText style={styles.notRegisteredText}>
                  Please connect your wallet first
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
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
  contentContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#2d5016',
    textAlign: 'center',
    marginBottom: 15,
  },
  descriptionText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    width: '100%',
  },
  // Custom button styles matching the consistent project style
  customButton: {
    backgroundColor: '#4a7c59',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: '#2d5016',
    minWidth: 280,
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 15,
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  buttonImage: {
    width: 50,
    height: 50,
    position: 'absolute',
    left: 30,
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