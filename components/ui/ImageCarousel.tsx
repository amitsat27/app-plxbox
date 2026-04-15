import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme/themeProvider';
import { X, Plus } from 'lucide-react-native';

interface ImageCarouselProps {
  images: string[];
  onRemove?: (index: number) => void;
  onAdd?: () => void;
  height?: number;
  showAdd?: boolean;
  marginHorizontal?: number;
}

export default function ImageCarousel({
  images,
  onRemove,
  onAdd,
  height = 200,
  showAdd = false,
  marginHorizontal = 16,
}: ImageCarouselProps) {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const carouselWidth = width - marginHorizontal * 2;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    [],
  );

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
      if (currentIndex >= images.length - 2) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      if (images.length <= 2) {
        setCurrentIndex(0);
      }
    }
  };

  if (images.length === 0) {
    return (
      <TouchableOpacity
        style={[
          styles.emptyContainer,
          {
            height: 80,
            marginHorizontal,
            backgroundColor: isDark ? 'rgba(28,28,30,0.6)' : '#F3F4F6',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          },
        ]}
        onPress={onAdd}
      >
        <View style={styles.addPlaceholder}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? '#888' : '#9CA3AF' }}>
            Tap to add photos
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const showAddButton = showAdd && onAdd;

  return (
    <View style={{ marginHorizontal, marginBottom: 12 }}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `carousel-img-${i}`}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        style={{ height }}
        decelerationRate="fast"
        snapToInterval={carouselWidth + 16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item: uri, index }) => (
          <View style={[styles.imageWrapper, { width: carouselWidth, height }]}>
            {/* Loading indicator */}
            {!loadedImages[index] && (
              <View style={[styles.overlay, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}>
                <ActivityIndicator size="large" color="#7C3AED" />
              </View>
            )}
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
              onLoadEnd={() => setLoadedImages((prev) => ({ ...prev, [index]: true }))}
              onError={() => setLoadedImages((prev) => ({ ...prev, [index]: true }))}
            />
            {/* Remove button */}
            {onRemove && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(index)}>
                <X size={14} color="#FFF" />
              </TouchableOpacity>
            )}
            {/* Image counter badge */}
            {images.length > 1 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {index + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Pagination dots */}
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? '#7C3AED' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                  width: i === currentIndex ? 16 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Add more button - below carousel */}
      {showAddButton && (
        <TouchableOpacity style={styles.addButtonContainer} onPress={onAdd}>
          <View style={[styles.addButtonInner, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)' }]}>
            <Plus size={16} color="#7C3AED" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C3AED' }}>
              Add Photo
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counterText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  addButtonContainer: {
    alignSelf: 'flex-start',
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
