import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export const ConfigIcon: React.FC = () => {
  const handlePress = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image 
        source={require('../../public/config-icon.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2d5016',
  },
  icon: {
    width: 20,
    height: 20,
  },
}); 