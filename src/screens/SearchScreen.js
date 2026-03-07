import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search, Info, Dumbbell, Video as VideoIcon, PlusCircle, CheckCircle2 } from 'lucide-react-native';
import { EXERCISES } from '../data/exercises';
import { Video } from 'expo-av';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { addExerciseToWorkout, activeWorkout } = useWorkout();

  const filteredExercises = EXERCISES.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase()) ||
    ex.equipment.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (ex) => {
    addExerciseToWorkout(ex);
  };

  const isAlreadyInWorkout = (exId) => {
    return activeWorkout?.exercises.some(ex => ex.id === exId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchHeader}>
        <Search color="#b2bec3" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises or equipment..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#b2bec3"
        />
      </View>

      {selectedExercise ? (
        <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to list</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{selectedExercise.category}</Text></View>
            <View style={[styles.tag, { backgroundColor: '#e17055' }]}><Text style={styles.tagText}>{selectedExercise.equipment}</Text></View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <VideoIcon color="#00b894" size={24} />
              <Text style={styles.sectionTitle}>Instructional Video</Text>
            </View>
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: selectedExercise.videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            </View>
          </View>

          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Info color="#0984e3" size={24} />
                <Text style={styles.sectionTitle}>Instructions</Text>
             </View>
             <Text style={styles.instructionText}>{selectedExercise.instructions}</Text>
          </View>

          {activeWorkout && (
            <TouchableOpacity
              style={[styles.addButtonLarge, isAlreadyInWorkout(selectedExercise.id) && styles.addedButton]}
              onPress={() => handleAdd(selectedExercise)}
            >
              {isAlreadyInWorkout(selectedExercise.id) ? (
                <>
                  <CheckCircle2 color="#fff" size={24} />
                  <Text style={styles.addButtonText}>ADDED TO WORKOUT</Text>
                </>
              ) : (
                <>
                  <PlusCircle color="#fff" size={24} />
                  <Text style={styles.addButtonText}>ADD TO WORKOUT</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredExercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.exerciseCard}
              onPress={() => setSelectedExercise(ex)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{ex.name}</Text>
                <Text style={styles.cardSub}>{ex.category} • {ex.equipment}</Text>
              </View>
              <View style={styles.cardActions}>
                {activeWorkout && (
                  <TouchableOpacity onPress={() => handleAdd(ex)} style={styles.iconButton}>
                    {isAlreadyInWorkout(ex.id) ?
                      <CheckCircle2 color="#00b894" size={28} /> :
                      <PlusCircle color="#00b894" size={28} />
                    }
                  </TouchableOpacity>
                )}
                <Dumbbell color="#dfe6e9" size={24} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    margin: 15,
    borderRadius: 15,
    elevation: 3,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#2d3436' },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 2,
  },
  cardName: { fontSize: 18, fontWeight: '800', color: '#2d3436' },
  cardSub: { fontSize: 13, color: '#636e72', marginTop: 4, fontWeight: '500' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 15 },
  detailContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#0984e3', fontSize: 16, fontWeight: '700' },
  detailTitle: { fontSize: 32, fontWeight: '900', color: '#2d3436' },
  tagContainer: { flexDirection: 'row', marginVertical: 15 },
  tag: { backgroundColor: '#00b894', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  section: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10, color: '#2d3436' },
  videoWrapper: { width: '100%', height: 220, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  videoPlayer: { width: '100%', height: '100%' },
  instructionText: { fontSize: 16, lineHeight: 26, color: '#444' },
  addButtonLarge: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginTop: 40,
    elevation: 4,
  },
  addedButton: { backgroundColor: '#2d3436' },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: '900', marginLeft: 12 },
});
