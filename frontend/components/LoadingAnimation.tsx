import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LoadingAnimationProps {
  isLoading: boolean;
}

const loadingImages = [
  require("@/assets/images/semilla_1.png"),
  require("@/assets/images/semilla_2.png"),
  require("@/assets/images/semilla_3.png"),
  require("@/assets/images/semilla_5.png"),
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ isLoading }) => {
  const [loadingFrame, setLoadingFrame] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingFrame((prev) => (prev + 1) % loadingImages.length);
      }, 500);
    } else {
      setLoadingFrame(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  if (!isLoading) {
    return null; // No mostrar nada cuando no está cargando
  }

  return (
    <View style={styles.treeContainer}>
      <Image
        source={loadingImages[loadingFrame]}
        style={styles.treeImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  treeContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  treeImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
}); 