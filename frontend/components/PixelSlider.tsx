import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

interface PixelSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

export const PixelSlider: React.FC<PixelSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 15,
  maximumValue = 120,
  step = 5,
}) => {
  const SLIDER_WIDTH = 260;
  const SEGMENT_COUNT = 26; // Más segmentos para un look más pixelado
  
  const handleSegmentPress = (index: number) => {
    const percentage = index / (SEGMENT_COUNT - 1);
    const rawValue = minimumValue + percentage * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.min(Math.max(steppedValue, minimumValue), maximumValue);
    onValueChange(finalValue);
  };

  const currentProgress = (value - minimumValue) / (maximumValue - minimumValue);
  const activeSegments = Math.round(currentProgress * (SEGMENT_COUNT - 1));

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        {/* Pista pixelada con segmentos */}
        <View style={styles.trackBackground}>
          {Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.trackSegment,
                {
                  backgroundColor: index <= activeSegments ? '#2e7d32' : '#c0c0c0',
                }
              ]}
              onPress={() => handleSegmentPress(index)}
              activeOpacity={0.8}
            />
          ))}
        </View>
        
        {/* Bolita negra (thumb) */}
        <View 
          style={[
            styles.thumb,
            {
              left: (currentProgress * (SLIDER_WIDTH - 16)) + 8, // 16 es el ancho del thumb, 8 para centrarlo
            }
          ]}
        >
          <View style={styles.thumbInner} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  sliderContainer: {
    width: 260,
    height: 30,
    position: 'relative',
    justifyContent: 'center',
  },
  trackBackground: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 10,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#000',
    transform: [{ translateY: -5 }],
    backgroundColor: '#c0c0c0',
  },
  trackSegment: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    marginHorizontal: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    width: 16,
    height: 16,
    transform: [{ translateY: -8 }, { translateX: -8 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    width: 14,
    height: 14,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 0, // Mantener cuadrado para estilo pixel
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
}); 