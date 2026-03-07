import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Play, Square, Timer } from 'lucide-react-native';
import { useWorkout } from '../context/WorkoutContext';

export default function WorkoutScreen() {
  const { activeWorkout, timer, startWorkout, endWorkout } = useWorkout();

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Timer color="#2d3436" size={40} />
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        <Text style={styles.timerLabel}>ACTIVE WORKOUT TIMER</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!activeWorkout ? (
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Play color="#fff" size={32} fill="#fff" />
            <Text style={styles.startButtonText}>START NEW WORKOUT</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeContainer}>
            <Text style={styles.activeTitle}>Workout in Progress</Text>
            {activeWorkout.exercises.map((ex, index) => (
              <View key={index} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseDetails}>{ex.equipment}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.stopButton} onPress={endWorkout}>
              <Square color="#fff" size={24} fill="#fff" />
              <Text style={styles.stopButtonText}>FINISH WORKOUT</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  timerContainer: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 4,
  },
  timerText: { fontSize: 64, fontWeight: '900', color: '#2d3436' },
  timerLabel: { fontSize: 14, color: '#b2bec3', fontWeight: '800', marginTop: 5 },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  startButton: {
    backgroundColor: '#00b894',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 15 },
  activeContainer: { width: '100%', alignItems: 'center' },
  activeTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#636e72' },
  exerciseRow: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#00b894',
  },
  exerciseName: { fontSize: 18, fontWeight: '700' },
  exerciseDetails: { fontSize: 14, color: '#999' },
  stopButton: {
    backgroundColor: '#d63031',
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 10 },
});
