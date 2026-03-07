import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, Image } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Pure JavaScript logic for fitness stats
const FitnessStats = {
  calculateCalories: (steps) => steps * 0.04,
  calculateDistance: (steps) => steps * 0.0008,
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load sensors or any API calls here
        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(String(isAvailable));

        if (isAvailable) {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 1);
          const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
          if (pastStepCountResult) {
            setPastStepCount(pastStepCountResult.steps);
          }
        }

        // Artificial delay to show our custom loading overlay (2.5 seconds total)
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the native splash screen as soon as the app container is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    let subscription;
    if (appIsReady && isPedometerAvailable === 'true') {
      subscription = Pedometer.watchStepCount(result => {
        setCurrentStepCount(result.steps);
      });
    }
    return () => subscription && subscription.remove();
  }, [appIsReady, isPedometerAvailable]);

  // Use JS logic to update stats
  useEffect(() => {
    const totalSteps = pastStepCount + currentStepCount;
    setCalories(FitnessStats.calculateCalories(totalSteps).toFixed(2));
    setDistance(FitnessStats.calculateDistance(totalSteps).toFixed(2));
  }, [currentStepCount, pastStepCount]);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      Alert.alert("Permission Required", "This app needs location access to track your fitness activity.");
      return;
    }

    setIsTracking(true);
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    setLocation(null);
  };

  // While app is not ready, we render a "Custom Loading Screen" that sits on top of the native splash
  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>Fitness Tracker Pro</Text>
          <Text style={styles.loadingSubtitle}>Getting your stats ready...</Text>
          <View style={styles.loaderBarContainer}>
            <View style={styles.loaderBar} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
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
            <Text style={styles.smallValue}>{calories} kcal</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.smallLabel}>Distance</Text>
            <Text style={styles.smallValue}>{distance} km</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Live GPS Tracking</Text>
          {location ? (
            <View style={styles.locBox}>
              <Text style={styles.locText}>Lat: {location.coords.latitude.toFixed(4)}</Text>
              <Text style={styles.locText}>Lon: {location.coords.longitude.toFixed(4)}</Text>
              <Text style={styles.speedText}>Speed: {(location.coords.speed * 3.6).toFixed(1)} km/h</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{errorMsg || 'GPS ready for tracking'}</Text>
          )}

          <TouchableOpacity
            style={[styles.btn, isTracking ? styles.btnStop : styles.btnStart]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.btnText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sensor: {isPedometerAvailable === 'true' ? 'Active' : 'Unavailable'}</Text>
          <Text style={styles.footerText}>Pure JavaScript Fitness App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2d3436',
    letterSpacing: -1,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#636e72',
    marginTop: 8,
    fontWeight: '500',
  },
  loaderBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#f1f2f6',
    borderRadius: 2,
    marginTop: 30,
    overflow: 'hidden',
  },
  loaderBar: {
    width: '60%', // Static placeholder for a progress bar
    height: '100%',
    backgroundColor: '#00b894',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 45 : 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  content: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardLabel: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stepValue: {
    fontSize: 60,
    fontWeight: '800',
    color: '#00b894',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#b2bec3',
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    elevation: 1,
  },
  smallLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 5,
  },
  smallValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
  },
  locBox: {
    marginVertical: 10,
    backgroundColor: '#f1f2f6',
    padding: 10,
    borderRadius: 10,
  },
  locText: {
    fontSize: 13,
    color: '#2d3436',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0984e3',
    marginTop: 5,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#b2bec3',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  btn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnStart: {
    backgroundColor: '#0984e3',
  },
  btnStop: {
    backgroundColor: '#d63031',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 11,
    color: '#b2bec3',
    marginBottom: 2,
  },
});
