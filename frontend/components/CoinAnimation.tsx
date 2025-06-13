import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface CoinAnimationProps {
  isLoading: boolean;
}

const coinRotationImages = [
  require("@/assets/images/coin.png"),
  require("@/assets/images/girada_1.png"),
  require("@/assets/images/girada_2.png"),
  require("@/assets/images/girada_1.png"), // Invertida para completar el giro
];

export const CoinAnimation: React.FC<CoinAnimationProps> = ({ isLoading }) => {
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setAnimationFrame((prev) => (prev + 1) % coinRotationImages.length);
      }, 300); // Más rápido que la animación de semillas para dar sensación de rotación
    } else {
      setAnimationFrame(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const getCurrentImage = () => {
    const imageIndex = animationFrame;
    const image = coinRotationImages[imageIndex];
    
    // Para el último frame (girada_1 invertida), aplicamos transform
    if (imageIndex === 3) {
      return (
        <Image
          source={image}
          style={[styles.coinImage, { transform: [{ scaleX: -1 }] }]}
          resizeMode="contain"
        />
      );
    }
    
    return (
      <Image
        source={image}
        style={styles.coinImage}
        resizeMode="contain"
      />
    );
  };

  if (!isLoading) {
    return null; // No mostrar nada cuando no está cargando
  }

  return (
    <View style={styles.coinContainer}>
      {getCurrentImage()}
    </View>
  );
};

const styles = StyleSheet.create({
  coinContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
  coinImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
}); 