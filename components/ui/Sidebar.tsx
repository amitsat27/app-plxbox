import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/color';
import { Zap, Droplet, Flame, Truck, Wifi, Home as HomeIcon, Settings, LogOut } from 'lucide-react-native';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface SidebarProps {
  activeItem?: string;
  onItemPress?: (itemId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'home', onItemPress }) => {
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon size={24} color={activeItem === 'home' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'home',
    },
    {
      id: 'electric',
      label: 'Electric Bills',
      icon: <Zap size={24} color={activeItem === 'electric' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'electric',
    },
    {
      id: 'water',
      label: 'Water Bills',
      icon: <Droplet size={24} color={activeItem === 'water' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'water',
    },
    {
      id: 'gas',
      label: 'Gas Bills',
      icon: <Flame size={24} color={activeItem === 'gas' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'gas',
    },
    {
      id: 'wifi',
      label: 'WiFi Bills',
      icon: <Wifi size={24} color={activeItem === 'wifi' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'wifi',
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: <Truck size={24} color={activeItem === 'vehicles' ? Colors.primary : Colors.textSecondary} />,
      active: activeItem === 'vehicles',
    },
  ];

  return (
    <View style={styles.sidebarContainer}>
      <SafeAreaView style={styles.sidebar}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.logoText}>Pulsebox</Text>
          <Text style={styles.logoSubtext}>Dashboard</Text>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                item.active && styles.navItemActive,
              ]}
              onPress={() => onItemPress?.(item.id)}
            >
              <View style={styles.navIconWrapper}>
                {item.icon}
              </View>
              <Text style={[
                styles.navItemLabel,
                item.active && styles.navItemLabelActive,
              ]}>
                {item.label}
              </Text>
              {item.active && <View style={styles.activeBadge} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.footerItem}>
            <Settings size={20} color={Colors.textSecondary} />
            <Text style={styles.footerItemLabel}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <LogOut size={20} color={Colors.danger} />
            <Text style={[styles.footerItemLabel, { color: Colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sidebarHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  navList: {
    marginBottom: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  navIconWrapper: {
    marginRight: 12,
  },
  navItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
  },
  navItemLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activeBadge: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerItemLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
