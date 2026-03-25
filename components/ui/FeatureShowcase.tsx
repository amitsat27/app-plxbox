import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { GlassContainer } from './GlassContainer';
import { Colors } from '../../theme/color';
import {
  Zap,
  Droplet,
  Flame,
  Activity,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react-native';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  details: string[];
}

const features: Feature[] = [
  {
    id: 'realtime',
    title: 'Real-time Sync',
    description: 'All data syncs instantly across devices',
    icon: <Zap color={Colors.accent} size={32} />,
    color: Colors.accent,
    details: [
      'Live Firestore synchronization',
      'Instant data updates',
      'Cross-device sync',
      'Offline support ready',
    ],
  },
  {
    id: 'auth',
    title: 'Secure Auth',
    description: 'Email & Google authentication',
    icon: <CheckCircle color={Colors.success} size={32} />,
    color: Colors.success,
    details: [
      'Email/Password login',
      'Google Sign-in',
      'Automatic user creation',
      'Profile management',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track usage and performance',
    icon: <TrendingUp color={Colors.primary} size={32} />,
    color: Colors.primary,
    details: [
      'Event tracking',
      'User behavior analytics',
      'Performance metrics',
      'Trend analysis',
    ],
  },
  {
    id: 'bills',
    title: 'Bill Management',
    description: 'Organize and track bills',
    icon: <Calendar color="#6366F1" size={32} />,
    color: '#6366F1',
    details: [
      'Due date tracking',
      'Status management',
      'Amount calculation',
      'Payment reminders',
    ],
  },
  {
    id: 'metrics',
    title: 'Live Metrics',
    description: 'Monitor system performance',
    icon: <Activity color="#10B981" size={32} />,
    color: '#10B981',
    details: [
      'Power consumption',
      'Water usage',
      'Gas metrics',
      'Trend indicators',
    ],
  },
  {
    id: 'logs',
    title: 'System Logs',
    description: 'View system activity history',
    icon: <AlertCircle color="#EF4444" size={32} />,
    color: '#EF4444',
    details: [
      'Action logging',
      'Error tracking',
      'Warning alerts',
      'Event history',
    ],
  },
];

export const FeatureShowcase: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>✨ Pulsebox Features</Text>
            <Text style={styles.subtitle}>
              Powered by Firebase for modern app experience
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.grid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => setSelectedFeature(feature)}
                activeOpacity={0.7}
              >
                <GlassContainer style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${feature.color}20` },
                    ]}
                  >
                    {feature.icon}
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                  <View style={styles.learnMore}>
                    <Text style={styles.learnMoreText}>Learn more →</Text>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Info */}
          <GlassContainer style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>🚀 Built with Modern Tech Stack</Text>
              <View style={styles.techList}>
                <Text style={styles.techItem}>• React Native (Expo)</Text>
                <Text style={styles.techItem}>• Firebase Firestore</Text>
                <Text style={styles.techItem}>• Real-time Authentication</Text>
                <Text style={styles.techItem}>• Zustand State Management</Text>
                <Text style={styles.techItem}>• Animated UI Components</Text>
                <Text style={styles.techItem}>• Glass Morphism Design</Text>
              </View>
            </View>
          </GlassContainer>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Feature Detail Modal */}
      <Modal
        visible={selectedFeature !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFeature(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedFeature(null)}
            >
              <X color={Colors.textPrimary} size={24} />
            </TouchableOpacity>

            {selectedFeature && (
              <View style={styles.modalBody}>
                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: `${selectedFeature.color}20` },
                  ]}
                >
                  {selectedFeature.icon}
                </View>

                <Text style={styles.modalTitle}>{selectedFeature.title}</Text>
                <Text style={styles.modalDescription}>
                  {selectedFeature.description}
                </Text>

                <View style={styles.detailsList}>
                  <Text style={styles.detailsHeader}>Key Features:</Text>
                  {selectedFeature.details.map((detail, index) => (
                    <View key={index} style={styles.detailItem}>
                      <View
                        style={[
                          styles.detailBullet,
                          { backgroundColor: selectedFeature.color },
                        ]}
                      />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeModalButton,
                    { backgroundColor: selectedFeature.color },
                  ]}
                  onPress={() => setSelectedFeature(null)}
                >
                  <Text style={styles.closeModalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  grid: {
    marginBottom: 24,
  },
  featureCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  learnMore: {
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoCard: {
    marginVertical: 20,
    padding: 16,
  },
  infoContent: {
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  techList: {
    width: '100%',
  },
  techItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginVertical: 4,
  },
  spacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.glass,
    borderRadius: 20,
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsList: {
    width: '100%',
    marginBottom: 20,
  },
  detailsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  closeModalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
