import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
// @ts-ignore
import logo from '../assets/images/icon.png';
import { supabase } from '@/services/supabaseClient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const validateEmail = (value: string) => /.+@.+\..+/.test(value.trim());
  const emailError = email.length > 0 && !validateEmail(email) ? 'Adresse e-mail invalide' : '';
  const passwordError = password.length > 0 && password.length < 8 ? 'Mot de passe requis (8 caractères minimum)' : '';

  const handleSubmit = async () => {
    setAuthError(null);
    if (!validateEmail(email)) {
      emailRef.current?.focus();
      return;
    }
    if (password.length < 8) {
      passRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.message?.toLowerCase().includes('network')) {
          setAuthError('Connexion impossible. Vérifiez votre connexion internet.');
        } else {
          setAuthError('Identifiants incorrects. Vérifiez votre e-mail et mot de passe.');
        }
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const role = (userData?.user?.user_metadata as any)?.role;

      // Role-aware routing within current nav
      if (role === 'distributor') {
        // Use analytics as the distributor dashboard for now
        router.replace('/(tabs)/analytics');
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      setAuthError('Connexion impossible. Vérifiez votre connexion internet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Adresse e-mail invalide');
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'sentreso://reset-password',
      });
      Alert.alert('E-mail de réinitialisation envoyé.');
      setShowReset(false);
    } catch (e) {
      Alert.alert('Impossible d\'envoyer l\'e-mail. Réessayez.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Connexion</Text>
          </View>

          {authError ? (
            <View style={styles.errorBanner} accessible accessibilityLabel="Erreur d'authentification">
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="ex: marchand@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              accessible
              accessibilityLabel="Adresse e-mail"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              ref={passRef}
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              accessible
              accessibilityLabel="Mot de passe"
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityLabel="Se connecter"
              accessible
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => setShowReset(true)} accessibilityLabel="Mot de passe oublié ?" accessible>
                <Text style={styles.linkText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showReset && (
            <View style={styles.resetCard}>
              <Text style={styles.resetTitle}>Réinitialiser le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre adresse e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.resetActions}>
                <TouchableOpacity style={[styles.secondaryButton]} onPress={() => setShowReset(false)}>
                  <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
                  <Text style={styles.primaryButtonText}>Envoyer le lien</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linksRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  resetCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  resetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
});
