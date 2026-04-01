import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// LinearGradient temporarily disabled for Expo Go compatibility
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../src/context/AuthContext';
import { Colors, getColorScheme } from '../theme/color';
import { Spacing, BorderRadius, Elevation, Typography } from '../constants/designTokens';
import { Mail, Lock, ArrowRight, Eye, EyeOff, User, Fingerprint, Shield } from 'lucide-react-native';
import { biometricAuth } from '../src/services/BiometricAuth';
import { logger } from '../src/services/Logger';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFaceIDLoading, setIsFaceIDLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formScaleAnim = useRef(new Animated.Value(0.95)).current;

  const theme = getColorScheme(Colors.textPrimary === '#1C1C1E' ? false : true);
  const isDark = Colors.background === '#000000';

  // Entry animations on mount
  useEffect(() => {
    const animations = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.spring(formScaleAnim, {
        toValue: 1,
        damping: 25,
        stiffness: 280,
        delay: 200,
        useNativeDriver: true,
      }),
    ]);
    animations.start();
  }, []);

  // Check if biometric auth is available and enrolled
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'touch' | 'none'>('none');
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);

  useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    try {
      const available = await biometricAuth.isAvailable();
      if (available) {
        const type = await biometricAuth.getBiometricType();
        setBiometricType(type);
        setIsBiometricAvailable(true);

        const enrolled = await biometricAuth.isEnrolled();
        setIsBiometricEnrolled(enrolled);
      }
    } catch (error) {
      console.log('Biometric initialization failed:', error);
    }
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email/password login
  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});

    // Validate
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Shake animation for error
      shakeForm();
      return;
    }

    setIsLoggingIn(true);
    logger.info('Login form submitted', { email });

    try {
      await login(email, password);
      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logger.info('Login successful (from UI)');

      // Prompt to enable biometric if available and not enrolled
      if (isBiometricAvailable && !isBiometricEnrolled) {
        setTimeout(() => {
          promptEnableBiometric(email, password);
        }, 1000);
      }
    } catch (error: any) {
      logger.error('Login error from UI:', error as Error, { email });
      setErrors({
        general: error.message || 'Login failed. Please check your credentials.'
      });
      shakeForm();
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Prompt to enable biometric authentication
  const promptEnableBiometric = async (email: string, password: string) => {
    Alert.alert(
      'Enable Biometric Login',
      'For faster and more secure access, would you like to enable Face ID / Touch ID for future logins?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            const success = await biometricAuth.enrollCredentials(email, password);
            if (success) {
              setIsBiometricEnrolled(true);
              Alert.alert('Success!', 'Biometric login has been enabled.');
            }
          },
        },
      ]
    );
  };

  // Handle Face ID / Touch ID login
  const handleBiometricLogin = async () => {
    try {
      setIsFaceIDLoading(true);
      logger.info('Biometric login button pressed');

      // If not enrolled, trigger enrollment after email login
      if (!isBiometricEnrolled) {
        logger.warn('Biometric login attempted but not enrolled');
        Alert.alert(
          'Biometric Not Set Up',
          'Please log in with your email and password first, then enable Biometric Login in the app.',
          [{ text: 'OK' }]
        );
        setIsFaceIDLoading(false);
        return;
      }

      // Authenticate and get stored credentials
      const credentials = await biometricAuth.authenticateAndLogin();

      if (credentials) {
        logger.info('Biometric authentication succeeded, attempting login');
        // Attempt login with stored credentials
        await login(credentials.email, credentials.password);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        logger.info('Biometric login successful');
      } else {
        logger.warn('Biometric authentication returned no credentials');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Failed', 'Biometric authentication failed or credentials not found.');
      }
    } catch (error) {
      logger.error('Biometric login error:', error as Error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    } finally {
      setIsFaceIDLoading(false);
    }
  };

  // Shake animation for errors
  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Input focus animations
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  const getBorderColor = (anim: Animated.Value, isFocused: boolean) => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isDark ? Colors.borderDark : Colors.border,
        Colors.primary
      ],
    });
  };

  const getBorderWidth = (anim: Animated.Value) => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    });
  };

  return (
    <View
      style={[
        styles.gradient,
        {
          backgroundColor: isDark ? '#0A0A0A' : '#F2F2F7',
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animated Logo Section */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: logoScaleAnim },
                    { translateY: slideAnim }
                  ]
                }
              ]}
            >
              <View style={styles.logoIconContainer}>
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
              <Text style={[styles.logoText, { color: theme.textPrimary }]}>
                PulseBox
              </Text>
              <Text style={[styles.tagline, { color: theme.textSecondary }]}>
                Your Life, Organized
              </Text>
            </Animated.View>

            {/* Form Container with Glassmorphism */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: formScaleAnim }
                  ],
                },
              ]}
            >
              <BlurView
                intensity={isDark ? 60 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
              >
                <View style={[styles.formInner, { backgroundColor: isDark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.7)' }]}>

                  {/* Form Title */}
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                    Welcome Back
                  </Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Sign in to your account
                  </Text>

                  {/* Error Banner */}
                  {errors.general && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{errors.general}</Text>
                    </View>
                  )}

                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <Animated.View
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: getBorderColor(emailBorderAnim, emailFocused),
                          borderWidth: getBorderWidth(emailBorderAnim),
                          backgroundColor: isDark
                            ? 'rgba(44,44,46,0.6)'
                            : 'rgba(243,243,245,0.6)',
                        },
                      ]}
                    >
                      <View style={styles.inputIconContainer}>
                        <Mail size={20} color={emailFocused ? Colors.primary : Colors.textSecondary} />
                      </View>
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="Email"
                        placeholderTextColor={isDark ? Colors.textTertiaryDark : Colors.textTertiary}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        editable={!isLoggingIn}
                      />
                      {email.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setEmail('')}
                          style={styles.clearButton}
                        >
                          <Text style={[styles.clearButtonText, { color: theme.textTertiary }]}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <Animated.View
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: getBorderColor(passwordBorderAnim, passwordFocused),
                          borderWidth: getBorderWidth(passwordBorderAnim),
                          backgroundColor: isDark
                            ? 'rgba(44,44,46,0.6)'
                            : 'rgba(243,243,245,0.6)',
                        },
                      ]}
                    >
                      <View style={styles.inputIconContainer}>
                        <Lock size={20} color={passwordFocused ? Colors.primary : Colors.textSecondary} />
                      </View>
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="Password"
                        placeholderTextColor={isDark ? Colors.textTertiaryDark : Colors.textTertiary}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!isLoggingIn}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={theme.textSecondary} />
                        ) : (
                          <Eye size={20} color={theme.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity style={styles.forgotPasswordButton}>
                    <Text style={[styles.forgotPasswordText, { color: Colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      {
                        backgroundColor: Colors.primary,
                        opacity: isLoggingIn ? 0.7 : 1,
                      },
                      isLoggingIn && styles.loginButtonDisabled
                    ]}
                    onPress={handleLogin}
                    disabled={isLoggingIn}
                    activeOpacity={0.8}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.divider, { backgroundColor: isDark ? Colors.borderDark : Colors.border }]} />
                    <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
                    <View style={[styles.divider, { backgroundColor: isDark ? Colors.borderDark : Colors.border }]} />
                  </View>

                  {/* Biometric Login Button */}
                  {isBiometricAvailable && (
                    <TouchableOpacity
                      style={[
                        styles.biometricButton,
                        {
                          borderColor: isDark ? Colors.borderDark : Colors.border,
                          backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : 'rgba(243,243,245,0.6)',
                        },
                        isFaceIDLoading && styles.biometricButtonDisabled
                      ]}
                      onPress={handleBiometricLogin}
                      disabled={isFaceIDLoading || isLoggingIn}
                      activeOpacity={0.7}
                    >
                      {isFaceIDLoading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <>
                          {biometricType === 'face' ? (
                            <User size={24} color={Colors.primary} />
                          ) : (
                            <Fingerprint size={24} color={Colors.primary} />
                          )}
                          <Text style={[styles.biometricButtonText, { color: theme.textPrimary }]}>
                            Continue with {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Sign Up Link */}
                  <View style={styles.signupContainer}>
                    <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                      Don't have an account?
                    </Text>
                    <TouchableOpacity>
                      <Text style={[styles.signupLink, { color: Colors.primary }]}>
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </BlurView>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={[styles.footerText, { color: theme.textTertiary }]}>
                By signing in, you agree to our Terms of Service
              </Text>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
  },
  logoIcon: {
    fontSize: 40,
  },
  logoText: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  blurContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  formInner: {
    padding: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: Elevation.md.elevation,
      },
    }),
  },
  formTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: Colors.errorContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    height: 56,
    paddingHorizontal: Spacing.md,
  },
  inputIconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  biometricButtonDisabled: {
    opacity: 0.5,
  },
  biometricButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  signupText: {
    fontSize: Typography.fontSize.md,
  },
  signupLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginLeft: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
