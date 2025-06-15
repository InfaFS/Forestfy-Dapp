import React from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { NOTIFICATION_STYLES } from '@/constants/NotificationStyles';

export function NotificationDisplay() {
  const { notifications, removeNotification } = useNotifications();
  
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  if (!fontsLoaded || notifications.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    removeNotification(id);
  };

  return (
    <View style={styles.container}>
      {notifications.map((notification) => {
        // Determinar si es una notificación de venta NFT (más pequeña)
        const isNFTSale = notification.type === 'nft_sold' || notification.type === 'nft_bought';
        
        return (
          <Animated.View
            key={notification.id}
            style={[
              isNFTSale ? styles.smallNotification : styles.notification,
              notification.type === 'nft_sold' && styles.successNotification,
              notification.type === 'nft_bought' && styles.successNotification,
              notification.type === 'nft_listed' && styles.infoNotification,
              notification.type === 'nft_unlisted' && styles.infoNotification,
            ]}
          >
            <View style={styles.content}>
              <Image 
                source={require("@/assets/images/logo.png")}
                style={isNFTSale ? styles.smallLogo : styles.logo}
                resizeMode="contain"
              />
              <View style={styles.textContainer}>
                <Text style={isNFTSale ? styles.smallTitle : styles.title}>
                  {notification.title}
                </Text>
                {notification.message && (
                  <Text style={isNFTSale ? styles.smallMessage : styles.message}>
                    {notification.message}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.dismissButton} 
              onPress={() => handleDismiss(notification.id)}
            >
              <Text style={styles.dismissText}>
                {notification.type === 'nft_sold' ? "Aceptar" : "Dismiss"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Más arriba
    left: 20,
    right: 20,
    zIndex: 9999,
    pointerEvents: 'box-none', // Permitir interacciones con botones
  },
  notification: {
    backgroundColor: NOTIFICATION_STYLES.backgroundColor,
    borderRadius: NOTIFICATION_STYLES.borderRadius,
    padding: 20,
    marginBottom: 8,
    borderWidth: NOTIFICATION_STYLES.borderWidth,
    borderColor: NOTIFICATION_STYLES.borderColor,
    shadowColor: NOTIFICATION_STYLES.shadow.color,
    shadowOffset: NOTIFICATION_STYLES.shadow.offset,
    shadowOpacity: NOTIFICATION_STYLES.shadow.opacity,
    shadowRadius: NOTIFICATION_STYLES.shadow.radius,
    elevation: NOTIFICATION_STYLES.elevation,
    alignItems: 'center',
  },
  // Notificación más pequeña para ventas de NFT
  smallNotification: {
    backgroundColor: NOTIFICATION_STYLES.backgroundColor,
    borderRadius: NOTIFICATION_STYLES.borderRadius,
    padding: 12, // Menos padding
    marginBottom: 8,
    borderWidth: NOTIFICATION_STYLES.borderWidth,
    borderColor: NOTIFICATION_STYLES.borderColor,
    shadowColor: NOTIFICATION_STYLES.shadow.color,
    shadowOffset: NOTIFICATION_STYLES.shadow.offset,
    shadowOpacity: NOTIFICATION_STYLES.shadow.opacity,
    shadowRadius: NOTIFICATION_STYLES.shadow.radius,
    elevation: NOTIFICATION_STYLES.elevation,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  successNotification: {
    backgroundColor: NOTIFICATION_STYLES.success.backgroundColor,
    borderColor: NOTIFICATION_STYLES.success.borderColor,
  },
  errorNotification: {
    backgroundColor: NOTIFICATION_STYLES.error.backgroundColor,
    borderColor: NOTIFICATION_STYLES.error.borderColor,
  },
  infoNotification: {
    backgroundColor: NOTIFICATION_STYLES.info.backgroundColor,
    borderColor: NOTIFICATION_STYLES.info.borderColor,
  },
  logo: {
    width: NOTIFICATION_STYLES.logo.width,
    height: NOTIFICATION_STYLES.logo.height,
    marginBottom: NOTIFICATION_STYLES.logo.marginBottom,
  },
  smallLogo: {
    width: 20, // Más pequeño
    height: 20,
    marginBottom: 0,
  },
  title: {
    fontFamily: NOTIFICATION_STYLES.fonts.title.fontFamily,
    fontSize: NOTIFICATION_STYLES.fonts.title.fontSize,
    color: NOTIFICATION_STYLES.textColor,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: NOTIFICATION_STYLES.fonts.title.lineHeight,
  },
  smallTitle: {
    fontFamily: NOTIFICATION_STYLES.fonts.title.fontFamily,
    fontSize: 8, // Más pequeño
    color: NOTIFICATION_STYLES.textColor,
    marginBottom: 4,
    textAlign: 'left',
    lineHeight: 12,
  },
  message: {
    fontFamily: NOTIFICATION_STYLES.fonts.message.fontFamily,
    fontSize: NOTIFICATION_STYLES.fonts.message.fontSize,
    color: NOTIFICATION_STYLES.subtextColor,
    lineHeight: NOTIFICATION_STYLES.fonts.message.lineHeight,
    textAlign: 'center',
  },
  smallMessage: {
    fontFamily: NOTIFICATION_STYLES.fonts.message.fontFamily,
    fontSize: 6, // Más pequeño
    color: NOTIFICATION_STYLES.subtextColor,
    lineHeight: 10,
    textAlign: 'left',
  },
  dismissButton: {
    backgroundColor: '#4a7c59',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d5016',
    marginTop: 8,
    alignSelf: 'center',
  },
  dismissText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: '#fef5eb',
    textAlign: 'center',
  },
}); 