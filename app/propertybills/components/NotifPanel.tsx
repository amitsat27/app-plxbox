/**
 * Property Tax — NotifPanel
 * Bottom sheet notification panel
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ScrollView, Platform } from 'react-native';
import { Bell, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

interface TaxNotif {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'overdue';
  timestamp: Date;
  read: boolean;
}

export function NotifPanel({ visible, onClose, notifs }: {
  visible: boolean;
  onClose: () => void;
  notifs: TaxNotif[];
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 150,
    }).start();
  }, [visible, slide]);

  const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ size: number; color: string }>; color: string }> = {
    overdue: { icon: AlertTriangle, color: '#EF4444' },
    warning: { icon: Clock, color: '#F59E0B' },
    success: { icon: CheckCircle, color: '#10B981' },
    info: { icon: Bell, color: '#3B82F6' },
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              transform: [{
                translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }),
              }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Bell size={20} color={scheme.textPrimary} />
              <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Notifications</Text>
              {notifs.filter(n => !n.read).length > 0 && (
                <View style={styles.unreadDot} />
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={scheme.textTertiary} />
            </TouchableOpacity>
          </View>

          {notifs.length === 0 ? (
            <View style={styles.empty}>
              <Bell size={40} color={scheme.textTertiary} opacity={0.3} />
              <Text style={[styles.emptyText, { color: scheme.textTertiary }]}>No notifications</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {notifs.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <View
                    key={n.id}
                    style={[
                      styles.item,
                      {
                        backgroundColor: n.read ? 'transparent' : (isDark ? `${cfg.color}10` : `${cfg.color}06`),
                        borderColor: scheme.border,
                      },
                    ]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: isDark ? `${cfg.color}18` : `${cfg.color}10` }]}>
                      <Icon size={18} color={cfg.color} />
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={[styles.itemTitle, { color: scheme.textPrimary }]}>{n.title}</Text>
                      <Text style={[styles.itemMsg, { color: scheme.textSecondary }]} numberOfLines={2}>{n.message}</Text>
                      <Text style={[styles.itemDate, { color: scheme.textTertiary }]}>
                        {n.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    {!n.read && <View style={styles.unreadIndicator} />}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '85%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.3)',
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  empty: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  emptyText: { marginTop: Spacing.md, fontSize: Typography.fontSize.md },
  list: { maxHeight: 480 },
  item: { flexDirection: 'row', borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, gap: Spacing.sm },
  itemIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  itemMsg: { fontSize: Typography.fontSize.xs, marginTop: 3, lineHeight: Typography.fontSize.xs * 1.7 },
  itemDate: { fontSize: 10, marginTop: 4 },
  unreadIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: Spacing.sm, flexShrink: 0 },
});
