# 🎨 Pulsebox Advanced Theme System - Senior Design Engineering

## Overview

Complete dark/light mode theme system with Firebase persistence, WCAG AA accessibility compliance, and seamless integration across the entire application.

## Architecture

### Core Components

#### 1. **ThemeProvider** (`theme/themeProvider.tsx`)

- Centralized theme management
- Automatic light/dark mode detection (with `auto` option)
- Firebase persistence of user preference
- Real-time theme switching

**Key Features:**

- `LIGHT_THEME`: Premium light mode design
- `DARK_THEME`: Sophisticated dark mode design
- Auto-detection based on system preference
- Firebase Firestore integration for user preference storage

### 2. **Styled Components** (`components/ui/StyledComponents.tsx`)

Reusable, theme-aware UI components:

- **`Card`** - Versatile container with variants (elevated, outlined, filled)
- **`Button`** - Primary, secondary, tertiary, destructive variants with sizes
- **`ThemedText`** - Smart text component with variants and typography
- **`Section`** - Title + Card wrapper for settings/forms
- **`Surface`** - Simple background surface with levels

### 3. **Color System**

Both themes include:

- **Surface Colors**: Primary, secondary, tertiary surfaces
- **Brand Colors**: Primary, secondary, accent
- **Semantic Colors**: Success, warning, error, info
- **Text Colors**: Primary, secondary, tertiary, disabled, contrast
- **Border & Shadow**: Multiple levels for depth

## Usage Guide

### Using the Theme Hook

```typescript
import { useTheme } from "@/theme/themeProvider";

export const MyComponent = () => {
  const { isDark, mode, theme, setMode } = useTheme();

  return (
    <View style={{ backgroundColor: theme.surface.primary }}>
      <Text style={{ color: theme.text.primary }}>Hello</Text>

      <Button onPress={() => setMode("dark")}>
        Switch to Dark Mode
      </Button>
    </View>
  );
};
```

### Using Styled Components

```typescript
import { Card, Button, ThemedText, Section } from "@/components/ui/StyledComponents";

export const SettingsScreen = () => {
  return (
    <Section title="Appearance">
      <Card variant="elevated">
        <ThemedText variant="primary" size="lg" weight="bold">
          Theme Settings
        </ThemedText>
      </Card>

      <Button variant="primary" size="md">
        Save Changes
      </Button>
    </Section>
  );
};
```

### Theme Switching with Firebase Persistence

```typescript
const { mode, setMode } = useTheme();

// User theme changes are automatically saved to Firebase
await setMode("dark"); // Persists to Firestore
```

## Integration Points

### Firebase Integration

- **Collection**: `users/{uid}`
- **Field**: `themeMode` (light | dark | auto)
- **Auto-sync**: Theme syncs across all user devices
- **Fallback**: Uses system preference if not set

### Color Accessibility

**WCAG AA Compliance:**

- Text contrast ratios ≥ 4.5:1 for normal text
- Text contrast ratios ≥ 3:1 for large text
- High contrast between surface and text layers

### Settings Screen Integration

The Settings screen automatically:

- Shows current theme mode
- Allows switching between light/dark/auto
- Saves preference to Firebase
- Updates UI in real-time

## Design Philosophy - Senior Engineering Standards

### Light Mode

- Clean, minimal aesthetic
- Soft shadows for depth
- High contrast text on light surfaces
- Premium, professional appearance

### Dark Mode

- Elevated surfaces using brightness variation
- Sophisticated color palette
- Reduced eye strain
- Modern, elegant design

### Consistency

- Unified design language across both modes
- Accessible color combinations
- Responsive to system preferences
- Smooth transitions between modes

## File Locations

```
theme/
├── color.ts                 (Legacy - being phased out)
├── themeProvider.tsx        (NEW - Advanced theme system)
├── typography.ts
└── color.ts

components/ui/
├── StyledComponents.tsx     (NEW - Reusable themed components)
├── Navbar.tsx               (Updated - responsive navbar)
├── ModernHome.tsx           (Use theme hook)
└── ...other components

app/
├── _layout.tsx              (Updated - ThemeProvider wrapper)
├── settings.tsx             (Uses theme system)
└── (tabs)/index.tsx
```

## Migration Guide

### Step 1: Import Theme Hook

```typescript
import { useTheme } from "@/theme/themeProvider";
```

### Step 2: Use in Components

Replace hardcoded colors with:

```typescript
const { theme } = useTheme();

<View style={{ backgroundColor: theme.surface.primary }}>
  <Text style={{ color: theme.text.primary }}>Content</Text>
</View>
```

### Step 3: Use Styled Components

Replace custom styling with:

```typescript
import { Card, Button, ThemedText } from "@/components/ui/StyledComponents";

<Card>
  <ThemedText>Content</ThemedText>
</Card>
```

## Firebase Configuration

Ensure your Firebase config includes:

```typescript
// firebaseConfig.ts
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const getFirebaseDb = () => getFirestore();
export const getFirebaseAuth = () => getAuth();
```

## Performance Considerations

- **Context API**: Minimal re-renders through memoization
- **Firebase**: Batched writes on theme change
- **Rendering**: Only affected components re-render
- **Bundle Size**: Tree-shaking removes unused themes

## Testing the Implementation

### Manual Testing

1. Switch theme in settings
2. Verify all screens update
3. Close and reopen app - theme should persist
4. Check accessibility contrast in both modes

### Accessibility Testing

- Use Lighthouse accessibility audit
- Test with screen readers
- Verify WCAG AA color contrast

## Future Enhancements

- [ ] Custom theme creation
- [ ] Per-screen theme overrides
- [ ] Animated theme transitions
- [ ] Theme preview in settings
- [ ] Dynamic color schemes

## Support & Troubleshooting

**Issue**: Theme not persisting?

- Check Firebase Firestore rules
- Verify user is authenticated
- Check console for Firebase errors

**Issue**: Components not updating?

- Ensure component is wrapped in ThemeProvider
- Check useTheme hook is called inside context

**Issue**: Colors look wrong?

- Verify you're using `theme.surface.primary` not `Colors.background`
- Check theme object for available colors

---

**Last Updated**: April 3, 2026
**Design Standard**: WCAG AA Accessibility
**Status**: Production Ready ✓
