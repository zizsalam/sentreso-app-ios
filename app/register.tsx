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
import { useAuthManager } from '@/contexts/AuthManager';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const { signUp } = useAuthManager();
  const [otp, setOtp] = useState('');
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);

  const validateEmail = (value: string) => /.+@.+\..+/.test(value.trim());
  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  const emailValid = email.length === 0 || validateEmail(email);
  const phoneValid = phone.length === 0 || validatePhone(phone);
  const hasValidEmail = email.length > 0 && emailValid;

  const emailError = email.length > 0 && !emailValid ? 'Adresse e-mail invalide' : '';
  const phoneError = phone.length > 0 && !phoneValid ? 'Numéro de téléphone invalide' : '';
  const emailRequiredError = !hasValidEmail ? 'Adresse e-mail requise' : '';
  const passError = password.length > 0 && password.length < 6 ? 'Mot de passe requis (6 caractères minimum)' : '';
  const passMatchError = password2.length > 0 && password2 !== password ? 'Les mots de passe ne correspondent pas' : '';

  const onSubmit = async () => {
    setAuthError(null);

    // Require email for registration (stable approach)
    if (!email.trim()) {
      emailRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      passRef.current?.focus();
      return;
    }
    if (password2 !== password) {
      pass2Ref.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, name);
      Alert.alert('Inscription réussie', 'Veuillez vous connecter avec votre adresse e-mail.');
      router.replace('/login');
    } catch (e) {
      setAuthError('Erreur inattendue. Réessayez.');
    } finally {
      setSubmitting(false);
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
            <Text style={styles.title}>Inscription</Text>
          </View>

          {authError ? (
            <View style={styles.errorBanner} accessible accessibilityLabel="Erreur d'inscription">
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Nom (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              accessible
              accessibilityLabel="Nom"
            />

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
              onSubmitEditing={() => phoneRef.current?.focus()}
              accessible
              accessibilityLabel="Adresse e-mail"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

            <Text style={styles.label}>Téléphone (optionnel)</Text>
        <TextInput
          ref={phoneRef}
          style={[styles.input, phoneError ? styles.inputError : null]}
          placeholder="ex: 771234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          accessible
          accessibilityLabel="Téléphone"
          editable={!showOTP}
        />

            {emailRequiredError ? <Text style={styles.fieldError}>{emailRequiredError}</Text> : null}
            {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}

            <Text style={styles.label}>Mot de passe (minimum 6 caractères)</Text>
            <TextInput
              ref={passRef}
              style={[styles.input, passError ? styles.inputError : null]}
              placeholder="Choisissez un mot de passe sécurisé"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => pass2Ref.current?.focus()}
              accessible
              accessibilityLabel="Mot de passe"
            />
            {passError ? <Text style={styles.fieldError}>{passError}</Text> : null}

            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              ref={pass2Ref}
              style={[styles.input, passMatchError ? styles.inputError : null]}
              placeholder="Confirmez votre mot de passe"
              value={password2}
              onChangeText={setPassword2}
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              accessible
              accessibilityLabel="Confirmer le mot de passe"
            />
            {passMatchError ? <Text style={styles.fieldError}>{passMatchError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={submitting}
              accessibilityLabel="S'inscrire"
              accessible
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <Text style={{ color: '#6B7280', marginRight: 6 }}>Déjà un compte ?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')} accessibilityLabel="Aller à la connexion" accessible>
                <Text style={styles.linkText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 84, height: 84, borderRadius: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  form: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827', backgroundColor: '#FFFFFF', marginBottom: 12 },
  inputError: { borderColor: '#EF4444' },
  fieldError: { color: '#EF4444', fontSize: 12, marginBottom: 8 },
  primaryButton: { backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linksRow: { marginTop: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  errorBanner: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 },
  errorBannerText: { color: '#B91C1C', fontSize: 13, textAlign: 'center' },
  helperText: { color: '#6B7280', fontSize: 12, marginTop: 4, marginBottom: 8 },
});
