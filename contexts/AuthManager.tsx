import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { router } from 'expo-router';

interface AuthState {
  user: any;
  session: any;
  loading: boolean;
}

interface AuthManagerContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  attemptSessionRecovery: () => Promise<void>;
}

const AuthManagerContext = createContext<AuthManagerContextType | undefined>(undefined);

export function AuthManagerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const [isUserInitiatedLogout, setIsUserInitiatedLogout] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Give AsyncStorage a moment to rehydrate before checking session state
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log('🔐 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Initial session error:', error);
          return;
        }

        console.log('🔐 Initial session result:', { hasSession: !!session, userId: session?.user?.id });

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session,
            loading: false,
          });

          // Navigate based on session
          if (session) {
            console.log('🔐 Valid session found, navigating to tabs');
            router.replace('/(tabs)');
          } else {
            console.log('🔐 No session found, navigating to login');
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('❌ Initial session error:', error);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false }));
          router.replace('/login');
        }
      }
    };

    getInitialSession();

    // Enhanced session recovery function with retry logic
    const attemptSessionRecovery = async (retryCount = 0) => {
      const maxRetries = 5; // Increased retries for better persistence
      const retryDelay = 2000; // 2 seconds between retries

      try {
        console.log(`🔐 Attempting session recovery (attempt ${retryCount + 1}/${maxRetries + 1})...`);

        // First try: get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('🔐 Session recovery failed:', error.message);

          // Wait before retry
          if (retryCount < maxRetries) {
            console.log(`🔐 Retrying in ${retryDelay}ms...`);
            setTimeout(() => attemptSessionRecovery(retryCount + 1), retryDelay);
            return;
          }

          // Try to refresh the session
          console.log('🔐 Attempting session refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.log('🔐 Session refresh failed:', refreshError.message);

            // Only navigate to login if this is the final attempt
            if (retryCount >= maxRetries) {
              console.log('🔐 All recovery attempts failed, navigating to login');
              router.replace('/login');
            } else {
              // Retry with delay
              setTimeout(() => attemptSessionRecovery(retryCount + 1), retryDelay);
            }
          } else if (refreshData.session) {
            console.log('🔐 Session recovered via refresh');
            setState({
              user: refreshData.session.user,
              session: refreshData.session,
              loading: false,
            });
            // Session recovered, stay logged in - no navigation needed
            return;
          }
        } else if (session) {
          console.log('🔐 Session recovered via getSession');
          setState({
            user: session.user,
            session: session,
            loading: false,
          });
          // Session recovered, stay logged in - no navigation needed
          return;
        } else {
          console.log('🔐 No session found during recovery');

          // Only navigate to login if this is the final attempt
          // Be more lenient - only logout if absolutely necessary
          if (retryCount >= maxRetries) {
            console.log('🔐 All recovery attempts failed after multiple retries, navigating to login');
            router.replace('/login');
          } else {
            // Retry with delay - be persistent in recovery
            console.log(`🔐 Retrying session recovery (${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => attemptSessionRecovery(retryCount + 1), retryDelay);
          }
        }
      } catch (error) {
        console.error('🔐 Session recovery error:', error);

        // Only navigate to login if this is the final attempt
        if (retryCount >= maxRetries) {
          router.replace('/login');
        } else {
          // Retry with delay
          setTimeout(() => attemptSessionRecovery(retryCount + 1), retryDelay);
        }
      }
    };

    // Single auth state listener - this is the ONLY one in the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        if (!mounted) return;

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        // Handle navigation based on event
        switch (event) {
          case 'SIGNED_IN':
            console.log('🔐 User signed in, navigating to tabs');
            setIsUserInitiatedLogout(false);
            router.replace('/(tabs)');
            break;
          case 'SIGNED_OUT':
            console.log('🔐 User signed out event received');
            if (isUserInitiatedLogout) {
              console.log('🔐 User-initiated logout, navigating to login');
              router.replace('/login');
            } else {
              console.log('🔐 Automatic session loss detected, attempting recovery...');
              // Always attempt recovery for automatic session loss
              // This improves UX by keeping users logged in
              attemptSessionRecovery();
            }
            break;
          case 'TOKEN_REFRESHED':
            console.log('🔐 Token refreshed successfully, maintaining session');
            setIsUserInitiatedLogout(false);
            if (!session?.access_token) {
              console.warn('⚠️ Missing access token after token refresh, forcing re-login');
              router.replace('/login');
              break;
            }
            // Update session state to ensure user stays logged in
            setState(prev => ({
              ...prev,
              session,
              user: session?.user ?? null,
              loading: false,
            }));
            // Stay on current page, just update session - no navigation needed
            break;
          default:
            console.log('🔐 Auth event:', event);
            // Handle other events if needed
            break;
        }
      }
    );

    return () => {
      console.log('🔐 AuthManager cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isUserInitiatedLogout]);

  // Refresh session proactively when the app comes back to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          console.log('🔐 App resumed — refreshing session');
          const { data: refreshResult, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('❌ Failed to refresh session on resume:', error);
            return;
          }
          const refreshedSession = refreshResult?.session;
          if (refreshedSession) {
            setState(prev => ({
              ...prev,
              session: refreshedSession,
              user: refreshedSession.user,
              loading: false,
            }));
          }
        } catch (refreshError) {
          console.error('❌ Unexpected error refreshing session on resume:', refreshError);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in with email:', email);
      setState(prev => ({ ...prev, loading: true }));

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      console.log('🔐 Sign in successful');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      console.log('🔐 Signing up with email:', email);
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name || '',
          },
          emailRedirectTo: undefined, // Don't require email confirmation for mobile app
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }

      console.log('🔐 Sign up successful');
      console.log('🔐 User data:', data?.user);
      console.log('🔐 Session:', data?.session);
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔐 Resetting password for email:', email);
      setState(prev => ({ ...prev, loading: true }));

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'sentreso://reset-password',
      });

      if (error) {
        console.error('❌ Reset password error:', error);
        throw error;
      }

      console.log('🔐 Reset password email sent');
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      console.log('🔐 User-initiated sign out...');
      setIsUserInitiatedLogout(true); // Mark as user-initiated
      setState(prev => ({ ...prev, loading: true }));

      // Clear session state first
      setState({
        user: null,
        session: null,
        loading: false,
      });

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        // Even if there's an error, clear local state
        setState({
          user: null,
          session: null,
          loading: false,
        });
        throw error;
      }
      console.log('🔐 Sign out successful');

      // Ensure navigation to login
      router.replace('/login');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Ensure we navigate to login even on error
      setState({
        user: null,
        session: null,
        loading: false,
      });
      router.replace('/login');
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔐 Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Refresh session error:', error);
        throw error;
      }
      console.log('🔐 Session refreshed successfully');
      return session;
    } catch (error) {
      console.error('❌ Refresh session error:', error);
      throw error;
    }
  };

  const attemptSessionRecovery = async () => {
    try {
      console.log('🔐 Manual session recovery attempt...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log('🔐 Manual recovery failed:', error.message);
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.log('🔐 Manual refresh also failed:', refreshError.message);
          throw new Error('Session recovery failed');
        } else if (refreshData.session) {
          console.log('🔐 Manual session recovered via refresh');
          setState({
            user: refreshData.session.user,
            session: refreshData.session,
            loading: false,
          });
          return;
        }
      } else if (session) {
        console.log('🔐 Manual session recovered via getSession');
        setState({
          user: session.user,
          session: session,
          loading: false,
        });
        return;
      }

      throw new Error('No session found');
    } catch (error) {
      console.error('🔐 Manual session recovery error:', error);
      throw error;
    }
  };

  return (
    <AuthManagerContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      refreshSession,
      resetPassword,
      attemptSessionRecovery,
    }}>
      {children}
    </AuthManagerContext.Provider>
  );
}

export function useAuthManager() {
  const context = useContext(AuthManagerContext);
  if (context === undefined) {
    throw new Error('useAuthManager must be used within an AuthManagerProvider');
  }
  return context;
}

// Convenience hook for backward compatibility
export function useAuth() {
  return useAuthManager();
}
