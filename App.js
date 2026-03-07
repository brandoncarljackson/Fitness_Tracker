import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash visible initially
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App: Starting initialization...');

        // 1. Hide the native splash screen early to show our custom JS loader
        // This ensures the user sees your "Initializing" text and overlay.
        await SplashScreen.hideAsync().catch(() => {});

        // 2. Initialize sensors
        const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
        setIsPedometerAvailable(String(isAvailable));

        if (isAvailable) {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 1);
          const result = await Pedometer.getStepCountAsync(start, end).catch(() => ({ steps: 0 }));
          setPastStepCount(result.steps || 0);
        }

        // Artificial delay so the user can actually see the loading screen
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (e) {
        console.error('App: Initialization failed', e);
      } finally {
        setAppIsReady(true);
        console.log('App: Initialization complete');
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    let subscription;
    if (appIsReady && isPedometerAvailable === 'true') {
      subscription = Pedometer.watchStepCount(result => {
        setCurrentStepCount(result.steps);
      });
    }
    return () => subscription && subscription.remove();
  }, [appIsReady, isPedometerAvailable]);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Location access is needed for tracking.");
      return;
    }
    setIsTracking(true);
  };

  // 3. Custom JS Loading Overlay
  // This will now show because we called SplashScreen.hideAsync() at the start of prepare()
  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>Fitness Tracker Pro</Text>
          <Text style={styles.loadingSubtitle}>Setting up your workout space...</Text>
          <ActivityIndicator size="large" color="#00b894" style={{ marginTop: 40 }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fitness Tracker Pro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Steps Today</Text>
          <Text style={styles.stepValue}>{pastStepCount + currentStepCount}</Text>
          <Text style={styles.cardSubtext}>Goal: 10,000</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <Text style={styles.smallLabel}>Calories</Text>
            <Text style={styles.smallValue}>{((pastStepCount + currentStepCount) * 0.04).toFixed(1)} kcal</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.smallLabel}>Distance</Text>
            <Text style={styles.smallValue}>{((pastStepCount + currentStepCount) * 0.0008).toFixed(2)} km</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, isTracking ? styles.btnStop : styles.btnStart]}
          onPress={() => isTracking ? setIsTracking(false) : startTracking()}
        >
          <Text style={styles.btnText}>{isTracking ? 'Stop Tracking' : 'Start Live Tracking'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2d3436',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContent: { alignItems: 'center' },
  loadingTitle: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
  loadingSubtitle: { fontSize: 16, color: '#b2bec3', marginTop: 10 },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 45 : 20
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3436' },
  content: { padding: 16 },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 35,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardLabel: { fontSize: 14, color: '#636e72', fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  stepValue: { fontSize: 72, fontWeight: '900', color: '#00b894' },
  cardSubtext: { fontSize: 14, color: '#b2bec3', fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  halfCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '48%', alignItems: 'center', elevation: 4 },
  smallLabel: { fontSize: 12, color: '#636e72', marginBottom: 5 },
  smallValue: { fontSize: 20, fontWeight: '800', color: '#2d3436' },
  btn: { padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
  btnStart: { backgroundColor: '#0984e3' },
  btnStop: { backgroundColor: '#d63031' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
