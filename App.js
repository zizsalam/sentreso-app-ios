import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { drain } from './src/offline/txnQueue';
import { initAnalytics, track } from './src/analytics/posthog';

const Stack = createNativeStackNavigator();

function StaticScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Fresh project with React Navigation</Text>
    </View>
  );
}

export default function App() {
  initAnalytics();
  // background sync triggers
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') drain(track);
    });
    const net = NetInfo.addEventListener((state) => {
      if (state.isConnected) drain(track);
    });
    return () => {
      sub.remove();
      net();
    };
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Static" component={StaticScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
