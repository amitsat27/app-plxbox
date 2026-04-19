import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowUpDown,
  Car,
  ChevronRight,
  FileText,
  Flame,
  Grid3X3,
  Home,
  Lock,
  Monitor,
  Search,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react-native";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

type ExploreCategory = "all" | "billing" | "assets" | "insights" | "security";
type SortMode = "a-z" | "popular";

type SectionItem = {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<ExploreCategory, "all">;
  priority: number;
  icon: React.ReactNode;
  accent: string;
  bgTint: { light: string; dark: string };
  dest: string;
};

const SECTIONS: SectionItem[] = [
  {
    id: "bills",
    title: "All Bills",
    subtitle: "Manage and track all bill records",
    category: "billing",
    priority: 10,
    icon: <Wallet size={20} color="#7C3AED" />,
    accent: "#7C3AED",
    bgTint: { light: "rgba(124,58,237,0.08)", dark: "rgba(124,58,237,0.18)" },
    dest: "/bills",
  },
  {
    id: "electric",
    title: "Electric Bills",
    subtitle: "Power usage and due cycles",
    category: "billing",
    priority: 9,
    icon: <Zap size={20} color="#F59E0B" />,
    accent: "#F59E0B",
    bgTint: { light: "rgba(245,158,11,0.08)", dark: "rgba(245,158,11,0.16)" },
    dest: "/electric-bills",
  },
  {
    id: "gas",
    title: "Gas Manager",
    subtitle: "MNGL bills and refill records",
    category: "billing",
    priority: 8,
    icon: <Flame size={20} color="#EF4444" />,
    accent: "#EF4444",
    bgTint: { light: "rgba(239,68,68,0.08)", dark: "rgba(239,68,68,0.16)" },
    dest: "/gas-manager",
  },
  {
    id: "wifi",
    title: "WiFi Bills",
    subtitle: "Internet subscriptions and renewals",
    category: "billing",
    priority: 7,
    icon: <Wifi size={20} color="#8B5CF6" />,
    accent: "#8B5CF6",
    bgTint: { light: "rgba(139,92,246,0.08)", dark: "rgba(139,92,246,0.16)" },
    dest: "/wifibills",
  },
  {
    id: "property",
    title: "Property Tax",
    subtitle: "Tax dues and payment snapshots",
    category: "billing",
    priority: 6,
    icon: <Home size={20} color="#10B981" />,
    accent: "#10B981",
    bgTint: { light: "rgba(16,185,129,0.08)", dark: "rgba(16,185,129,0.16)" },
    dest: "/propertybills",
  },
  {
    id: "vehicles",
    title: "Vehicles",
    subtitle: "Fleet tracking and compliance",
    category: "assets",
    priority: 9,
    icon: <Car size={20} color="#F59E0B" />,
    accent: "#F59E0B",
    bgTint: { light: "rgba(245,158,11,0.08)", dark: "rgba(245,158,11,0.16)" },
    dest: "/vehicles",
  },
  {
    id: "appliances",
    title: "Appliances",
    subtitle: "Home devices and maintenance",
    category: "assets",
    priority: 7,
    icon: <Monitor size={20} color="#06B6D4" />,
    accent: "#06B6D4",
    bgTint: { light: "rgba(6,182,212,0.08)", dark: "rgba(6,182,212,0.16)" },
    dest: "/appliances",
  },
  {
    id: "reports",
    title: "Reports",
    subtitle: "Analytics and spending trends",
    category: "insights",
    priority: 8,
    icon: <FileText size={20} color="#10B981" />,
    accent: "#10B981",
    bgTint: { light: "rgba(16,185,129,0.08)", dark: "rgba(16,185,129,0.16)" },
    dest: "/reports",
  },
  {
    id: "transactions",
    title: "Transactions",
    subtitle: "PDF analysis for UPI statements",
    category: "insights",
    priority: 7,
    icon: <Wallet size={20} color="#6366F1" />,
    accent: "#6366F1",
    bgTint: { light: "rgba(99,102,241,0.08)", dark: "rgba(99,102,241,0.16)" },
    dest: "/transactions",
  },
  {
    id: "passwords",
    title: "Passwords",
    subtitle: "Vault and secure credentials",
    category: "security",
    priority: 10,
    icon: <Lock size={20} color="#EC4899" />,
    accent: "#EC4899",
    bgTint: { light: "rgba(236,72,153,0.08)", dark: "rgba(236,72,153,0.16)" },
    dest: "/passwords",
  },
];

const FILTERS: { key: ExploreCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "billing", label: "Billing" },
  { key: "assets", label: "Assets" },
  { key: "insights", label: "Insights" },
  { key: "security", label: "Security" },
];

export default function SectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ExploreCategory>("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const displaySections = useMemo(() => {
    const q = query.trim().toLowerCase();

    let filtered = SECTIONS.filter((item) => {
      if (activeFilter !== "all" && item.category !== activeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortMode === "a-z") return a.title.localeCompare(b.title);
      return b.priority - a.priority;
    });

    return filtered;
  }, [activeFilter, query, sortMode]);

  const featured = displaySections.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#07070A" : "#EEF2F7" }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ["#1A1C34", "#121223"] : ["#F8FCFF", "#EDF4FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: isDark ? "rgba(124,58,237,0.24)" : "rgba(124,58,237,0.14)" }]}>
              <Grid3X3 size={20} color={Colors.primary} />
            </View>
            <View style={[styles.heroBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(124,58,237,0.1)" }]}>
              <Text style={[styles.heroBadgeText, { color: Colors.primary }]}>{displaySections.length} results</Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: scheme.textPrimary }]}>Explore</Text>
          <Text style={[styles.heroSubtitle, { color: scheme.textSecondary }]}>Discover every module and jump straight into action.</Text>
        </LinearGradient>

        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: isDark ? "#15151A" : "#FFFFFF",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
            },
          ]}
        >
          <Search size={18} color={scheme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search sections, tasks, or categories"
            placeholderTextColor={scheme.textTertiary}
            style={[styles.searchInput, { color: scheme.textPrimary }]}
          />
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)" }]}
            onPress={() => setSortMode((current) => (current === "popular" ? "a-z" : "popular"))}
          >
            <ArrowUpDown size={14} color={scheme.textSecondary} />
            <Text style={[styles.sortText, { color: scheme.textSecondary }]}>{sortMode === "popular" ? "Popular" : "A-Z"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === filter.key
                      ? Colors.primary
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(15,23,42,0.06)",
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, { color: activeFilter === filter.key ? "#FFFFFF" : scheme.textSecondary }]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.featuredRow}>
          {featured.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.featuredCard,
                {
                  backgroundColor: isDark ? "#15151A" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(item.dest as any);
              }}
            >
              <View style={[styles.featuredIcon, { backgroundColor: item.bgTint[isDark ? "dark" : "light"] }]}>{item.icon}</View>
              <Text style={[styles.featuredTitle, { color: scheme.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.gridWrap}>
          {displaySections.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.gridCard,
                {
                  backgroundColor: isDark ? "#15151A" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.dest as any);
              }}
            >
              <View style={[styles.gridTopRow, { backgroundColor: item.bgTint[isDark ? "dark" : "light"] }]}>
                <View style={styles.gridIconWrap}>{item.icon}</View>
                <ChevronRight size={16} color={item.accent} />
              </View>
              <Text style={[styles.gridTitle, { color: scheme.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.gridSub, { color: scheme.textSecondary }]} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.16)",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sortText: {
    fontSize: 11,
    fontWeight: "700",
  },
  filterRow: {
    gap: 8,
    paddingRight: 24,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  featuredRow: {
    flexDirection: "row",
    gap: 10,
  },
  featuredCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7 },
      android: { elevation: 1 },
    }),
  },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  gridCard: {
    width: "48.7%",
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: 12,
    minHeight: 154,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 9 },
      android: { elevation: 2 },
    }),
  },
  gridTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  gridIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  gridTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
  gridSub: {
    marginTop: 4,
    fontSize: Typography.fontSize.xs,
    lineHeight: 17,
    fontWeight: "500",
  },
});
