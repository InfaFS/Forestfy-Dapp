import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ui';

interface EventToastProps {
  visible: boolean;
  message: string;
  type: 'listed' | 'unlisted' | 'sold';
  onHide: () => void;
  duration?: number;
}

export function EventToast({ visible, message, type, onHide, duration = 3000 }: EventToastProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide después de la duración
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, fadeAnim, slideAnim]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'listed':
        return '🆕';
      case 'unlisted':
        return '🗑️';
      case 'sold':
        return '💰';
      default:
        return '📢';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'listed':
        return '#4CAF50';
      case 'unlisted':
        return '#FF9800';
      case 'sold':
        return '#2196F3';
      default:
        return '#4a7c59';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={hideToast} activeOpacity={0.9}>
        <ThemedText style={styles.icon}>{getIcon()}</ThemedText>
        <ThemedText style={styles.message} numberOfLines={2}>
          {message}
        </ThemedText>
        <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
          <ThemedText style={styles.closeText}>×</ThemedText>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d5016',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: 'white',
    lineHeight: 14,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
}); 