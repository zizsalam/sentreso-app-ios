import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DETAILS_KEY = 'user_details';

interface UserDetails {
  name: string;
  phone: string;
  email?: string;
}

interface UserContextType {
  userDetails: UserDetails | null;
  setUserDetails: (details: UserDetails) => Promise<void>;
  clearUserDetails: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userDetails, setUserDetailsState] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const details = await AsyncStorage.getItem(USER_DETAILS_KEY);
        if (details) {
          setUserDetailsState(JSON.parse(details));
        }
      } catch (error) {
        console.error('Error loading user details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserDetails();
  }, []);

  const setUserDetails = async (details: UserDetails) => {
    try {
      await AsyncStorage.setItem(USER_DETAILS_KEY, JSON.stringify(details));
      setUserDetailsState(details);
    } catch (error) {
      console.error('Error saving user details:', error);
    }
  };

  const clearUserDetails = async () => {
    try {
      await AsyncStorage.removeItem(USER_DETAILS_KEY);
      setUserDetailsState(null);
    } catch (error) {
      console.error('Error clearing user details:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      userDetails,
      setUserDetails,
      clearUserDetails,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for safe user details access (drop-in replacement for useAuth)
export function useUserDetails() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserDetails must be used within a UserProvider');
  }
  return context;
}
