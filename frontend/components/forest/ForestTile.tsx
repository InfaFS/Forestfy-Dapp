import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';

export interface ForestTileProps {
  id: number;
  status: 'empty' | 'tree' | 'burned';
  onPress?: (id: number) => void;
}

export function ForestTile({ id, status, onPress }: ForestTileProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(id)}
      activeOpacity={0.8}
    >
      <Image 
        source={require('@/public/dirt.png')} 
        style={styles.tileImage}
        resizeMode="cover"
      />
      {status === 'tree' && (
        <Image 
          source={require('@/public/treenormal.png')} 
          style={styles.treeImage}
          resizeMode="contain"
        />
      )}
      {status === 'burned' && (
        <View style={styles.burnedOverlay} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    marginRight: -16,
    marginBottom: -16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  treeImage: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    top: -10,
  },
  burnedOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
}); 