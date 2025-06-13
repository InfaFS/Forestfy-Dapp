import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface PixelTabIconProps {
  type: 'trees' | 'focus' | 'social';
  focused: boolean;
  color: string;
}

export const PixelTabIcon: React.FC<PixelTabIconProps> = ({ type, focused, color }) => {
  
  const getImageSource = () => {
    switch (type) {
      case 'trees':
        return require('../../public/forest.png');
      case 'focus':
        return require('../../public/home.png');
      case 'social':
        return require('../../public/social.png');
      default:
        return require('../../public/home.png');
    }
  };

  return (
    <View style={styles.iconContainer}>
      <Image 
        source={getImageSource()}
        style={[
          styles.iconImage,
          {
            opacity: focused ? 1 : 0.6, // Más opaco cuando está activo
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 34,
    height: 34,
  },
}); 