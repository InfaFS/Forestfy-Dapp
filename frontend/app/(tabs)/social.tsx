import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, ScrollView, View, TouchableOpacity, DeviceEventEmitter, Alert } from 'react-native';
import { ThemedView, ThemedText } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { UserRegistryContract } from '@/constants/thirdweb';
import { AddFriendAlert, RewardAlert, ConfirmationAlert } from '@/components/alerts';
import { sendFriendRequest, acceptFriendRequest, removeFriend, cancelFriendRequest } from '@/constants/api';
import { useUserRegistryEvents } from '@/hooks/useUserRegistryEvents';
import { useRouter } from "expo-router";

export default function SocialScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const [friendsWithNames, setFriendsWithNames] = useState<Array<{address: string, name: string}>>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [showAddFriendAlert, setShowAddFriendAlert] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState<Array<{address: string, name: string}>>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  // Confirmation alerts
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{address: string, name: string} | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<{address: string, name: string} | null>(null);
  const [selectedCancelRequest, setSelectedCancelRequest] = useState<{address: string, name: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Success alert
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Obtener todos los usuarios registrados para verificar solicitudes
  const { data: allUsers } = useReadContract({
    contract: UserRegistryContract,
    method: "function getAllUsers() view returns (address[])",
    params: [],
  });

  // Verificar si el usuario está registrado
  const { data: isUserRegistered } = useReadContract({
    contract: UserRegistryContract,
    method: "function isUserRegistered(address) view returns (bool)",
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

  // Función para obtener las solicitudes de amistad pendientes
  const getFriendRequests = async () => {
    if (!account?.address || !allUsers || allUsers.length === 0) {
      return [];
    }

    const requests = [];
    
    for (const userAddress of allUsers) {
      if (userAddress === account.address) continue; // Skip self
      
      try {
        // Verificar si este usuario me envió una solicitud
        const requestSent = await readContract({
          contract: UserRegistryContract,
          method: "function friendRequests(address, address) view returns (bool)",
          params: [userAddress, account.address],
        });

        if (requestSent) {
          // Verificar que no seamos ya amigos
          const areFriends = await readContract({
            contract: UserRegistryContract,
            method: "function areFriends(address, address) view returns (bool)",
            params: [userAddress, account.address],
          });

          if (!areFriends) {
            const name = await getFriendName(userAddress);
            requests.push({ address: userAddress, name });
          }
        }
      } catch (error) {
        console.error(`Error checking request from ${userAddress}:`, error);
      }
    }

    return requests;
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

  // Efecto para cargar las solicitudes de amistad
  useEffect(() => {
    const loadFriendRequests = async () => {
      if (account?.address && allUsers) {
        setIsLoadingRequests(true);
        try {
          const requests = await getFriendRequests();
          setFriendRequests(requests);
        } catch (error) {
          console.error("Error loading friend requests:", error);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    };

    loadFriendRequests();
  }, [account?.address, allUsers]);

  // Escuchar eventos de refresco de datos sociales
  useEffect(() => {
    const handleRefreshSocialData = async () => {
      refetchFriends();
      // Also refresh friend requests
      if (account?.address && allUsers) {
        setIsLoadingRequests(true);
        try {
          const updatedRequests = await getFriendRequests();
          setFriendRequests(updatedRequests);
        } catch (error) {
          console.error("Error refreshing friend requests:", error);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    };

    const subscription = DeviceEventEmitter.addListener('refreshSocialData', handleRefreshSocialData);
    return () => subscription.remove();
  }, [refetchFriends, account?.address, allUsers]);

  // Escuchar eventos del contrato UserRegistry para actualizaciones en tiempo real
  useUserRegistryEvents({
    onFriendRequestSent: async () => {
      // Refresh friend requests when a new request is sent
      if (account?.address && allUsers) {
        setIsLoadingRequests(true);
        try {
          const updatedRequests = await getFriendRequests();
          setFriendRequests(updatedRequests);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    },
    onFriendRequestAccepted: async () => {
      // Refresh both friends and requests when a request is accepted
      refetchFriends();
      if (account?.address && allUsers) {
        setIsLoadingRequests(true);
        try {
          const updatedRequests = await getFriendRequests();
          setFriendRequests(updatedRequests);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    },
    onFriendAdded: async () => {
      // Refresh friends list when a friend is added
      refetchFriends();
    },
    onFriendRequestCancelled: async () => {
      // Refresh friend requests when a request is cancelled
      if (account?.address && allUsers) {
        setIsLoadingRequests(true);
        try {
          const updatedRequests = await getFriendRequests();
          setFriendRequests(updatedRequests);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    },
    onFriendRemoved: async () => {
      // Refresh friends list when a friend is removed
      refetchFriends();
    },
  });

  const handleAddFriend = () => {
    setShowAddFriendAlert(true);
  };

  const handleShowSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
    // Refresh friends data
    refetchFriends();
    DeviceEventEmitter.emit('refreshSocialData');
  };

  const handleToggleRequests = () => {
    setShowRequests(!showRequests);
  };

  const handleAcceptRequest = (fromAddress: string, fromName: string) => {
    setSelectedRequest({ address: fromAddress, name: fromName });
    setShowAcceptConfirm(true);
  };

  const handleConfirmAcceptRequest = async () => {
    if (!account?.address || !selectedRequest) return;

    setIsProcessing(true);
    try {
      await acceptFriendRequest(selectedRequest.address, account.address);
      
      // Close confirmation and show success
      setShowAcceptConfirm(false);
      setSelectedRequest(null);
      setSuccessMessage(`You are now friends with ${selectedRequest.name}!`);
      setShowSuccessAlert(true);
      
      // Refresh data
      refetchFriends();
      const updatedRequests = await getFriendRequests();
      setFriendRequests(updatedRequests);
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      setShowAcceptConfirm(false);
      setSelectedRequest(null);
      Alert.alert("Error", error.message || "Could not accept friend request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = (fromAddress: string, fromName: string) => {
    setSelectedCancelRequest({ address: fromAddress, name: fromName });
    setShowCancelConfirm(true);
  };

  const handleConfirmCancelRequest = async () => {
    if (!account?.address || !selectedCancelRequest) return;

    setIsProcessing(true);
    try {
      await cancelFriendRequest(selectedCancelRequest.address, account.address);
      
      // Close confirmation and show success
      setShowCancelConfirm(false);
      setSelectedCancelRequest(null);
      setSuccessMessage(`Friend request from ${selectedCancelRequest.name} has been cancelled`);
      setShowSuccessAlert(true);
      
      // Refresh data
      const updatedRequests = await getFriendRequests();
      setFriendRequests(updatedRequests);
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error cancelling friend request:", error);
      setShowCancelConfirm(false);
      setSelectedCancelRequest(null);
      Alert.alert("Error", error.message || "Could not cancel friend request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = (friendAddress: string, friendName: string) => {
    setSelectedFriend({ address: friendAddress, name: friendName });
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemoveFriend = async () => {
    if (!account?.address || !selectedFriend) return;

    setIsProcessing(true);
    try {
      await removeFriend(account.address, selectedFriend.address);
      
      // Close confirmation and show success
      setShowRemoveConfirm(false);
      setSelectedFriend(null);
      setSuccessMessage(`${selectedFriend.name} has been removed from your friends list`);
      setShowSuccessAlert(true);
      
      // Refresh data
      refetchFriends();
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error removing friend:", error);
      setShowRemoveConfirm(false);
      setSelectedFriend(null);
      Alert.alert("Error", error.message || "Could not remove friend");
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para navegar al forest de un amigo
  const handleViewFriendForest = (friendAddress: string, friendName: string) => {
    router.push({
      pathname: "/(screens)/friend-forest",
      params: {
        friendAddress: friendAddress,
        friendName: friendName,
      },
    });
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
        
        {account ? (
          isUserRegistered ? (
            <>
              {/* Toggle button */}
              <ThemedView style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, !showRequests && styles.activeToggle]}
                  onPress={() => setShowRequests(false)}
                >
                  <ThemedText style={[styles.toggleText, !showRequests && styles.activeToggleText]}>
                    Friends ({friendsWithNames.length})
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, showRequests && styles.activeToggle]}
                  onPress={() => setShowRequests(true)}
                >
                  <ThemedText style={[styles.toggleText, showRequests && styles.activeToggleText]}>
                    Requests ({friendRequests.length})
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
              >
                {showRequests ? (
                  // Friend Requests View
                  isLoadingRequests ? (
                    <ThemedView style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>
                        Loading requests...
                      </ThemedText>
                    </ThemedView>
                  ) : friendRequests.length === 0 ? (
                    <ThemedView style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>
                        No pending friend requests
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.friendsContainer}>
                      {friendRequests.map((request) => (
                        <ThemedView key={request.address} style={styles.requestItem}>
                          <ThemedView style={styles.friendInfo}>
                            <ThemedText style={styles.friendName}>
                              {request.name}
                            </ThemedText>
                            <ThemedText style={styles.friendAddress}>
                              {request.address.slice(0, 6)}...{request.address.slice(-4)}
                            </ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.requestButtons}>
                            <TouchableOpacity
                              style={styles.acceptButton}
                              onPress={() => handleAcceptRequest(request.address, request.name)}
                            >
                              <ThemedText style={styles.acceptButtonText}>
                                Accept
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.rejectButton}
                              onPress={() => handleRejectRequest(request.address, request.name)}
                            >
                              <ThemedText style={styles.rejectButtonText}>
                                Cancel
                              </ThemedText>
                            </TouchableOpacity>
                          </ThemedView>
                        </ThemedView>
                      ))}
                    </ThemedView>
                  )
                ) : (
                  // Friends View
                  isLoadingFriends || isLoadingNames ? (
                    <ThemedView style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>
                        Loading friends...
                      </ThemedText>
                    </ThemedView>
                  ) : friendsWithNames.length === 0 ? (
                    <>
                      <ThemedView style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>
                          No friends found
                        </ThemedText>
                      </ThemedView>
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={handleAddFriend}
                      >
                        <ThemedText style={styles.addFriendButtonText}>
                          + Add Friend
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <ThemedView style={styles.friendsContainer}>
                      {friendsWithNames.map((friend, index) => (
                        <TouchableOpacity 
                          key={friend.address} 
                          style={styles.friendItem}
                          onPress={() => handleViewFriendForest(friend.address, friend.name)}
                          activeOpacity={0.7}
                        >
                          <ThemedView style={styles.friendInfo}>
                            <ThemedText style={styles.friendName}>
                              {friend.name}
                            </ThemedText>
                            <ThemedText style={styles.friendAddress}>
                              {friend.address.slice(0, 6)}...{friend.address.slice(-4)}
                            </ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.friendActions}>
                            <TouchableOpacity
                              style={styles.viewForestButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleViewFriendForest(friend.address, friend.name);
                              }}
                            >
                              <ThemedText style={styles.viewForestButtonText}>
                                Visit
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleRemoveFriend(friend.address, friend.name);
                              }}
                            >
                              <ThemedText style={styles.removeButtonText}>
                                Delete
                              </ThemedText>
                            </TouchableOpacity>
                          </ThemedView>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={handleAddFriend}
                      >
                        <ThemedText style={styles.addFriendButtonText}>
                          + Add Friend
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  )
                )}
              </ScrollView>
            </>
          ) : (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedView style={styles.notRegisteredContainer}>
                <ThemedText style={styles.notRegisteredText}>
                  Please register in Config to access social features
                </ThemedText>
              </ThemedView>
            </ScrollView>
          )
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedView style={styles.notRegisteredContainer}>
              <ThemedText style={styles.notRegisteredText}>
                Please connect your wallet first
              </ThemedText>
            </ThemedView>
          </ScrollView>
        )}

        {/* Add Friend Alert */}
        <AddFriendAlert
          show={showAddFriendAlert}
          onClose={() => setShowAddFriendAlert(false)}
          onSendFriendRequest={() => {}} // Dummy function, not used anymore
          onSuccess={handleShowSuccessMessage}
        />

        {/* Accept Friend Request Confirmation */}
        <ConfirmationAlert
          show={showAcceptConfirm}
          onClose={() => {
            if (!isProcessing) {
              setShowAcceptConfirm(false);
              setSelectedRequest(null);
            }
          }}
          onConfirm={handleConfirmAcceptRequest}
          title="Accept Friend Request"
          message={selectedRequest ? `Do you want to accept ${selectedRequest.name}'s friend request?` : ''}
          confirmText="Accept"
          cancelText="Cancel"
          confirmColor="#28a745"
          isLoading={isProcessing}
        />

        {/* Remove Friend Confirmation */}
        <ConfirmationAlert
          show={showRemoveConfirm}
          onClose={() => {
            if (!isProcessing) {
              setShowRemoveConfirm(false);
              setSelectedFriend(null);
            }
          }}
          onConfirm={handleConfirmRemoveFriend}
          title="Remove Friend"
          message={selectedFriend ? `Are you sure you want to remove ${selectedFriend.name} from your friends list?` : ''}
          confirmText="Remove"
          cancelText="Cancel"
          confirmColor="#dc3545"
          isLoading={isProcessing}
        />

        {/* Cancel Friend Request Confirmation */}
        <ConfirmationAlert
          show={showCancelConfirm}
          onClose={() => {
            if (!isProcessing) {
              setShowCancelConfirm(false);
              setSelectedCancelRequest(null);
            }
          }}
          onConfirm={handleConfirmCancelRequest}
          title="Cancel Friend Request"
          message={selectedCancelRequest ? `Are you sure you want to cancel the friend request from ${selectedCancelRequest.name}?` : ''}
          confirmText="Cancel Request"
          cancelText="Keep Request"
          confirmColor="#dc3545"
          isLoading={isProcessing}
        />

        {/* Success Alert */}
        <RewardAlert
          show={showSuccessAlert}
          onClose={() => setShowSuccessAlert(false)}
          message={successMessage}
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
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef5eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#4a7c59',
  },
  toggleText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    textAlign: 'center',
  },
  activeToggleText: {
    color: 'white',
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
  requestItem: {
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: '#1e7e34',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  acceptButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: 'white',
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    borderWidth: 2,
    borderColor: '#a71e2a',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rejectButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: 'white',
    textAlign: 'center',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewForestButton: {
    backgroundColor: '#4a7c59',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewForestButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
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