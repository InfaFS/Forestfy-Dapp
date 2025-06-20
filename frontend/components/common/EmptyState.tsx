import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { ThemedView, ThemedText } from '@/components/ui';

interface EmptyStateProps {
  image?: any;
  message: string;
  style?: any;
}

export function EmptyState({ 
  image = require("@/assets/images/marchitado.png"), 
  message,
  style
}: EmptyStateProps) {
  return (
    <ThemedView style={[styles.emptyContainer, style]}>
      <Image
        source={image}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText style={styles.emptyText}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fef5eb',
    borderWidth: 2,
    borderColor: '#2d5016',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    textAlign: 'center',
    color: '#4a7c59',
    lineHeight: 14,
  },
}); 