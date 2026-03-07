import React, { useState, useEffect } from 'react';
import { View, ImageBackground, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Dumbbell, History, Search, UserCircle } from 'lucide-react-native';

// Screens
import WorkoutScreen from './src/screens/WorkoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { WorkoutProvider } from './src/context/WorkoutContext';

const Tab = createBottomTabNavigator();

// Keep native splash visible initially
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide native splash immediately to show JS overlay
        await SplashScreen.hideAsync().catch(() => {});
        // Artificial delay for branding/data load
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.flex1}>
        <StatusBar style="light" />
        <ImageBackground
          source={require('./assets/splash.png')}
          style={styles.splashBackground}
          resizeMode="cover"
        >
          <View style={styles.blankSpaceOverlay}>
            <Text style={styles.loadingTitle}>Fitness Tracker Pro</Text>
            <Text style={styles.loadingSubtitle}>Setting up your workout space...</Text>
            <ActivityIndicator size="large" color="#00b894" style={{ marginTop: 20 }} />
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                if (route.name === 'Workout') return <Dumbbell color={color} size={size} />;
                if (route.name === 'History') return <History color={color} size={size} />;
                if (route.name === 'Search') return <Search color={color} size={size} />;
                if (route.name === 'Profile') return <UserCircle color={color} size={size} />;
              },
              tabBarActiveTintColor: '#00b894',
              tabBarInactiveTintColor: '#b2bec3',
              headerShown: false,
              tabBarStyle: {
                 paddingBottom: Platform.OS === 'android' ? 10 : 30,
                 height: Platform.OS === 'android' ? 70 : 90,
                 borderTopWidth: 1,
                 borderTopColor: '#f1f2f6',
                 elevation: 10,
                 backgroundColor: '#fff',
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '800',
              }
            })}
          >
            <Tab.Screen name="Workout" component={WorkoutScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: '#ffffff' },
  splashBackground: { flex: 1, width: '100%', height: '100%' },
  blankSpaceOverlay: {
    flex: 1,
    paddingTop: '53%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#E0E0E0',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
});
