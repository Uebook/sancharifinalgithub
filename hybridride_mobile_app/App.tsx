import React from 'react';
import { SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './Components/Navigation/AppNavigator';
import { TripProvider } from './Components/Context/TripContext';
import { AuthProvider } from './Components/Context/AuthContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <TripProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </TripProvider>
    </SafeAreaProvider>
  )
}
