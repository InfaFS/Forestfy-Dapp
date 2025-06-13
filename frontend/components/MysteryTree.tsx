import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export interface MysteryTreeRef {
  triggerShine: () => void;
}

interface MysteryTreeProps {
  disabled?: boolean;
}

export const MysteryTree = forwardRef<MysteryTreeRef, MysteryTreeProps>(({ disabled = false }, ref) => {
  const imageOpacity = useSharedValue(disabled ? 0.3 : 1);
  const imageTranslateY = useSharedValue(0);
  const imageShake = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    triggerShine: () => {
      if (disabled) return;
      // Animación de vibración al presionar BE FOCUS
      imageShake.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }));

  useEffect(() => {
    // Animación de oscilación suave (la que tenía el signo de interrogación)
    imageTranslateY.value = withRepeat(
      withTiming(-4, {
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Animación de opacidad pulsante
    imageOpacity.value = withRepeat(
      withTiming(disabled ? 0.2 : 0.7, {
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [disabled]);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: imageTranslateY.value },
        { translateX: imageShake.value }
      ],
      opacity: imageOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Imagen del árbol con animación - AGRANDADA */}
      <Animated.View style={imageAnimatedStyle}>
        <Image 
          source={require('../public/treewb.png')}
          style={styles.treeImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    height: 140,
  },
  treeImage: {
    width: 130,
    height: 130,
  },
}); 