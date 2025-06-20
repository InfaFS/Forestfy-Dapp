import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, ScrollView, View, TouchableOpacity, DeviceEventEmitter, Alert } from 'react-native';
import { ThemedView, ThemedText } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { UserRegistryContract } from '@/constants/thirdweb';

import { useAlert } from '@/hooks/useAlert';
import { AlertRenderer } from '@/components/alerts/AlertRenderer';
import { sendFriendRequest, acceptFriendRequest, removeFriend, cancelFriendRequest } from '@/constants/api';
import { useUserRegistryEvents } from '@/hooks/useUserRegistryEvents';
import { useRouter } from "expo-router";

export default function SocialScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const [friendsWithNames, setFriendsWithNames] = useState<Array<{address: string, name: string}>>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState<Array<{address: string, name: string}>>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const alert = useAlert();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAddFriend = async () => {
    if (!account?.address) {
      await alert.showInfoAlert({
        title: "Wallet Required",
        message: "Please connect your wallet to add friends",
        variant: "destructive",
        icon: "error"
      });
      return;
    }

    try {
      const username = await alert.showInputAlert({
        title: "Add Friend",
        message: "Enter the username to add as friend",
        placeholder: "Username",
        maxLength: 50,
        submitText: "Send Request",
        cancelText: "Cancel",
        validation: (value) => {
          const trimmedUsername = value.trim();
          if (!trimmedUsername) {
            return "Please enter a username";
          }
          return null;
        }
      });

      if (!username) {
        return; // User cancelled
      }

      // Show loading alert while processing
      const loadingId = alert.showLoadingAlert({
        title: "Processing Request",
        message: "Validating user and sending request...",
        allowCancel: false
      });

      try {
        // Get user address and validate
        const userAddress = await readContract({
          contract: UserRegistryContract,
          method: "function getAddressByName(string) view returns (address)",
          params: [username],
        });

        if (!userAddress || userAddress === "0x0000000000000000000000000000000000000000") {
          alert.hideAlert(loadingId);
          await alert.showInfoAlert({
            title: "User Not Found",
            message: "User not found",
            variant: "destructive",
            icon: "error"
          });
          return;
        }

        if (userAddress === account.address) {
          alert.hideAlert(loadingId);
          await alert.showInfoAlert({
            title: "Invalid User",
            message: "Cannot add yourself as friend",
            variant: "destructive",
            icon: "error"
          });
          return;
        }

        // Check if already friends
        const areFriends = await readContract({
          contract: UserRegistryContract,
          method: "function areFriends(address, address) view returns (bool)",
          params: [account.address, userAddress],
        });

        if (areFriends) {
          alert.hideAlert(loadingId);
          await alert.showInfoAlert({
            title: "Already Friends",
            message: "Already friends with this user",
            icon: "info"
          });
          return;
        }

        // Check if they already sent me a request
        const requestReceived = await readContract({
          contract: UserRegistryContract,
          method: "function friendRequests(address, address) view returns (bool)",
          params: [userAddress, account.address],
        });

        if (requestReceived) {
          alert.hideAlert(loadingId);
          await alert.showInfoAlert({
            title: "Pending Request",
            message: "There is already a pending request from this user",
            icon: "info"
          });
          return;
        }

        // Check if I already sent them a request
        const requestSent = await readContract({
          contract: UserRegistryContract,
          method: "function friendRequests(address, address) view returns (bool)",
          params: [account.address, userAddress],
        });

        if (requestSent) {
          alert.hideAlert(loadingId);
          await alert.showInfoAlert({
            title: "Request Already Sent",
            message: "Friend request already sent",
            icon: "info"
          });
          return;
        }

        // Send friend request via API
        const response = await sendFriendRequest(account.address, userAddress);
        
        // Hide loading alert
        alert.hideAlert(loadingId);
        
        // Show success message
        await alert.showInfoAlert({
          title: "Friend Request Sent",
          message: `Friend request sent to ${username} successfully!`,
          icon: "success"
        });

        // Auto-refresh data when friend is added successfully
        refetchFriends();
        DeviceEventEmitter.emit('refreshSocialData');

      } catch (apiError: any) {
        // Hide loading alert
        alert.hideAlert(loadingId);
        
        // Show specific API error
        await alert.showInfoAlert({
          title: "Request Failed",
          message: apiError.message || "Failed to send friend request. Please try again.",
          variant: "destructive",
          icon: "error"
        });
      }
    } catch (error: any) {
      // This catches errors from blockchain calls (readContract), not API calls
      console.error('Error validating user or checking friendship status:', error);
      await alert.showInfoAlert({
        title: "Validation Error",
        message: "Error validating user information. Please try again.",
        variant: "destructive",
        icon: "error"
      });
    }
  };

  const handleShowSuccessMessage = async (message: string) => {
    await alert.showInfoAlert({
      title: message,
      variant: "success",
      icon: "success"
    });
    // Refresh friends data
    refetchFriends();
    DeviceEventEmitter.emit('refreshSocialData');
  };

  const handleToggleRequests = () => {
    setShowRequests(!showRequests);
  };

  const handleAcceptRequest = async (fromAddress: string, fromName: string) => {
    const confirmed = await alert.showConfirmAlert({
      title: "Accept Friend Request",
      message: `Accept friend request from ${fromName}?`,
      confirmText: "Accept",
      cancelText: "Cancel",
      icon: "logo"
    });

    if (confirmed) {
      await handleConfirmAcceptRequest(fromAddress, fromName);
    }
  };

  const handleConfirmAcceptRequest = async (fromAddress: string, fromName: string) => {
    if (!account?.address) return;

    // Show loading alert
    const loadingId = alert.showLoadingAlert({
      title: "Accepting Request",
      message: `Accepting friend request from ${fromName}...`,
      allowCancel: false
    });

    setIsProcessing(true);
    try {
      await acceptFriendRequest(fromAddress, account.address);
      
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Friend Request Accepted",
        message: `You are now friends with ${fromName}!`,
        icon: "success"
      });
      
      // Refresh data
      refetchFriends();
      const updatedRequests = await getFriendRequests();
      setFriendRequests(updatedRequests);
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Error",
        message: error.message || "Could not accept friend request",
        variant: "destructive",
        icon: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (fromAddress: string, fromName: string) => {
    const confirmed = await alert.showConfirmAlert({
      title: "Reject Friend Request",
      message: `Reject friend request from ${fromName}?`,
      confirmText: "Reject",
      cancelText: "Cancel",
      variant: "destructive"
    });

    if (confirmed) {
      await handleConfirmCancelRequest(fromAddress, fromName);
    }
  };

  const handleConfirmCancelRequest = async (fromAddress: string, fromName: string) => {
    if (!account?.address) return;

    // Show loading alert
    const loadingId = alert.showLoadingAlert({
      title: "Rejecting Request",
      message: `Rejecting friend request from ${fromName}...`,
      allowCancel: false
    });

    setIsProcessing(true);
    try {
      await cancelFriendRequest(fromAddress, account.address);
      
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Friend Request Rejected",
        message: `Friend request from ${fromName} has been rejected`,
        icon: "success"
      });
      
      // Refresh data
      const updatedRequests = await getFriendRequests();
      setFriendRequests(updatedRequests);
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error cancelling friend request:", error);
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Error",
        message: error.message || "Could not reject friend request",
        variant: "destructive",
        icon: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async (friendAddress: string, friendName: string) => {
    const confirmed = await alert.showConfirmAlert({
      title: "Remove Friend",
      message: `Remove ${friendName} from your friends list?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "destructive"
    });

    if (confirmed) {
      await handleConfirmRemoveFriend(friendAddress, friendName);
    }
  };

  const handleConfirmRemoveFriend = async (friendAddress: string, friendName: string) => {
    if (!account?.address) return;

    // Show loading alert
    const loadingId = alert.showLoadingAlert({
      title: "Removing Friend",
      message: `Removing ${friendName} from your friends list...`,
      allowCancel: false
    });

    setIsProcessing(true);
    try {
      await removeFriend(account.address, friendAddress);
      
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Friend Removed",
        message: `${friendName} has been removed from your friends list`,
        icon: "success"
      });
      
      // Refresh data
      refetchFriends();
      DeviceEventEmitter.emit('refreshSocialData');
      
    } catch (error: any) {
      console.error("Error removing friend:", error);
      // Hide loading alert
      alert.hideAlert(loadingId);
      
      await alert.showInfoAlert({
        title: "Error",
        message: error.message || "Could not remove friend",
        variant: "destructive",
        icon: "error"
      });
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

              {/* Add Friend Button - only visible in Friends view */}
              {!showRequests && (
                <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
                  <ThemedText style={styles.addFriendButtonText}>+ Add Friend</ThemedText>
                </TouchableOpacity>
              )}

              {/* Content based on toggle */}
              {!showRequests ? (
                // Friends List
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                  {isLoadingFriends || isLoadingNames ? (
                    <ThemedView style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>Loading friends...</ThemedText>
                    </ThemedView>
                  ) : friendsWithNames.length === 0 ? (
                    <ThemedView style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>No friends yet</ThemedText>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.friendsContainer}>
                      {friendsWithNames.map((friend) => (
                        <ThemedView key={friend.address} style={styles.friendItem}>
                          <View style={styles.friendInfo}>
                            <ThemedText style={styles.friendName}>{friend.name}</ThemedText>
                            <ThemedText style={styles.friendAddress}>
                              {friend.address.slice(0, 6)}...{friend.address.slice(-4)}
                            </ThemedText>
                          </View>
                          <View style={styles.requestButtons}>
                            <TouchableOpacity 
                              style={styles.acceptButton}
                              onPress={() => handleViewFriendForest(friend.address, friend.name)}
                            >
                              <ThemedText style={styles.acceptButtonText}>View</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => handleRemoveFriend(friend.address, friend.name)}
                            >
                              <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </ThemedView>
                      ))}
                    </ThemedView>
                  )}
                </ScrollView>
              ) : (
                // Friend Requests
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                  {isLoadingRequests ? (
                    <ThemedView style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>Loading requests...</ThemedText>
                    </ThemedView>
                  ) : friendRequests.length === 0 ? (
                    <ThemedView style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>No pending requests</ThemedText>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.friendsContainer}>
                      {friendRequests.map((request) => (
                        <ThemedView key={request.address} style={styles.requestItem}>
                          <View style={styles.friendInfo}>
                            <ThemedText style={styles.friendName}>{request.name}</ThemedText>
                            <ThemedText style={styles.friendAddress}>
                              {request.address.slice(0, 6)}...{request.address.slice(-4)}
                            </ThemedText>
                          </View>
                          <View style={styles.requestButtons}>
                            <TouchableOpacity 
                              style={styles.acceptButton}
                              onPress={() => handleAcceptRequest(request.address, request.name)}
                              disabled={isProcessing}
                            >
                              <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => handleRejectRequest(request.address, request.name)}
                              disabled={isProcessing}
                            >
                              <ThemedText style={styles.removeButtonText}>Reject</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </ThemedView>
                      ))}
                    </ThemedView>
                  )}
                </ScrollView>
              )}
            </>
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                You need to be registered to use social features.
                Go to your profile to register.
              </ThemedText>
            </ThemedView>
          )
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>Connect your wallet to access social features</ThemedText>
          </ThemedView>
        )}

        {/* Alert Renderer */}
        <AlertRenderer alerts={alert._alerts} />
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
    backgroundColor: '#0f1f06',
    borderWidth: 2,
    borderColor: '#050a02',
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