# 🎨 PulseBox UI Layout Guide - Visual Reference

## Home Screen Layout

```
┌─────────────────────────────────────────┐
│ PulseBox              ⚙️ Settings       │ ← Header (BlurView)
│ Dashboard                               │   Blue Bar Color
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│   Good Morning, Amit 👋                │ ← Welcome Section
│   Here's your bill summary              │   16px top padding
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚡ Total Bills     ₹2,500      +12%  ↗ │ ← Card 1: Main Metric
│    4 bills pending                      │   Purple accent
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️  Pending              4     75%   ↗ │ ← Card 2: Status
│    due soon                             │   Warning color
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📈 Paid This Month  ₹1,750      +5%   │ ← Card 3: Success
│    70% of total                         │   Green accent
└─────────────────────────────────────────┘

┌──────────────────┬─────────────────────┐
│  ➕ Add Bill     │  📈 Analytics       │ ← Quick Actions
│                  │                      │   (2-column grid)
└──────────────────┴─────────────────────┘

┌─────────────────────────────────────────┐
│ Categories                    See all → │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚡ Electricity        ₹1,200           →│ ← Category Row
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💧 Water              ₹450             →│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📶 Internet           ₹799             →│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔥 Gas                ₹890             →│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Recent Activity              View all →  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🟢 Electricity Bill        ₹1,200      │ ← Activity Item 1
│    Due: 09/04/2026                      │   Status: Paid (Green)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🟡 Water Bill              ₹450        │ ← Activity Item 2
│    Due: 08/04/2026                      │   Status: Pending (Amber)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔴 Internet Bill           ₹799        │ ← Activity Item 3
│    Due: 07/04/2026                      │   Status: Overdue (Red)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│    [Pull to Refresh Indicator]          │ ← Refresh Control
│                                         │
└─────────────────────────────────────────┘
```

---

## Settings Screen Layout

```
┌─────────────────────────────────────────┐
│ ← Settings                              │ ← Header (Modal)
│                                         │   Back Button (44x44pt)
└─────────────────────────────────────────┘

┌─ APPEARANCE ─────────────────────────────┐
│                                         │
│  ◯ Light    ◯ Auto    ◯ Dark           │ ← Theme Selector
│  [Sun]     [Monitor]  [Moon]           │   3-button toggle
│                                         │   Selected: Purple highlight
│                                         │
└─────────────────────────────────────────┘

┌─ DISPLAY ────────────────────────────────┐
│                                         │
│  ☀️ Brightness                    [ON]  │ ← Toggle Settings
│  Automatic brightness adjustment        │
│                                         │
│  📝 Text Size               Default  → │ ← List Item
│                                         │
│  ⏱️  Reduce Motion                [OFF] │ ← Toggle Setting
│                                         │
└─────────────────────────────────────────┘

┌─ ABOUT ──────────────────────────────────┐
│                                         │
│  📦 App Version              1.0.0    → │
│                                         │
│  🏗️  Build                 2026.04.03  → │
│                                         │
│  🔐 Device ID              PBX-****  → │
│                                         │
└─────────────────────────────────────────┘

┌─ ACCOUNT ────────────────────────────────┐
│                                         │
│  🚪 Logout                             │ ← Red Alert Color
│     Sign out from your account          │   Destructive action
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│     PulseBox © 2026                     │ ← Footer
│     All rights reserved                 │   Centered, tertiary color
│                                         │
└─────────────────────────────────────────┘
```

---

## Design Grid System

```
┌──────────────────────────────────────────┐
│ 16px margin                              │
│   ┌──────────────────────────────────┐  │
│   │                                  │  │
│   │         Content Area             │  │
│   │         (SCREEN_WIDTH - 32px)    │  │
│   │                                  │  │
│   │    ┌──────────────────────────┐  │  │
│   │    │ Card Padding: 12-20px    │  │  │
│   │    └──────────────────────────┘  │  │
│   │                                  │  │
│   │    Gap Between Cards: 12px       │  │
│   │                                  │  │
│   └──────────────────────────────────┘  │
│ 16px margin                              │
└──────────────────────────────────────────┘
```

---

## Color Palette Reference

### Dark Mode

```
Background:     #0A0A14 (OLED optimized)
Surface:        #1A1A3E (Cards)
Primary Text:   #ECEDEE
Secondary Text: #A1A8B3
Tertiary Text:  #767D87
Border:         rgba(255, 255, 255, 0.1)
Primary Action: #7C3AED (Purple)
Success:        #22C55E (Green)
Warning:        #FBBF24 (Amber)
Error:          #EF4444 (Red)
Glow:           rgba(124, 58, 237, 0.15)
```

### Light Mode

```
Background:     #FFFFFF
Surface:        #F5F5F7 (Cards)
Primary Text:   #11181C
Secondary Text: #687076
Tertiary Text:  #8B92A2
Border:         rgba(0, 0, 0, 0.1)
Primary Action: #7C3AED (Purple)
Success:        #16A34A (Green)
Warning:        #CD5C08 (Amber)
Error:          #DC2626 (Red)
Glow:           rgba(124, 58, 237, 0.08)
```

---

## Typography Scale

```
Hero        → 40px | weight: 700 | Rarely used
Massive     → 32px | weight: 700 | Page titles
Display     → 32px | weight: 700 | Section titles
Giant       → 24px | weight: 700 | Not typically used
XL          → 18px | weight: 700 | "Good Morning, Amit"
LG          → 16px | weight: 700 | Card values, headers
MD          → 14px | weight: 600 | Standard body text
SM          → 12px | weight: 500 | Secondary info
XS          → 11px | weight: 400 | Labels, tertiary
```

---

## Component Specifications

### Dashboard Card

```
Height:       80-100px (variable)
Padding:      12px (md)
Border:       1px, theme-aware
BorderRadius: 28px (card)
Shadow:       iOS: shadowColor+offset, Android: elevation 2
Gap (h-flex): 12px (md)
Icon Size:    28-32px
Icon BG:      56x56px @ 28px radius
```

### Button / Interactive

```
Height:       44px (minimum Apple HIG)
Width:        44px (minimum Apple HIG)
Padding:      16px horizontal (lg)
Border:       1px or transparent
BorderRadius: 16px (button)
activeOpacity: 0.7 (iOS feedback)
```

### Category Row

```
Height:       56px minimum
Padding:      12px vertical (md)
Icon Badge:   44x44px @ 16px radius
Gap:          16px (lg)
Chevron:      20px, right-aligned
```

---

## Animation Timings

```
Entrance:     500ms | Easing.out(Easing.ease)
Slide:        550ms | Easing.out(Easing.cubic)
Spring:       Damping: 20, Stiffness: 320
Transition:   300ms smooth
Pulse:        1800ms loop
```

---

## Accessibility Specifications

### Touch Targets

- Minimum: 44x44pt (Apple standard)
- Settings button: 44x44pt
- Card touch areas: Full width, 60pt min height
- Category rows: Full width, 56pt height

### Colors

- Primary text contrast: 7:1 (WCAG AAA)
- Secondary text contrast: 5.5:1 (WCAG AA+)
- Color not sole indicator (icons + text)

### Text

- Scalable fonts (no hard-coded sizes)
- Line height: 1.5 minimum
- Letter spacing: Preserved for readability

---

## Responsive Breakpoints

```
Compact:        Width < 320px (iPhone SE)
Regular:        320px ≤ Width < 480px (iPhone 8)
Large:          480px ≤ Width (iPhone 12+, iPad)

For cards:
- Compact:      Full width - 32px margin
- Regular:      Full width - 32px margin
- Large:        Full width - 32px margin (responsive padding)

Grid items:
- Compact:      1 column
- Regular:      2 column (category cards)
- Large:        2-3 column (scalable)
```

---

## State Specifications

### Loading State

```
Show:  ActivityIndicator (primary color)
Size:  large (40pt)
Color: #7C3AED
```

### Empty State

```
Icon:    48pt, tertiary color
Title:   "No Bills Yet"
Subtitle: "Start by adding your first bill"
Button:  "Add Your First Bill" (CTA)
```

### Pull to Refresh

```
Color:   Primary (#7C3AED)
Height:  60pt
Timing:  400ms animation
```

---

## Dark Mode Behavior

```
Input:   User toggles theme in Settings
Output:  Instant update across app
Refresh: No page reload required
Animation: 300ms smooth transition
Saved:   Persisted in Zustand store

Colors adapted:
- Backgrounds → Darker variants
- Text → Lighter variants
- Shadows → More pronounced
- Glows → Enhanced (optional)
```

---

## Platform-Specific Notes

### iOS

- Uses `BlurView` from expo-blur (intensity: 20-40)
- Shadow system (shadowColor, shadowOffset, etc.)
- SafeAreaView for notch/home indicator
- Haptics ready with expo-haptics

### Android

- Uses elevation property (0-8)
- Different blur implementation
- Platform.select for conditional styling
- Material Design 3 compatible

### Web

- Responsive design with @media queries
- CSS-based shadows (fallback)
- Touch-friendly spacing maintained
- Browser compatibility tested

---

> **Design Spec Version**: 1.0  
> **Last Updated**: April 3, 2026  
> **Status**: Production Ready ✅
