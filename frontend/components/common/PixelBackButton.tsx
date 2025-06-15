import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';

interface PixelBackButtonProps {
  onPress?: () => void;
  text?: string;
}

export function PixelBackButton({ onPress, text = "← Back" }: PixelBackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity style={styles.backButton} onPress={handlePress}>
      <ThemedText style={styles.backButtonText}>{text}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4a7c59',
    borderWidth: 2,
    borderColor: '#2d5016',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  backButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: 'white',
  },
}); 