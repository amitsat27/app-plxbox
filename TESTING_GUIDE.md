# 🧪 Testing Guide - Cosmic Sunset Design Refresh

## Prerequisites
```bash
# Ensure you have the required dependencies
npm install

# Clear Metro cache before testing
npx expo start -c
```

## Build & Run Commands

### For iOS Simulator (macOS only):
```bash
npx expo run:ios
```

### For Android Emulator:
```bash
npx expo run:android
```

### For Expo Go (Web/Android - limited native module support):
```bash
npx expo start
# Then scan QR code with Expo Go app
```

**Note:** Some blur/gradient effects work best in standalone builds. Expo Go may show simpler fallbacks.

---

## ✅ Visual Checklist

### 1. Welcome Greeting (Top of Home)
- [ ] **Greeting Text:** "Good Morning/Afternoon/Evening **Amit**" displays prominently
- [ ] **Hard-coded:** Shows "Amit" regardless of which login method used (email, PIN, Face ID)
- [ ] **Typography:** Very large bold text (42pt) with high contrast
- [ ] **Glass Effect:** Card has frosted glass appearance with blur
- [ ] **Avatar:** User photo/avatar appears (or initial "A" placeholder)
- [ ] **Dark Mode:** Greeting clearly visible on dark background

### 2. Metric Cards (2×2 Grid)
- [ ] **Glassmorphism:** Cards have translucent frosted glass look
- [ ] **Gradient Borders:** Colored glow effect around each card (violet/blue/pink)
- [ ] **Icons:** Pulse animation on icons (gentle floating)
- [ ] **Values:** Large numbers with subtle glow, easy to read
- [ ] **Trend Indicators:** Green (↑) for positive, red (↓) for negative
- [ ] **Press Feedback:** Card scales down slightly when tapped

### 3. Bill Category Cards (Grid Layout)
- [ ] **Pill Shape:** Fully rounded corners (circular/oval)
- [ ] **Vibrant Gradients:** Each category has unique gradient (orange→yellow, blue→cyan, etc.)
- [ ] **Glowing Icons:** Large icons with colored glow behind them
- [ ] **Animated Counter:** Amount counts up from 0 when card appears
- [ ] **Progress Bar:** Shows percentage of total (if totalAmount provided)
- [ ] **Status Badge:** "Paid/Pending/Overdue" in colored pills
- [ ] **Floating Effect:** Cards appear to float off the page

### 4. Navbar (Top Floating Bar)
- [ ] **Floating Design:** Navbar sits with space below it (not flush with top)
- [ ] **Glass Blur:** Heavy blur effect (frosted glass)
- [ ] **Gradient Accent:** Animated wave line at bottom (moves slowly)
- [ ] **App Title:** "Pulsebox" with gradient underline
- [ ] **Icon Buttons:** Search, notifications, profile in glass containers (44×44)
- [ ] **Notification Badge:** Red dot with pulse animation if count > 0
- [ ] **User Avatar:** Glowing border around avatar image/placeholder
- [ ] **Profile Menu:** Dropdown works with Profile/Logout options

### 5. Overall Theme Consistency
- [ ] **Cosmic Colors:** Purple/violet/blue/pink palette throughout
- [ ] **Background:** Deep cosmic blue-black (not pure black) in dark mode
- [ ] **Light Mode:** Off-white surfaces with subtle purple tint
- [ ] **Glows:** Violet tinted shadows on most cards
- [ ] **Spacing:** Generous padding and margins (premium feel)

### 6. Dark Mode Switching
- [ ] **Toggle:** If you have a theme toggle, switching updates all colors
- [ ] **Contrast:** All text remains readable (≥ 4.5:1 ratio)
- [ ] **Glass Intensity:** Dark mode glass is slightly more opaque
- [ ] **Glows:** Glow effects more pronounced in dark mode

### 7. Animations Performance
- [ ] **Smooth Entrance:** Sections stagger in one after another
- [ ] **60 FPS:** No dropped frames on device (check Flipper/DevTools)
- [ ] **Responsive:** Pinch-to-zoom doesn't break layout
- [ ] **Scroll Smooth:** Scrolling through dashboard is fluid

### 8. Functionality (Regression)
- [ ] **Real-time Updates:** Bills/metrics update in real-time from Firestore
- [ ] **Pull-to-Refresh:** Pull down on dashboard to refresh data
- [ ] **Navigation:** Tab switching works (Dashboard, Explore, etc.)
- [ ] **Login/Logout:** Different login methods all show "Amit" greeting
- [ ] **Empty States:** Friendly message appears when no data exists

---

## 🐛 Known Issues & Workarounds

### Gradients on Native (Expo Go)
- **Issue:** React Native doesn't support gradient text natively yet
- **Current:** Greeting name "Amit" shows as solid violet color with glow
- **In Standalone:** After EAS build, can use `react-native-linear-gradient` for true gradient text

### Font Loading
- **Current:** Using system fonts (iOS: SF Pro, Android: Roboto)
- **To Enhance:** Install Space Grotesk + Inter for more distinctive look (see OPTIONAL ENHANCEMENTS)

### Chart Modernization
- **Pending:** LineChart and DonutChart still use old color scheme
- **Next Step:** Update charts with cosmic gradients and area fills

---

## 🎯 Quick Test Commands

### 1. TypeScript Check
```bash
npx tsc --noEmit
```
Should show **0 errors**.

### 2. Lint Check
```bash
npm run lint
```
Should show **0 warnings** (or suppressed).

### 3. Clear Cache & Restart
If you see weird bundling errors:
```bash
# Kill Metro
# Delete cache:
rm -rf .expo web-cache node_modules/.cache
# Restart:
npx expo start -c
```

---

## 📱 Device Testing Recommendations

1. **Physical iOS Device** (via SideStore):
   - Build standalone IPA: `eas build --platform ios`
   - Test all animations at 60fps
   - Verify blur effects work correctly

2. **Android Emulator:**
   - Test dark/light mode switching
   - Check touch target sizes (≥44pt)

3. **Web Browser:**
   - Resize window to test responsive breakpoints
   - Check if gradient text renders (web supports this)

---

## ✨ What Should Look Different

### Before (iOS 18 Conservative)
```
┌─────────────────────┐
│ Good Morning        │
│ User                │
├─────────────────────┤
│ [Plain white card]  │
│Electric: ₹2,450     │
└─────────────────────┘
```

### After (Cosmic Sunset 2025)
```
╔═══════════════════════════════════╗
║                                   ║
║  Good Morning,                   ║
║  AMIT                            ║ ← Large, prominent
║  Here's your overview           ║
║                                   ║
╚═══════════════════════════════════╡
        [ Floating Glass Card ]
╔═══════════════════════════════╗
║ ⚡ Electric           ₹2,450  ║ ← Glowing text
║ ↑ 5.2% from last month        ║
╠═══════════════════════════════╣
║  [ Orange gradient line ]     ║
╚═══════════════════════════════╝
```

---

## 🔄 Rollback Instructions

If you need to revert to the previous design:

```bash
# Reset to last commit
git checkout HEAD

# Or if changes are not committed:
git restore theme/color.ts constants/designTokens.ts
git restore components/ui/home/WelcomeSection.tsx
git restore components/ui/cards/MetricCard.tsx
git restore components/ui/cards/BillCategoryCard.tsx
git restore components/ui/Navbar.tsx
git restore app/_layout.tsx
git restore components/ui/RedesignedHome.tsx
```

---

## 🚀 Next Steps After Testing

1. **If everything looks good:** Continue with chart modernizations
2. **If contrast issues:** Adjust color values in `theme/color.ts` `on*` colors
3. **If animations are choppy:** Consider reducing blur intensity or shadow radius
4. **If fonts look generic:** Add Space Grotesk + Inter fonts (see OPTIONAL)

---

**Happy Testing!** 🎨✨

Report any issues with screenshots if possible.
