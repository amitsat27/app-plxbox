# 🔐 Biometric Authentication - Complete Setup Guide

## ✅ Current Configuration

### 1. App Permissions (`app.json`)
```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "Allow Pulsebox to use Face ID for biometric login.",
      "NSBiometricUsageDescription": "Allow Touch ID / Face ID for biometric login"
    }
  },
  "android": {
    "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"]
  },
  "plugins": [
    [
      "expo-local-authentication",
      {
        "faceIDPermission": "Allow Pulsebox to use Face ID for biometric login.",
        "fallbackLabel": "Use Password"
      }
    ],
    "expo-secure-store"
  ]
}
```

### 2. Native Configuration Files
- `ios/Pulsebox/Info.plist` - iOS permissions
- `ios/Pulsebox/Pulsebox.entitlements` - Biometric capability
- `eas.json` - Build profiles with config injection

### 3. Splash Screen Protection
- Biometric auto-login has **3-second timeout**
- **Only attempts if:**
  - Device has biometric hardware
  - User has previously enrolled credentials
  - Not already logged in
- **Fails safely** - user can always manually login

---

## 🚀 Deployment Scenarios

### **Scenario 1: Expo Go (Development)**

**Status:** ✅ Should work automatically

**Steps:**
1. Install Expo Go on your iPhone
2. Scan QR code with `npx expo start`
3. App loads in Expo Go
4. Biometric auth works because Expo Go includes the native modules

**Note:** SecureStore in Expo Go stores data in Expo's sandbox. When you build standalone, credentials won't transfer automatically (by design for security).

---

### **Scenario 2: Standalone Build (TestFlight / sideloaded)**

**Status:** ✅ Ready to build

**Build Command (Local):**
```bash
# Prebuild iOS native project
npx expo prebuild --platform ios --clean

# Build with EAS (recommended)
npx eas build --platform ios --profile preview

# Or build locally
npx expo run:ios --configuration Release
```

**What gets included:**
- ✅ Face ID / Touch ID permissions in `Info.plist`
- ✅ Biometric entitlement in `Pulsebox.entitlements`
- ✅ `expo-local-authentication` native module linked
- ✅ `expo-secure-store` for credential storage

**After Install:**
1. Open the standalone app
2. Login with email/password **first time**
3. You'll see a prompt: *"Enable Biometric Login?"*
4. Tap **Enable** → authenticate with Face ID/Touch ID
5. Credentials saved securely in Keychain
6. **Next launch:** Auto-login with biometric!

---

### **Scenario 3: GitHub Actions CI/CD**

**Status:** ✅ Workflow updated

The `.github/workflows/ios-build.yml` now:
- Uses `--clean` flag on prebuild
- Updates CocoaPods repo
- Builds unsigned archive for SideStore

**Important:** CI/CD environments **don't have biometric hardware**, so:
- Auto-biometric will be skipped (hardware check fails)
- Splash screen timeout prevents hanging
- Build succeeds and creates IPA

---

## 🐛 Troubleshooting

### **Issue:** "App stuck at splash screen"

**Causes:**
1. Biometric authentication hanging without timeout
2. No biometric hardware but `isAvailable()` returning false incorrectly
3. Infinite loop in splash hide logic

**Fixes applied:**
- ✅ 3-second timeout on biometric auth
- ✅ Hardware availability check before attempting
- ✅ Enrollment check before authentication
- ✅ All errors caught and logged
- ✅ `biometricLoading` always reset in `finally` block

**Check logs:**
```
🔐 Biometric not available on this device
🔐 Biometric not enrolled - skipping auto-login
🔐 Biometric auth failed/timeout: ...
```

### **Issue:** "Biometric works in Expo Go but not standalone"

**Checklist:**
- [ ] Did you run `npx expo prebuild --platform ios --clean`?
- [ ] Did `pod install` complete successfully in `ios/` folder?
- [ ] Does `Info.plist` contain `NSFaceIDUsageDescription`?
- [ ] Does `Pulsebox.entitlements` contain biometric capability?
- [ ] Are you testing on a real device (Face ID/Touch ID hardware required)?
- [ ] Did you enroll biometric credentials **after installing standalone**? (Expo Go credentials don't transfer)

**To rebuild:**
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
npx eas build --platform ios --profile preview
```

---

## 📱 Testing Checklist

### **First Launch (No Enrolled Credentials)**
- [ ] App loads to login screen
- [ ] Splash screen hides after ~2 seconds
- [ ] No biometric prompt appears automatically
- [ ] User logs in with email/password
- [ ] After login, **enrollment prompt appears** (checkmark for "Enable Biometric")
- [ ] User can enable or skip

### **Second Launch (Credentials Enrolled)**
- [ ] App shows splash screen
- [ ] After ~1 second, **Face ID/Touch ID dialog appears**
- [ ] Authentication succeeds → redirected to home
- [ ] Authentication fails/cancel → stays on login screen

### **Expo Go Testing**
- [ ] Install Expo Go from App Store
- [ ] Scan QR with `npx expo start`
- [ ] Login with email/password
- [ ] Enable biometric in-app
- [ ] Close and reopen Expo Go (keep project running)
- [ ] Biometric auto-login should trigger

---

## 🔐 Security Notes

1. **Credentials Storage:** Stored in iOS Keychain via `expo-secure-store`
2. **Biometric Only:** Credentials can only be accessed after successful biometric auth
3. **No Offline Bypass:** Even if device is jailbroken, credentials remain encrypted
4. **Clear on Logout:** `removeCredentials()` called on logout
5. **Standalone Isolation:** Each standalone build has separate keychain access group

---

## 📊 Architecture Flow

```
App Launch
    ↓
Splash Screen (shows)
    ↓
Firebase Init (async)
    ↓
Auth State Check
    ↓
Is user logged in? → NO → Show Login (hide splash)
    ↓ YES
Biometric Available? → NO → Go to Home (hide splash)
    ↓ YES
Biometric Enrolled? → NO → Go to Home (hide splash)
    ↓ YES
Attempt Biometric Auth (3s timeout)
    ↓
Success? → YES → Auto-login → Home
    ↓ NO
Show Login Screen (hide splash)
```

**Splash hides when:** `appIsReady && !loading && !biometricLoading`

---

## 🎯 Next Steps for Production

1. **Remove debug logging** (`console.log` with emoji prefixes)
2. **Add analytics** to track biometric enrollment & success rates
3. **Implement biometric settings screen** to let users disable/enroll
4. **Add Face ID/Touch ID icon** in UI where relevant
5. **Test on physical devices** (simulators don't support biometrics)
6. **Test with multiple users** (different biometric enrollment states)

---

## 📚 References

- [Expo Local Authentication Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Secure Store Docs](https://docs.expo.dev/versions/latest/sdk/secure-store/)
- [Apple Face ID Guidelines](https://developer.apple.com/design/human-interface-guidelines/face-id)
- [EAS Build Configuration](https://docs.expo.dev/build-reference/eas-json/)

---

**Status:** ✅ Configuration complete for both Expo Go and standalone builds
