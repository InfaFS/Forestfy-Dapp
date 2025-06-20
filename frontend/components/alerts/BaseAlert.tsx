import React, { useEffect, useRef, ReactNode, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Image, 
  Dimensions 
} from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { AlertPosition, AlertIcon, AlertThemeName } from '@/types/alerts';
import { getIconSource, sessionLostTheme } from '@/constants/AlertTheme';

interface BaseAlertProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: AlertPosition;
  icon?: AlertIcon;
  autoClose?: boolean;
  autoCloseDelay?: number;
  allowBackdropClose?: boolean;
  maxWidth?: number | string;
  minWidth?: number | string;
  theme?: AlertThemeName;
}

export interface BaseAlertRef {
  closeWithAnimation: () => void;
}

export const BaseAlert = forwardRef<BaseAlertRef, BaseAlertProps>(({
  show,
  onClose,
  children,
  position = 'center',
  icon = 'logo',
  autoClose = false,
  autoCloseDelay = 3000,
  allowBackdropClose = false,
  maxWidth,
  minWidth,
  theme = 'default',
}, ref) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // All alerts use the same positioning as NFT alerts (40%)
  const getPositionStyle = () => {
    const { height } = Dimensions.get('window');
    return { 
      top: height * 0.4, 
      paddingHorizontal: 20 
    };
  };

  // Simple opacity animation like NFT alerts
  useEffect(() => {
    if (show) {
      alertOpacity.setValue(0);
      
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto close timer
      if (autoClose && autoCloseDelay > 0) {
        autoCloseTimer.current = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    }

    // Cleanup timer
    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    };
  }, [show, autoClose, autoCloseDelay]);

  const handleClose = () => {
    // Clear auto close timer
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    // Simple opacity animation out like NFT alerts
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  // Expose the animated close method to parent components
  useImperativeHandle(ref, () => ({
    closeWithAnimation: handleClose,
  }));

  if (!show || !fontsLoaded) return null;

  // Use exact NFT alert styling for all alerts, except sessionLost
  const getAlertStyles = () => {
    if (theme === 'sessionLost') {
      return {
        backgroundColor: sessionLostTheme.styling.backgroundColor,
        borderColor: sessionLostTheme.styling.borderColor,
        borderWidth: sessionLostTheme.styling.borderWidth,
      };
    }
    return {
      backgroundColor: '#fef5eb',
      borderColor: '#2d5016',
      borderWidth: 3,
    };
  };

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        getPositionStyle(),
        { opacity: alertOpacity }
      ]}
    >
      <View style={[
        styles.alertContent,
        getAlertStyles(),
        (typeof maxWidth === 'number' || typeof minWidth === 'number') && {
          maxWidth: typeof maxWidth === 'number' ? maxWidth : undefined,
          minWidth: typeof minWidth === 'number' ? minWidth : undefined,
        }
      ]}>
        {icon !== 'none' && (
          <Image 
            source={getIconSource(icon)}
            style={styles.icon}
            resizeMode="contain"
          />
        )}
        {children}
      </View>
    </Animated.View>
  );
});

BaseAlert.displayName = 'BaseAlert';

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContent: {
    borderRadius: 0,
    paddingVertical: 25,
    paddingHorizontal: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: '90%',
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },
}); 