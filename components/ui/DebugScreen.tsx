import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { logger } from '../../src/services/Logger';
import { Colors, getColorScheme } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Trash2, Share2, FileText, Download, ChevronLeft } from 'lucide-react-native';

export default function DebugScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<string>('');
  const [logPath, setLogPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const isDark = Colors.background === '#000000';

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logContent = await logger.getLogs();
      const path = logger.getLogFilePath();
      setLogs(logContent);
      setLogPath(path);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    // Refresh logs every 3 seconds if screen is focused
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to delete all log files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await logger.clearLogs();
            loadLogs();
          },
        },
      ]
    );
  };

  const handleShareLogs = async () => {
    try {
      const logContent = await logger.getLogs();
      await Share.share({
        message: logContent,
        title: 'Pulsebox Debug Logs',
        url: logPath,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  const handleCopyLogPath = async () => {
    // For iOS, show instruction on how to access via Files app
    Alert.alert(
      'Access Logs via Files App',
      '1. Open Files app\n2. Go to "On My iPhone"\n3. Find "Pulsebox" folder\n4. Open pulsebox_logs.txt or rotated logs',
      [{ text: 'OK' }]
    );
  };

  const theme = getColorScheme(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.backgroundDark }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.borderDark }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.textPrimary }]}>Debug Logs</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Log File Info */}
      <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(28,28,30,0.6)' : 'rgba(243,243,245,0.6)' }]}>
        <FileText size={20} color={Colors.primary} />
        <Text style={[styles.infoText, { color: Colors.textSecondary }]} numberOfLines={1}>
          {logPath || 'Loading...'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.errorContainer }]}
          onPress={handleClearLogs}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={[styles.actionButtonText, { color: Colors.error }]}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.primaryContainer }]}
          onPress={handleShareLogs}
        >
          <Share2 size={20} color={Colors.primary} />
          <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.secondaryContainer }]}
          onPress={handleCopyLogPath}
        >
          <Download size={20} color={Colors.secondary} />
          <Text style={[styles.actionButtonText, { color: Colors.secondary }]}>Access</Text>
        </TouchableOpacity>
      </View>

      {/* Log Content */}
      <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={true}>
        <Text style={[styles.logContent, { color: theme.textPrimary }]}>
          {isLoading ? 'Loading logs...' : logs || 'No logs yet. Enable debug logging to see messages here.'}
        </Text>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : 'rgba(243,243,245,0.8)' }]}>
        <Text style={[styles.footerText, { color: Colors.textTertiary }]}>
          Logs are automatically saved to your device. Use &quot;Share&quot; to export via email/message.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    flex: 1,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logContent: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.fontSize.xs * 1.4,
  },
  footer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
});
