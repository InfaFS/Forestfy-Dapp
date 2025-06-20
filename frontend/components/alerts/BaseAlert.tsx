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
import { AlertPosition, AlertIcon, AlertThemeName } from '@/types/alerts';
import { 
  defaultAlertTheme, 
  getIconSource, 
  focusAlertTheme, 
  friendsAlertTheme, 
  sessionLostTheme 
} from '@/constants/AlertTheme';

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

export const BaseAlert: React.FC<BaseAlertProps> = ({
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
}) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const alertScale = useRef(new Animated.Value(0.8)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Get theme config
  const getThemeConfig = () => {
    switch (theme) {
      case 'focus':
        return focusAlertTheme;
      case 'friends':
        return friendsAlertTheme;
      case 'sessionLost':
        return sessionLostTheme;
      default:
        return defaultAlertTheme;
    }
  };

  const themeConfig = getThemeConfig();

  // Configurar posición según el theme o prop
  const getPositionStyle = () => {
    const { height } = Dimensions.get('window');
    
    // Use theme positioning if available
    if (theme !== 'default' && themeConfig.positioning) {
      return { 
        top: themeConfig.positioning.top,
        paddingHorizontal: themeConfig.positioning.paddingHorizontal
      };
    }
    
    // Fallback to prop-based positioning
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
      
      if (theme === 'focus' || theme === 'friends' || theme === 'sessionLost') {
        // Use original subtle animation for focus and friends
        Animated.timing(alertOpacity, {
          toValue: 1,
          duration: themeConfig.animation.duration,
          useNativeDriver: true,
        }).start();
      } else {
        // Use default scale animation for other alerts
        alertScale.setValue(0.8);
        Animated.parallel([
          Animated.timing(alertOpacity, {
            toValue: 1,
            duration: themeConfig.animation.duration,
            useNativeDriver: true,
          }),
          Animated.timing(alertScale, {
            toValue: 1,
            duration: themeConfig.animation.duration,
            useNativeDriver: true,
          }),
        ]).start();
      }

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
  }, [show, autoClose, autoCloseDelay, theme]);

  const handleClose = () => {
    // Clear auto close timer
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    // Animate out
    if (theme === 'focus' || theme === 'friends' || theme === 'sessionLost') {
      // Use original subtle animation for focus and friends
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: themeConfig.animation.duration,
        useNativeDriver: true,
      }).start(() => onClose());
    } else {
      // Use default scale animation for other alerts
      Animated.parallel([
        Animated.timing(alertOpacity, {
          toValue: 0,
          duration: themeConfig.animation.duration,
          useNativeDriver: true,
        }),
        Animated.timing(alertScale, {
          toValue: 0.8,
          duration: themeConfig.animation.duration,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }
  };

  const handleBackdropPress = () => {
    if (allowBackdropClose) {
      handleClose();
    }
  };

  if (!show || !fontsLoaded) return null;

  // Get styling from theme
  const styling = themeConfig.styling;
  const animatedStyles = theme === 'focus' || theme === 'friends' || theme === 'sessionLost'
    ? { opacity: alertOpacity } // Only opacity for focus/friends
    : { opacity: alertOpacity, transform: [{ scale: alertScale }] }; // Scale + opacity for others

  return (
    <View style={[styles.overlay, StyleSheet.absoluteFill]}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      
      <Animated.View
        style={[
          styles.alertContainer,
          getPositionStyle(),
          animatedStyles,
        ]}
      >
        <View style={[
          styles.alertContent, 
          styling && {
            backgroundColor: styling.backgroundColor,
            borderColor: styling.borderColor,
            borderWidth: styling.borderWidth,
            borderRadius: styling.borderRadius,
            shadowColor: styling.shadowColor,
            shadowOffset: styling.shadowOffset,
            shadowOpacity: styling.shadowOpacity,
            shadowRadius: styling.shadowRadius,
            elevation: styling.elevation,
          },
          !styling && {
            backgroundColor: themeConfig.colors.background,
            borderColor: themeConfig.colors.border,
            borderWidth: 3,
            borderRadius: 0,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 0,
            elevation: 5,
          },
          { 
            maxWidth: maxWidth || styling?.maxWidth || '90%',
            minWidth: minWidth || styling?.minWidth || 300
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
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  alertContent: {
    paddingVertical: 25,
    paddingHorizontal: 50,
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },
}); 