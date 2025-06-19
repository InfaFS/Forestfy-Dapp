import React from 'react';
import { StyleSheet, StatusBar, ScrollView, TouchableOpacity, Image, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { router } from 'expo-router';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { UserRegistryContract } from '@/constants/thirdweb';

export default function SocialScreen() {
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

  const handleGoToFriends = () => {
    router.push('/(screens)/friends');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Social
          </ThemedText>
        </ThemedView>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <ThemedView style={styles.contentContainer}>
            <ThemedText style={styles.sectionTitle}>
              Social Features
            </ThemedText>
            
            {account ? (
              isUserRegistered ? (
                <>
                  <TouchableOpacity
                    style={styles.friendsButton}
                    onPress={handleGoToFriends}
                  >
                    <Image 
                      source={require("@/assets/images/logo.png")}
                      style={styles.buttonImage}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.friendsButtonText}>
                      Friends
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <ThemedText style={styles.comingSoonText}>
                    More social features coming soon...
                  </ThemedText>
                </>
              ) : (
                <ThemedView style={styles.notRegisteredContainer}>
                  <ThemedText style={styles.notRegisteredText}>
                    Please register in Config to access social features
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
    marginBottom: 20,
  },
  comingSoonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#4a7c59',
    textAlign: 'center',
  },
  friendsButton: {
    backgroundColor: '#4a7c59',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#2d5016',
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  friendsButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
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