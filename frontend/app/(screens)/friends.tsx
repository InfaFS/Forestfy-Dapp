import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, ScrollView, View, TouchableOpacity, DeviceEventEmitter, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { PixelBackButton } from '@/components/common/PixelBackButton';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { UserRegistryContract } from '@/constants/thirdweb';
import { AddFriendAlert } from '@/components/AddFriendAlert';
import { sendFriendRequest } from '@/constants/api';

export default function FriendsScreen() {
  const account = useActiveAccount();
  const [friendsWithNames, setFriendsWithNames] = useState<Array<{address: string, name: string}>>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [showAddFriendAlert, setShowAddFriendAlert] = useState(false);

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Obtener la lista de direcciones de amigos
  const { data: friendsAddresses, isLoading: isLoadingFriends, refetch: refetchFriends } = useReadContract({
    contract: UserRegistryContract,
    method: "function getFriends(address) view returns (address[])",
    params: [account?.address || ""],
  });

  // Función para obtener el nombre de un amigo por su dirección
  const getFriendName = async (friendAddress: string) => {
    try {
      // Llamada al contrato para obtener la información del usuario
      const userInfo = await readContract({
        contract: UserRegistryContract,
        method: "function getUserInfo(address) view returns (string name, address userAddress, bool exists, address[] friends, uint256 createdAt)",
        params: [friendAddress],
      });
      
      // userInfo[0] es el nombre, userInfo[2] es el exists flag
      if (userInfo[2] && userInfo[0]) { // exists && name
        return userInfo[0];
      } else {
        return `User ${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}`;
      }
    } catch (error) {
      console.error("Error getting friend name:", error);
      return `Unknown ${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}`;
    }
  };

  // Efecto para cargar los nombres de los amigos cuando se obtienen las direcciones
  useEffect(() => {
    const loadFriendsNames = async () => {
      if (friendsAddresses && friendsAddresses.length > 0) {
        setIsLoadingNames(true);
        try {
          const friendsWithNamesArray = await Promise.all(
            friendsAddresses.map(async (address: string) => ({
              address,
              name: await getFriendName(address)
            }))
          );
          setFriendsWithNames(friendsWithNamesArray);
        } catch (error) {
          console.error("Error loading friends names:", error);
        } finally {
          setIsLoadingNames(false);
        }
      } else {
        setFriendsWithNames([]);
      }
    };

    loadFriendsNames();
  }, [friendsAddresses]);

  // Escuchar eventos de refresco de datos sociales
  useEffect(() => {
    const handleRefreshSocialData = () => {
      refetchFriends();
    };

    const subscription = DeviceEventEmitter.addListener('refreshSocialData', handleRefreshSocialData);
    return () => subscription.remove();
  }, [refetchFriends]);

  const handleRemoveFriend = (friendAddress: string) => {
    // Por ahora no hace nada, como solicitado
    console.log("Remove friend:", friendAddress);
  };

  const handleAddFriend = () => {
    setShowAddFriendAlert(true);
  };

  const handleShowSuccessMessage = (message: string) => {
    Alert.alert("¡Éxito!", message, [{ text: "OK" }]);
    // Refresh friends data
    refetchFriends();
    DeviceEventEmitter.emit('refreshSocialData');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <PixelBackButton />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Friends
          </ThemedText>
        </ThemedView>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {isLoadingFriends || isLoadingNames ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>
                Loading friends...
              </ThemedText>
            </ThemedView>
          ) : friendsWithNames.length === 0 ? (
            <>
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No se encontraron amigos
                </ThemedText>
              </ThemedView>
              <TouchableOpacity
                style={styles.addFriendButton}
                onPress={handleAddFriend}
              >
                <ThemedText style={styles.addFriendButtonText}>
                  + Añadir Amigo
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedView style={styles.friendsContainer}>
              <ThemedText style={styles.friendsTitle}>
                AMIGOS ({friendsWithNames.length})
              </ThemedText>
              {friendsWithNames.map((friend, index) => (
                <ThemedView key={friend.address} style={styles.friendItem}>
                  <ThemedView style={styles.friendInfo}>
                    <ThemedText style={styles.friendName}>
                      {friend.name}
                    </ThemedText>
                    <ThemedText style={styles.friendAddress}>
                      {friend.address.slice(0, 6)}...{friend.address.slice(-4)}
                    </ThemedText>
                  </ThemedView>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFriend(friend.address)}
                  >
                    <ThemedText style={styles.removeButtonText}>
                      Eliminar
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ))}
              <TouchableOpacity
                style={styles.addFriendButton}
                onPress={handleAddFriend}
              >
                <ThemedText style={styles.addFriendButtonText}>
                  + Añadir Amigo
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ScrollView>

        {/* Add Friend Alert */}
        <AddFriendAlert
          show={showAddFriendAlert}
          onClose={() => setShowAddFriendAlert(false)}
          onSendFriendRequest={() => {}} // Dummy function, not used anymore
          onSuccess={handleShowSuccessMessage}
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#4a7c59',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#4a7c59',
    textAlign: 'center',
  },
  friendsContainer: {
    gap: 16,
  },
  friendsTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 16,
    color: '#4a7c59',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderWidth: 2,
    borderColor: '#4a7c59',
  },
  friendItem: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#2d5016',
    marginBottom: 4,
  },
  friendAddress: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: '#666',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    borderWidth: 2,
    borderColor: '#a71e2a',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: 'white',
    textAlign: 'center',
  },
  addFriendButton: {
    backgroundColor: '#4a7c59',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  addFriendButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
}); 