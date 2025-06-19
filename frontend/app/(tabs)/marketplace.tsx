import React from 'react';
import { StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router } from 'expo-router';
import { ThemedButton } from '@/components/ThemedButton';

export default function MarketplaceScreen() {
  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
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
            
            <ThemedView style={styles.buttonsContainer}>
              <ThemedButton
                title="Browse Marketplace"
                onPress={handleGoToMarketplace}
                variant="primary"
                pixelFont={true}
                style={styles.button}
              />
              
              <ThemedButton
                title="My NFTs"
                onPress={handleGoToMyNFTs}
                variant="secondary"
                pixelFont={true}
                style={styles.button}
              />
            </ThemedView>
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
}); 