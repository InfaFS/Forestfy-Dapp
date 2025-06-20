import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';

interface ClockAnimationProps {
  isActive?: boolean;
  size?: number;
}

const CLOCK_IMAGES = [
  require('@/assets/images/clock_1.png'),
  require('@/assets/images/clock_2.png'),
  require('@/assets/images/clock_3.png'),
  require('@/assets/images/clock_4.png'),
];

export function ClockAnimation({ isActive = false, size = 100 }: ClockAnimationProps) {
  const imageIndexRef = useRef(0);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      // Iniciar la animación de ciclo de imágenes
      intervalRef.current = setInterval(() => {
        imageIndexRef.current = (imageIndexRef.current + 1) % CLOCK_IMAGES.length;
        setCurrentImageIndex(imageIndexRef.current);
      }, 500); // Cambiar imagen cada 500ms

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Detener animaciones cuando no está activo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }
  }, [isActive]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={CLOCK_IMAGES[currentImageIndex]}
        style={[
          styles.clockImage,
          {
            width: size,
            height: size,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockImage: {
    // Estilo base para la imagen del reloj
  },
}); 