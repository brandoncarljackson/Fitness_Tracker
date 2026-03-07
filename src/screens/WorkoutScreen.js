import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, FlatList, Alert, Platform,
} from 'react-native';
import {
  Play, Square, Timer, Plus, Check, ArrowLeft,
  Clock, Search as SearchIcon, X, Minus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkout } from '../context/WorkoutContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatHMS = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
};

const formatMS = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' + s : s}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeWorkout,
    timer,
    startWorkout,
    endWorkout,
    addExerciseToWorkout,
    exerciseCache,
    restTimerDuration,
    updateRestTimerDuration,
  } = useWorkout();

  // 'addExercise' | 'logExercise' — only relevant while a workout is active
  const [subView, setSubView] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Set logging state (for the current exercise being logged)
  const [currentSets, setCurrentSets] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');

  // Rest timer
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const restIntervalRef = useRef(null);

  // Exercise search
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reset sub-views when workout ends ──────────────────────────────────────
  useEffect(() => {
    if (!activeWorkout) {
      setSubView(null);
      setSelectedExercise(null);
      setCurrentSets([]);
      setCurrentWeight('');
      setCurrentReps('');
      stopRestTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkout]);

  // ── Rest timer countdown ───────────────────────────────────────────────────
  const stopRestTimer = () => {
    setRestTimerActive(false);
    setRestTimeLeft(0);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (restTimerActive && restTimeLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setRestTimerActive(false);
            clearInterval(restIntervalRef.current);
            restIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [restTimerActive]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogSet = () => {
    const reps = parseInt(currentReps, 10);
    if (!currentReps || isNaN(reps) || reps <= 0) {
      Alert.alert('Invalid reps', 'Please enter a valid number of reps.');
      return;
    }
    const weight = parseFloat(currentWeight);
    setCurrentSets(prev => [...prev, { weight: isNaN(weight) ? 0 : weight, reps }]);
    setCurrentWeight('');
    setCurrentReps('');
    // Start rest timer
    stopRestTimer();
    setRestTimeLeft(restTimerDuration);
    setRestTimerActive(true);
  };

  const handleCompleteExercise = () => {
    if (currentSets.length === 0) {
      Alert.alert('No sets logged', 'Log at least one set before completing.');
      return;
    }
    addExerciseToWorkout(selectedExercise, currentSets);
    setCurrentSets([]);
    setSelectedExercise(null);
    stopRestTimer();
    setSubView(null);
  };

  const handleDiscardExercise = () => {
    Alert.alert(
      'Discard exercise?',
      'Sets logged for this exercise will not be saved.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Discard', style: 'destructive', onPress: () => {
            setCurrentSets([]);
            setSelectedExercise(null);
            stopRestTimer();
            setSubView(null);
          },
        },
      ]
    );
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentSets([]);
    setCurrentWeight('');
    setCurrentReps('');
    stopRestTimer();
    setSearchQuery('');
    setSubView('logExercise');
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish and save this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: () => { endWorkout(); } },
      ]
    );
  };

  // ── Filtered exercise list ─────────────────────────────────────────────────
  const filteredExercises = exerciseCache.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.equipment || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: No active workout
  // ══════════════════════════════════════════════════════════════════════════
  if (!activeWorkout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.timerContainer}>
          <Timer color="#2d3436" size={40} />
          <Text style={styles.timerText}>{formatHMS(timer)}</Text>
          <Text style={styles.timerLabel}>ACTIVE WORKOUT TIMER</Text>
        </View>
        <View style={styles.centeredContent}>
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Play color="#fff" size={32} fill="#fff" />
            <Text style={styles.startButtonText}>START NEW WORKOUT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: Add Exercise (inline search)
  // ══════════════════════════════════════════════════════════════════════════
  if (subView === 'addExercise') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSubView(null); }}>
            <ArrowLeft color="#2d3436" size={28} />
          </TouchableOpacity>
          <Text style={styles.navHeaderTitle}>Add Exercise</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.searchBar}>
          <SearchIcon color="#b2bec3" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#b2bec3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color="#b2bec3" size={20} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.exercisePickItem} onPress={() => handleSelectExercise(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exercisePickName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.exercisePickSub}>{item.category} · {item.equipment}</Text>
              </View>
              <Plus color="#00b894" size={22} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No exercises found.</Text>
          }
        />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: Log Exercise (sets entry)
  // ══════════════════════════════════════════════════════════════════════════
  if (subView === 'logExercise' && selectedExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={handleDiscardExercise}>
            <ArrowLeft color="#2d3436" size={28} />
          </TouchableOpacity>
          <Text style={styles.navHeaderTitle} numberOfLines={1}>{selectedExercise.name}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.logContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Rest Timer Banner ─────────────────────────────────────────── */}
          {restTimerActive && (
            <View style={styles.restBanner}>
              <Clock color="#fff" size={18} />
              <Text style={styles.restBannerText}>Rest: {formatMS(restTimeLeft)}</Text>
              <TouchableOpacity onPress={stopRestTimer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Rest Duration Configurator ────────────────────────────────── */}
          <View style={styles.restConfig}>
            <Clock color="#636e72" size={16} />
            <Text style={styles.restConfigLabel}>Rest timer: {formatMS(restTimerDuration)}</Text>
            <TouchableOpacity
              style={styles.restConfigBtn}
              onPress={() => updateRestTimerDuration(restTimerDuration - 15)}
            >
              <Minus color="#636e72" size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restConfigBtn}
              onPress={() => updateRestTimerDuration(restTimerDuration + 15)}
            >
              <Plus color="#636e72" size={16} />
            </TouchableOpacity>
          </View>

          {/* ── Sets Table ────────────────────────────────────────────────── */}
          <View style={styles.setsCard}>
            <View style={styles.setsHeaderRow}>
              <Text style={[styles.setsHeaderCell, { flex: 0.6 }]}>SET</Text>
              <Text style={[styles.setsHeaderCell, { flex: 1.8 }]}>WEIGHT (kg)</Text>
              <Text style={[styles.setsHeaderCell, { flex: 1 }]}>REPS</Text>
            </View>

            {currentSets.length === 0 && (
              <Text style={styles.noSetsText}>No sets logged yet — add your first set below.</Text>
            )}

            {currentSets.map((s, i) => (
              <View key={i} style={[styles.setRow, i % 2 !== 0 && styles.setRowAlt]}>
                <Text style={[styles.setCell, { flex: 0.6 }]}>{i + 1}</Text>
                <Text style={[styles.setCell, { flex: 1.8 }]}>
                  {s.weight > 0 ? s.weight : '—'}
                </Text>
                <Text style={[styles.setCell, { flex: 1 }]}>{s.reps}</Text>
              </View>
            ))}
          </View>

          {/* ── Set Input Form ────────────────────────────────────────────── */}
          <View style={styles.setInputCard}>
            <Text style={styles.setInputTitle}>Set {currentSets.length + 1}</Text>
            <View style={styles.setInputRow}>
              <View style={styles.setInputGroup}>
                <Text style={styles.setInputGroupLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.setInputField}
                  placeholder="0"
                  placeholderTextColor="#b2bec3"
                  keyboardType="decimal-pad"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.setInputGroup}>
                <Text style={styles.setInputGroupLabel}>Reps</Text>
                <TextInput
                  style={styles.setInputField}
                  placeholder="0"
                  placeholderTextColor="#b2bec3"
                  keyboardType="number-pad"
                  value={currentReps}
                  onChangeText={setCurrentReps}
                  returnKeyType="done"
                  onSubmitEditing={handleLogSet}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.logSetBtn} onPress={handleLogSet}>
              <Plus color="#fff" size={22} />
              <Text style={styles.logSetBtnText}>LOG SET</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Complete Exercise Bar ──────────────────────────────────────── */}
        <View style={[styles.completeBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteExercise}>
            <Check color="#fff" size={24} />
            <Text style={styles.completeBtnText}>COMPLETE EXERCISE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: Active Workout Dashboard
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Timer bar */}
      <View style={styles.timerBar}>
        <Timer color="#2d3436" size={26} />
        <Text style={styles.timerBarText}>{formatHMS(timer)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.workoutContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.workoutTitle}>Workout in Progress</Text>

        {activeWorkout.exercises.length === 0 && (
          <Text style={styles.noExercisesHint}>
            Tap "Add Exercise" to start logging!
          </Text>
        )}

        {activeWorkout.exercises.map((ex, index) => (
          <View key={index} style={styles.exerciseCard}>
            {/* Exercise header */}
            <View style={styles.exerciseCardHeader}>
              <Text style={styles.exerciseCardName} numberOfLines={1}>{ex.name}</Text>
              {ex.completed && <Check color="#00b894" size={18} />}
            </View>
            <Text style={styles.exerciseCardSub}>{ex.equipment}</Text>

            {/* Mini sets table */}
            {ex.sets && ex.sets.length > 0 && (
              <View style={styles.miniTable}>
                <View style={styles.miniTableHeader}>
                  <Text style={[styles.miniHeaderCell, { flex: 0.6 }]}>SET</Text>
                  <Text style={[styles.miniHeaderCell, { flex: 1.8 }]}>WEIGHT</Text>
                  <Text style={[styles.miniHeaderCell, { flex: 1 }]}>REPS</Text>
                </View>
                {ex.sets.map((s, si) => (
                  <View key={si} style={[styles.miniRow, si % 2 !== 0 && styles.miniRowAlt]}>
                    <Text style={[styles.miniCell, { flex: 0.6 }]}>{si + 1}</Text>
                    <Text style={[styles.miniCell, { flex: 1.8 }]}>
                      {s.weight > 0 ? `${s.weight} kg` : '—'}
                    </Text>
                    <Text style={[styles.miniCell, { flex: 1 }]}>{s.reps}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Bottom padding so content is not hidden behind action bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => { setSearchQuery(''); setSubView('addExercise'); }}
        >
          <Plus color="#fff" size={22} />
          <Text style={styles.addExerciseBtnText}>ADD EXERCISE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
          <Square color="#fff" size={20} fill="#fff" />
          <Text style={styles.finishBtnText}>FINISH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  // Idle view
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
  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
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

  // Navigation header (shared by addExercise + logExercise views)
  navHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
  },
  navHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#2d3436',
    textAlign: 'center',
    marginHorizontal: 10,
  },

  // Add Exercise view
  searchBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    borderRadius: 15,
    elevation: 3,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#2d3436' },
  exercisePickItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  exercisePickName: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  exercisePickSub: { fontSize: 13, color: '#636e72', marginTop: 3 },
  emptyListText: { textAlign: 'center', color: '#b2bec3', marginTop: 40, fontSize: 15, fontWeight: '600' },

  // Log Exercise view
  logContent: { padding: 15, paddingBottom: 100 },
  restBanner: {
    backgroundColor: '#0984e3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  restBannerText: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', marginLeft: 8 },
  restConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    elevation: 1,
  },
  restConfigLabel: { flex: 1, marginLeft: 8, fontSize: 14, color: '#636e72', fontWeight: '600' },
  restConfigBtn: {
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    padding: 6,
    marginLeft: 6,
  },
  setsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 8,
    marginBottom: 4,
  },
  setsHeaderCell: { fontSize: 11, fontWeight: '800', color: '#b2bec3', letterSpacing: 0.5 },
  noSetsText: { fontSize: 14, color: '#b2bec3', textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' },
  setRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6 },
  setRowAlt: { backgroundColor: '#f8f9fa' },
  setCell: { fontSize: 15, color: '#2d3436', fontWeight: '600' },
  setInputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  setInputTitle: { fontSize: 16, fontWeight: '800', color: '#2d3436', marginBottom: 12 },
  setInputRow: { flexDirection: 'row', gap: 12 },
  setInputGroup: { flex: 1 },
  setInputGroupLabel: { fontSize: 12, fontWeight: '700', color: '#636e72', marginBottom: 6 },
  setInputField: {
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#2d3436',
    textAlign: 'center',
  },
  logSetBtn: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    elevation: 3,
  },
  logSetBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', marginLeft: 8 },
  completeBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 20,
    paddingTop: 12,
    elevation: 10,
  },
  completeBtn: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 4,
  },
  completeBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', marginLeft: 10 },

  // Active Workout view
  timerBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 4,
    gap: 10,
  },
  timerBarText: { fontSize: 36, fontWeight: '900', color: '#2d3436' },
  workoutContent: { padding: 15 },
  workoutTitle: { fontSize: 20, fontWeight: '800', color: '#636e72', marginBottom: 16, textAlign: 'center' },
  noExercisesHint: {
    textAlign: 'center',
    color: '#b2bec3',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#00b894',
    elevation: 2,
  },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  exerciseCardName: { flex: 1, fontSize: 17, fontWeight: '800', color: '#2d3436', marginRight: 8 },
  exerciseCardSub: { fontSize: 13, color: '#95a5a6', marginBottom: 10 },
  miniTable: { marginTop: 6 },
  miniTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 4,
    marginBottom: 2,
  },
  miniHeaderCell: { fontSize: 10, fontWeight: '800', color: '#b2bec3', letterSpacing: 0.5 },
  miniRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 2, borderRadius: 4 },
  miniRowAlt: { backgroundColor: '#f8f9fa' },
  miniCell: { fontSize: 13, color: '#2d3436', fontWeight: '600' },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 15,
    gap: 10,
  },
  addExerciseBtn: {
    flex: 1,
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  addExerciseBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', marginLeft: 6 },
  finishBtn: {
    backgroundColor: '#d63031',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  finishBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', marginLeft: 6 },
});
