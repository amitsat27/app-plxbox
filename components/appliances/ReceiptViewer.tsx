import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/themeProvider';
import { Colors } from '@/theme/color';
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import type { ServiceReceipt } from '@/src/types';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ReceiptViewerProps {
  receipts: ServiceReceipt[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Page Indicator Dots                                                 */
/* ------------------------------------------------------------------ */
function PageDots({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
  if (count <= 1) return null;

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Zoomable Image Page                                                  */
/* ------------------------------------------------------------------ */
function ImagePage({
  uri,
  onLoadEnd,
  onLoadStart,
}: {
  uri: string;
  onLoadEnd: () => void;
  onLoadStart: () => void;
}) {
  const [zoomedIn, setZoomedIn] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const maxScale = 4;

  const toggleZoom = () => {
    setZoomedIn((z) => !z);
    if (!zoomedIn) {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        ref={scrollViewRef}
        maximumZoomScale={maxScale}
        minimumZoomScale={1}
        contentContainerStyle={styles.imageContentContainer}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bouncesZoom
      >
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
        />
      </ScrollView>

      {/* Zoom toggle overlay button */}
      <TouchableOpacity
        style={styles.zoomBtn}
        activeOpacity={0.6}
        onPress={toggleZoom}
      >
        {zoomedIn ? (
          <ZoomOut size={22} color="#FFF" />
        ) : (
          <ZoomIn size={22} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* PDF Page                                                             */
/* ------------------------------------------------------------------ */
function PdfPage({ receipt }: { receipt: ServiceReceipt }) {
  const openExternally = () => {
    Linking.openURL(receipt.url);
  };

  return (
    <View style={styles.pdfContainer}>
      <FileText size={72} color="rgba(255,255,255,0.45)" />
      <Text style={styles.pdfTitle}>PDF Document</Text>
      {receipt.name && (
        <Text style={styles.pdfName} numberOfLines={2}>
          {receipt.name}
        </Text>
      )}
      <TouchableOpacity
        style={styles.openBtn}
        onPress={openExternally}
        activeOpacity={0.7}
      >
        <Text style={styles.openBtnText}>Preview in Browser</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Main Viewer Component                                                */
/* ------------------------------------------------------------------ */
export default function ReceiptViewer({
  receipts,
  initialIndex,
  visible,
  onClose,
}: ReceiptViewerProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [imageLoading, setImageLoading] = useState(false);
  const [navFade, setNavFade] = useState(new Animated.Value(1));

  // Reset index when viewer opens with a different initialIndex
  React.useEffect(() => {
    if (visible && initialIndex >= 0 && initialIndex < receipts.length) {
      setCurrentIndex(initialIndex);
      flatListRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    }
  }, [visible, initialIndex, receipts.length]);

  /* ---- Navigation ---- */
  const goPrev = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setNavFade(new Animated.Value(1));
    }
  };

  const goNext = () => {
    if (currentIndex < receipts.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setNavFade(new Animated.Value(1));
    }
  };

  // Fade nav arrows after swipe
  React.useEffect(() => {
    if (imageLoading) return;
    setNavFade(new Animated.Value(1));
    const t = setTimeout(() => {
      Animated.timing(navFade, {
        toValue: 0.35,
        duration: 1800,
        useNativeDriver: true,
      }).start();
    }, 2000);
    return () => clearTimeout(t);
  }, [currentIndex, imageLoading]);

  /* ---- Render page ---- */
  const renderPage = useCallback(
    ({ item, index }: { item: ServiceReceipt; index: number }) => {
      if (item.type === 'pdf') {
        return <PdfPage receipt={item} />;
      }
      return (
        <ImagePage
          uri={item.url}
          onLoadStart={() => {
            if (index === currentIndex) setImageLoading(true);
          }}
          onLoadEnd={() => {
            if (index === currentIndex) setImageLoading(false);
          }}
        />
      );
    },
    [currentIndex],
  );

  /* ---- Viewability Config ---- */
  const onViewable = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    [],
  );

  /* ---- Key Extractor ---- */
  const keyExtractor = useCallback(
    (item: ServiceReceipt) => item.id,
    [],
  );

  /* ---- Handle empty ---- */
  if (receipts.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      {/* Background */}
      <View style={styles.root}>
        {/* Header bar */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8 },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <X size={26} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.counterText}>
            {currentIndex + 1} / {receipts.length}
          </Text>
        </View>

        {/* ImageViewer / FlatList */}
        <FlatList
          ref={flatListRef}
          data={receipts}
          renderItem={renderPage}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewabilityConfig}
        />

        {/* Loading Overlay */}
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}

        {/* Navigation Arrows (fadeable) */}
        <Animated.View style={{ opacity: navFade }}>
          {/* Left Arrow */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.navLeft]}
              onPress={goPrev}
              activeOpacity={0.7}
            >
              <ChevronLeft size={28} color="#FFF" />
            </TouchableOpacity>
          )}

          {/* Right Arrow */}
          {currentIndex < receipts.length - 1 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.navRight]}
              onPress={goNext}
              activeOpacity={0.7}
            >
              <ChevronRight size={28} color="#FFF" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Page Indicator Dots */}
        <View style={[styles.dotsContainer, { bottom: insets.bottom + 14 }]}>
          <PageDots count={receipts.length} activeIndex={currentIndex} />
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Image page */
  imageContainer: {
    width: SCREEN_W,
    height: SCREEN_H,
    position: 'relative',
  },
  imageContentContainer: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },

  /* Zoom button inside image page */
  zoomBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  /* Loading overlay */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  /* Navigation arrows */
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },

  /* Page Indicator Dots */
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFF',
  },

  /* PDF page */
  pdfContainer: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  pdfTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  pdfName: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    textAlign: 'center',
  },
  openBtn: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
  },
  openBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
