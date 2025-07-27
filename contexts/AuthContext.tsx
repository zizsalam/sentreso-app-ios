import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, AuthState } from '../services/supabaseClient';
import { Alert } from 'react-native';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.phone);
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in with phone:', phone);
      setState(prev => ({ ...prev, loading: true }));

      // For now, we'll use email field with phone number
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${phone}@sentreso.local`, // Temporary workaround
        password,
      });

      console.log('🔐 Sign in response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('❌ Sign in error details:', error);
        let errorMessage = error.message;

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Numéro de téléphone ou mot de passe incorrect.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Aucun compte trouvé avec ce numéro. Créez un compte d\'abord.';
        }

        Alert.alert('Erreur de connexion', errorMessage);
        throw error;
      }

      console.log('✅ Sign in successful!');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('�� Attempting sign up with email:', email);
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            // phone: phone, // Optionally save phone to user profile
          }
        }
      });

      console.log('🔐 Sign up response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('❌ Sign up error details:', error);
        Alert.alert('Erreur d\'inscription', error.message);
        throw error;
      } else {
        console.log('✅ Sign up successful!');
          Alert.alert(
            'Inscription réussie',
            'Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.'
          );
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      console.log('📱 Attempting phone sign in:', phone);
      setState(prev => ({ ...prev, loading: true }));

      // For now, we'll use a simple approach
      // In production, you'd integrate with SMS service
      Alert.alert(
        'Connexion par téléphone',
        'Fonctionnalité en développement. Utilisez la connexion par mot de passe pour l\'instant.'
      );

    } catch (error) {
      console.error('❌ Phone sign in error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      console.log('🔢 Verifying OTP for phone:', phone);
      setState(prev => ({ ...prev, loading: true }));

      // For now, we'll use a simple approach
      Alert.alert(
        'Vérification OTP',
        'Fonctionnalité en développement. Utilisez la connexion par mot de passe pour l\'instant.'
      );

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Erreur de déconnexion', error.message);
        throw error;
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (phone: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.resetPasswordForEmail(`${phone}@sentreso.local`, {
        redirectTo: 'sentreso://reset-password',
      });

      if (error) {
        Alert.alert('Erreur de réinitialisation', error.message);
        throw error;
      } else {
        Alert.alert(
          'SMS envoyé',
          'Vérifiez votre téléphone pour réinitialiser votre mot de passe.'
        );
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithPhone,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
