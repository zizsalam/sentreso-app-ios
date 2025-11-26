import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
// @ts-ignore
import logo from '../assets/images/icon.png';
import { supabase } from '@/services/supabaseClient';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse e-mail');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }

      Alert.alert(
        'E-mail envoyé',
        'Un lien de réinitialisation a été envoyé à votre adresse e-mail. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour continuer.',
        [
          {
            text: 'OK',
            onPress: () => setStep('password')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'e-mail. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);
    try {
      // Simple approach: try to update password directly
      // This will work if the user has a valid session
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        Alert.alert(
          'Erreur',
          'Impossible de mettre à jour le mot de passe. Veuillez vous connecter avec votre mot de passe actuel, puis changer votre mot de passe dans les paramètres.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
        return;
      }

      Alert.alert(
        'Succès',
        'Votre mot de passe a été mis à jour avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setSubmitting(false);
    }
  };

  // Email step
  if (step === 'email') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse e-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Votre adresse e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                onPress={handleEmailSubmit}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? 'Envoi...' : 'Envoyer le lien'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
                <Text style={styles.secondaryButtonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>Cliquez sur le lien dans votre e-mail, puis entrez votre nouveau mot de passe</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="next"
              accessible
              accessibilityLabel="Nouveau mot de passe"
            />

            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre nouveau mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleResetPassword}
              accessible
              accessibilityLabel="Confirmer le mot de passe"
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={submitting}
              accessibilityLabel="Mettre à jour le mot de passe"
              accessible
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Mettre à jour</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => router.replace('/login')} accessibilityLabel="Retour à la connexion" accessible>
                <Text style={styles.linkText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
});
