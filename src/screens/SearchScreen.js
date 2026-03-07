import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Info, Dumbbell, Video as VideoIcon, PlusCircle, CheckCircle2, ChevronDown, Globe } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const { addExerciseToWorkout, activeWorkout, exerciseCache, loadMoreFromInternet, isLoadingMore } = useWorkout();

  const filteredExercises = exerciseCache.filter(ex => {
    const searchTerm = search.toLowerCase();
    const name = (ex.name || '').toLowerCase();
    const category = (ex.category || '').toLowerCase();
    const equipment = (ex.equipment || '').toLowerCase();
    return name.includes(searchTerm) || category.includes(searchTerm) || equipment.includes(searchTerm);
  });

  const handleLoadMore = async () => {
    // Correctly call the function as named in the context
    await loadMoreFromInternet(search);
  };

  const handleAdd = (ex) => {
    addExerciseToWorkout(ex);
  };

  const isAlreadyInWorkout = (exId) => {
    return activeWorkout?.exercises.some(ex => ex.id === exId);
  };

  if (exerciseCache.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Syncing Global Exercise Database...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchHeader}>
        <Search color="#b2bec3" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search local or internet database..."
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
              {videoLoading && (
                <View style={styles.videoLoader}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.videoLoaderText}>Streaming video...</Text>
                </View>
              )}
              <Video
                source={{ uri: selectedExercise.videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={false}
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)}
                onError={() => setVideoLoading(false)}
              />
            </View>
          </View>

          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Info color="#0984e3" size={24} />
                <Text style={styles.sectionTitle}>Instructions</Text>
             </View>
             <Text style={styles.instructionText}>{selectedExercise.instructions || 'No detailed instructions available.'}</Text>
          </View>

          {activeWorkout && (
            <TouchableOpacity
              style={[styles.addButtonLarge, isAlreadyInWorkout(selectedExercise.id) && styles.addedButton]}
              onPress={() => handleAdd(selectedExercise)}
            >
              <Text style={styles.addButtonText}>
                {isAlreadyInWorkout(selectedExercise.id) ? 'ALREADY IN WORKOUT' : 'ADD TO WORKOUT'}
              </Text>
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
              <Dumbbell color="#dfe6e9" size={24} />
            </TouchableOpacity>
          ))}

          <View style={styles.footer}>
            {search.length > 0 && filteredExercises.length === 0 ? (
               <Text style={styles.noResultsText}>No local matches for "{search}"</Text>
            ) : (
               <Text style={styles.footerText}>Showing {filteredExercises.length} of {exerciseCache.length} cached</Text>
            )}

            <TouchableOpacity
              style={[styles.loadMoreButton, search.length > 0 && styles.targetedButton]}
              onPress={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={search.length > 0 ? "#fff" : "#00b894"} />
              ) : (
                <>
                  {search.length > 0 ? <Globe color="#fff" size={20} /> : <ChevronDown color="#00b894" size={20} />}
                  <Text style={[styles.loadMoreText, search.length > 0 && styles.targetedText]}>
                    {search.length > 0 ? `Search Internet for "${search}"` : "Load More Exercises"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, color: '#636e72', fontWeight: '600' },
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
  detailContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#0984e3', fontSize: 16, fontWeight: '700' },
  detailTitle: { fontSize: 28, fontWeight: '900', color: '#2d3436' },
  tagContainer: { flexDirection: 'row', marginVertical: 15 },
  tag: { backgroundColor: '#00b894', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  section: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10, color: '#2d3436' },
  videoWrapper: { width: '100%', height: 220, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoPlayer: { width: '100%', height: '100%' },
  videoLoader: { position: 'absolute', zIndex: 1, alignItems: 'center' },
  videoLoaderText: { color: '#fff', fontSize: 12, marginTop: 10 },
  instructionText: { fontSize: 16, lineHeight: 26, color: '#444' },
  addButtonLarge: { backgroundColor: '#00b894', padding: 18, borderRadius: 15, marginTop: 40, alignItems: 'center', elevation: 4 },
  addedButton: { backgroundColor: '#2d3436' },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  footer: { paddingVertical: 30, alignItems: 'center' },
  footerText: { color: '#b2bec3', fontSize: 12, marginBottom: 10, fontWeight: '600' },
  noResultsText: { color: '#d63031', fontSize: 14, marginBottom: 15, fontWeight: '700' },
  loadMoreButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#00b894', borderStyle: 'dashed' },
  loadMoreText: { color: '#00b894', fontWeight: '800', marginLeft: 8 },
  targetedButton: { backgroundColor: '#0984e3', borderColor: '#0984e3', borderStyle: 'solid', width: '100%' },
  targetedText: { color: '#fff' }
});
