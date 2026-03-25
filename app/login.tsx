import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  useTheme,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../src/context/AuthContext';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, signup, promptAsync, request } = useAuth();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailLogin = async () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email';

    if (!password) newErrors.password = 'Password required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = async () => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) newErrors.displayName = 'Name required';
    if (!email) newErrors.email = 'Email required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email';

    if (!password) newErrors.password = 'Password required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';

    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoggingIn(true);
    try {
      await signup(email, password, displayName);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (request) {
        await promptAsync();
      }
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* Animated Background Elements */}
          <View style={styles.blurBackground} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Sparkles size={32} color="#3B82F6" strokeWidth={1.5} />
              <Text style={styles.logoText}>PulseBox</Text>
            </View>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome to your dashboard'}
            </Text>
          </View>

          {/* Form Container */}
          <Surface style={styles.formContainer} elevation={0}>
            {/* Form Title */}
            <Text style={styles.formTitle}>
              {isSignUp ? '📝 Sign Up' : '🔐 Log In'}
            </Text>

            {isSignUp ? (
              <>
                {/* Sign Up Form */}
                <TextInput
                  label="Full Name"
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    if (errors.displayName) setErrors({ ...errors, displayName: '' });
                  }}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Mail size={18} color="#3B82F6" />} />}
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.displayName}
                />
                {errors.displayName && (
                  <HelperText type="error" style={styles.helperText}>{errors.displayName}</HelperText>
                )}

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Mail size={18} color="#3B82F6" />} />}
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.email}
                />
                {errors.email && (
                  <HelperText type="error" style={styles.helperText}>{errors.email}</HelperText>
                )}

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Lock size={18} color="#3B82F6" />} />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.password}
                />
                {errors.password && (
                  <HelperText type="error" style={styles.helperText}>{errors.password}</HelperText>
                )}

                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Lock size={18} color="#3B82F6" />} />}
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <HelperText type="error" style={styles.helperText}>{errors.confirmPassword}</HelperText>
                )}

                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  loading={isLoggingIn}
                  disabled={isLoggingIn}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  icon={() => <ArrowRight size={18} color="#fff" />}
                >
                  {isLoggingIn ? 'Creating...' : 'Sign Up'}
                </Button>

                <View style={styles.toggleSection}>
                  <Text style={styles.toggleText}>Already have an account? </Text>
                  <Button
                    onPress={() => {
                      setIsSignUp(false);
                      setErrors({});
                      setEmail('');
                      setPassword('');
                    }}
                    disabled={isLoggingIn}
                    compact
                  >
                    <Text style={styles.toggleLink}>Log In</Text>
                  </Button>
                </View>
              </>
            ) : (
              <>
                {/* Login Form */}
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Mail size={18} color="#3B82F6" />} />}
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.email}
                />
                {errors.email && (
                  <HelperText type="error" style={styles.helperText}>{errors.email}</HelperText>
                )}

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  left={<TextInput.Icon icon={() => <Lock size={18} color="#3B82F6" />} />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  outlineColor="#334155"
                  activeOutlineColor="#3B82F6"
                  textColor="#F1F5F9"
                  placeholderTextColor="#64748B"
                  error={!!errors.password}
                />
                {errors.password && (
                  <HelperText type="error" style={styles.helperText}>{errors.password}</HelperText>
                )}

                <Button
                  mode="contained"
                  onPress={handleEmailLogin}
                  loading={isLoggingIn}
                  disabled={isLoggingIn}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  icon={() => <ArrowRight size={18} color="#fff" />}
                >
                  {isLoggingIn ? 'Logging in...' : 'Log In'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleGoogleLogin}
                  disabled={isLoggingIn || !request}
                  style={styles.googleButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.googleButtonLabel}
                  icon="google"
                >
                  Continue with Google
                </Button>

                <View style={styles.toggleSection}>
                  <Text style={styles.toggleText}>Don't have an account? </Text>
                  <Button
                    onPress={() => {
                      setIsSignUp(true);
                      setErrors({});
                      setEmail('');
                      setPassword('');
                    }}
                    disabled={isLoggingIn}
                    compact
                  >
                    <Text style={styles.toggleLink}>Sign Up</Text>
                  </Button>
                </View>
              </>
            )}
          </Surface>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>� Your data is secure and encrypted</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    flexGrow: 1,
    justifyContent: 'center',
  },
  blurBackground: {
    position: 'absolute',
    width: width,
    height: 300,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 150,
    top: -100,
    left: -50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  helperText: {
    marginBottom: 12,
    fontSize: 12,
  },
  button: {
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
    flexDirection: 'row-reverse',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  googleButton: {
    borderColor: '#475569',
    borderWidth: 1.5,
    borderRadius: 12,
  },
  googleButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  toggleLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
});