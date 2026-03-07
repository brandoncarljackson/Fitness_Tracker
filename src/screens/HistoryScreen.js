import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { History, Calendar, Clock } from 'lucide-react-native';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { workoutHistory } = useWorkout();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(d);
    } catch (e) {
      return 'Unknown Date';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <History color="#2d3436" size={28} />
        <Text style={styles.headerTitle}>Workout History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {workoutHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color="#b2bec3" size={64} />
            <Text style={styles.emptyText}>No workouts recorded yet.</Text>
          </View>
        ) : (
          workoutHistory.map((workout, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(workout.startTime)}</Text>
                <View style={styles.durationTag}>
                  <Clock color="#fff" size={14} />
                  <Text style={styles.durationText}>{formatTime(workout.duration)}</Text>
                </View>
              </View>

              <Text style={styles.exerciseCount}>
                {workout.exercises ? workout.exercises.length : 0} Exercises Completed
              </Text>

              <View style={styles.exercisePreview}>
                {workout.exercises && workout.exercises.slice(0, 3).map((ex, i) => (
                  <View key={i} style={styles.previewExercise}>
                    <Text style={styles.previewText}>• {ex.name}</Text>
                    {ex.sets && ex.sets.length > 0 && (
                      <View style={styles.previewSets}>
                        {ex.sets.map((s, si) => (
                          <Text key={si} style={styles.previewSetText}>
                            Set {si + 1}: {s.reps} reps{s.weight > 0 ? ` @ ${s.weight} kg` : ''}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                {workout.exercises && workout.exercises.length > 3 && (
                  <Text style={styles.moreText}>+{workout.exercises.length - 3} more</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 24, fontWeight: '900', marginLeft: 10, color: '#2d3436' },
  list: { padding: 15, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#b2bec3', fontSize: 18, marginTop: 15, fontWeight: '600' },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDate: { fontSize: 18, fontWeight: '800', color: '#2d3436' },
  durationTag: {
    backgroundColor: '#0984e3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 5 },
  exerciseCount: { fontSize: 14, color: '#636e72', fontWeight: '600' },
  exercisePreview: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 10 },
  previewExercise: { marginBottom: 6 },
  previewText: { fontSize: 14, color: '#95a5a6', marginBottom: 2 },
  previewSets: { marginLeft: 14 },
  previewSetText: { fontSize: 12, color: '#b2bec3', marginBottom: 1 },
  moreText: { fontSize: 12, color: '#b2bec3', fontStyle: 'italic', marginTop: 2 }
});
