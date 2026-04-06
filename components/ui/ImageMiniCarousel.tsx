/**
 * ImageMiniCarousel — Compact horizontal image carousel for card/list items
 * Simpler than ImageCarousel: uses horizontal ScrollView with pagination dots
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/themeProvider';

interface ImageMiniCarouselProps {
  images: string[];
  width?: number;
  height?: number;
  borderRadius?: number;
  showDots?: boolean;
  onTap?: () => void;
}

export default function ImageMiniCarousel({
  images,
  width = 180,
  height = 160,
  borderRadius = 12,
  showDots = true,
  onTap,
}: ImageMiniCarouselProps) {
  const { isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const onScroll = useCallback(
    (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / width);
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [currentIndex, width],
  );

  if (!images.length) return null;

  return (
    <View style={{ width }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {images.map((uri, index) => (
          <View key={index} style={{ width, height }}>
            {/* Loading indicator */}
            {!loadedImages[index] && (
              <View
                style={[
                  styles.overlay,
                  { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderRadius },
                ]}
              >
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            )}
            <Image
              source={{ uri }}
              style={[styles.image, { width, height, borderRadius }]}
              resizeMode="cover"
              onLoadEnd={() => setLoadedImages((prev) => ({ ...prev, [index]: true }))}
              onError={() => setLoadedImages((prev) => ({ ...prev, [index]: true }))}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {showDots && images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex
                      ? '#FFFFFF'
                      : 'rgba(255,255,255,0.4)',
                  width: i === currentIndex ? 12 : 6,
                  height: 6,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Tap area for navigation to detail */}
      {onTap && (
        <View
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          onStartShouldSetResponder={() => false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 2,
  },
  dot: {
    borderRadius: 3,
  },
});
