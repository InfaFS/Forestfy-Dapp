import React, { useEffect, useRef, ReactNode } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { AlertPosition, AlertIcon } from '@/types/alerts';
import { defaultAlertTheme, getIconSource } from '@/constants/AlertTheme';

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
}

export const BaseAlert: React.FC<BaseAlertProps> = ({
  show,
  onClose,
  children,
  position = 'center',
  icon = 'logo',
  autoClose = false,
  autoCloseDelay = 3000,
  allowBackdropClose = false,
  maxWidth = '90%',
  minWidth = 300,
}) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const alertScale = useRef(new Animated.Value(0.8)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Configurar posición según el prop
  const getPositionStyle = () => {
    const { height } = Dimensions.get('window');
    
    switch (position) {
      case 'top':
        return { top: height * 0.15 };
      case 'bottom':
        return { top: height * 0.7 };
      default: // center
        return { top: height * 0.35 };
    }
  };

  // Animación de entrada
  useEffect(() => {
    if (show) {
      // Reset animation values
      alertOpacity.setValue(0);
      alertScale.setValue(0.8);
      
      // Animate in
      Animated.parallel([
        Animated.timing(alertOpacity, {
          toValue: 1,
          duration: defaultAlertTheme.animation.duration,
          useNativeDriver: true,
        }),
        Animated.timing(alertScale, {
          toValue: 1,
          duration: defaultAlertTheme.animation.duration,
          useNativeDriver: true,
        }),
      ]).start();

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

    // Animate out
    Animated.parallel([
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: defaultAlertTheme.animation.duration,
        useNativeDriver: true,
      }),
      Animated.timing(alertScale, {
        toValue: 0.8,
        duration: defaultAlertTheme.animation.duration,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleBackdropPress = () => {
    if (allowBackdropClose) {
      handleClose();
    }
  };

  if (!show || !fontsLoaded) return null;

  return (
    <View style={[styles.overlay, StyleSheet.absoluteFill]}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      
      <Animated.View
        style={[
          styles.alertContainer,
          getPositionStyle(),
          {
            opacity: alertOpacity,
            transform: [{ scale: alertScale }],
          },
        ]}
      >
        <View style={[
          styles.alertContent, 
          { 
            maxWidth: typeof maxWidth === 'number' ? maxWidth : undefined,
            minWidth: typeof minWidth === 'number' ? minWidth : undefined 
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
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    paddingHorizontal: defaultAlertTheme.spacing.margin,
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  alertContent: {
    backgroundColor: defaultAlertTheme.colors.background,
    borderRadius: 0, // Pixel art style
    borderWidth: 3,
    borderColor: defaultAlertTheme.colors.border,
    paddingVertical: 25,
    paddingHorizontal: defaultAlertTheme.spacing.padding,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    width: '100%',
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },
}); 