import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { BaseAlert } from './BaseAlert';
import { LoadingAlertProps } from '@/types/alerts';
import { defaultAlertTheme } from '@/constants/AlertTheme';

export const LoadingAlert: React.FC<LoadingAlertProps> = ({
  show,
  onClose,
  onCancel,
  title = "Loading...",
  message,
  progress,
  loadingText = "Please wait...",
  allowCancel = false,
  variant = 'neutral',
  icon = 'logo',
  position = 'center',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  // Animate progress bar if progress is provided
  useEffect(() => {
    if (typeof progress === 'number' && progress >= 0 && progress <= 100) {
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim]);

  // Animate loading dots
  useEffect(() => {
    if (show) {
      const animateDots = () => {
        Animated.sequence([
          Animated.timing(dotsAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (show) animateDots();
        });
      };
      animateDots();
    }
  }, [show, dotsAnim]);

  const handleCancel = () => {
    if (allowCancel && onCancel) {
      onCancel();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <BaseAlert
      show={show}
      onClose={onClose}
      icon={icon}
      position={position}
      autoClose={autoClose}
      autoCloseDelay={autoCloseDelay}
      allowBackdropClose={false}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      
      {/* Progress bar si se proporciona progress */}
      {typeof progress === 'number' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: progressWidth }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
      
      {/* Loading text con dots animados */}
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{loadingText}</Text>
        <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
          <Text style={styles.dots}>...</Text>
        </Animated.View>
      </View>
      
      {/* Cancel button si está permitido */}
      {allowCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </BaseAlert>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: defaultAlertTheme.fonts.sizes.title,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  message: {
    fontSize: defaultAlertTheme.fonts.sizes.message,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 14,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: defaultAlertTheme.colors.primary,
  },
  progressText: {
    fontSize: defaultAlertTheme.fonts.sizes.button,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: defaultAlertTheme.fonts.sizes.message,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.textSecondary,
  },
  dotsContainer: {
    marginLeft: 5,
  },
  dots: {
    fontSize: defaultAlertTheme.fonts.sizes.message,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.textSecondary,
  },
  cancelButton: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    backgroundColor: defaultAlertTheme.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontFamily: defaultAlertTheme.fonts.primary,
    fontSize: defaultAlertTheme.fonts.sizes.button,
    color: defaultAlertTheme.colors.text,
  },
}); 