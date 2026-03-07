import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatOpacity, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Search, Info, Dumbbell, Video } from 'lucide-react-native';
import { EXERCISES } from '../data/exercises';
import { Video as ExpoVideo } from 'expo-av';

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const filteredExercises = EXERCISES.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <Search color="#b2bec3" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises or equipment..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {selectedExercise ? (
        <ScrollView style={styles.detailContainer}>
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
              <Video color="#00b894" size={24} />
              <Text style={styles.sectionTitle}>Instructional Video</Text>
            </View>
            <ExpoVideo
              source={{ uri: selectedExercise.videoUrl }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              isLooping
            />
          </View>

          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Info color="#0984e3" size={24} />
                <Text style={styles.sectionTitle}>Instructions</Text>
             </View>
             <Text style={styles.instructionText}>{selectedExercise.instructions}</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
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
              <Dumbbell color="#00b894" size={24} />
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
    paddingVertical: 10,
    margin: 15,
    borderRadius: 15,
    elevation: 3,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContainer: { paddingHorizontal: 15 },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 1,
  },
  cardName: { fontSize: 18, fontWeight: '800', color: '#2d3436' },
  cardSub: { fontSize: 14, color: '#636e72', marginTop: 4 },
  detailContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: '#0984e3', fontSize: 16, fontWeight: '700' },
  detailTitle: { fontSize: 32, fontWeight: '900', color: '#2d3436' },
  tagContainer: { flexDirection: 'row', marginVertical: 15 },
  tag: { backgroundColor: '#00b894', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  section: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10, color: '#2d3436' },
  videoPlayer: { width: '100%', height: 220, borderRadius: 15, backgroundColor: '#000' },
  instructionText: { fontSize: 16, lineHeight: 24, color: '#636e72' },
});
