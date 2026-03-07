import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Search, Info, Dumbbell, Video as VideoIcon, PlusCircle, CheckCircle2, ChevronDown, Globe } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [cachedVideoUri, setCachedVideoUri] = useState(null);
  const { addExerciseToWorkout, activeWorkout, exerciseCache, loadMoreFromInternet, isLoadingMore } = useWorkout();

  // Handle Video Caching (max 2 hours)
  useEffect(() => {
    let isMounted = true;
    if (selectedExercise && selectedExercise.videoUrl) {
      const cacheVideo = async () => {
        setVideoLoading(true);
        try {
          const filename = selectedExercise.id + '.mp4';
          const cachePath = `${FileSystem.cacheDirectory}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(cachePath);

          if (fileInfo.exists) {
            const now = Date.now();
            // FileSystem modificationTime is in seconds
            const age = now - fileInfo.modificationTime * 1000;
            if (age < 2 * 60 * 60 * 1000) { // 2 hours
              if (isMounted) setCachedVideoUri(cachePath);
              setVideoLoading(false);
              return;
            } else {
              await FileSystem.deleteAsync(cachePath);
            }
          }

          // If not cached or expired, download
          const downloadRes = await FileSystem.downloadAsync(selectedExercise.videoUrl, cachePath);
          if (isMounted) setCachedVideoUri(downloadRes.uri);
        } catch (e) {
          console.log('Video cache failed:', e);
          if (isMounted) setCachedVideoUri(selectedExercise.videoUrl); // Fallback to stream
        } finally {
          if (isMounted) setVideoLoading(false);
        }
      };
      cacheVideo();
    }
    return () => { isMounted = false; setCachedVideoUri(null); };
  }, [selectedExercise]);

  const filteredExercises = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return exerciseCache;
    return exerciseCache.filter(ex => {
      const name = (ex.name || '').toLowerCase();
      const category = (ex.category || '').toLowerCase();
      const equipment = (ex.equipment || '').toLowerCase();
      return name.includes(searchTerm) || category.includes(searchTerm) || equipment.includes(searchTerm);
    });
  }, [search, exerciseCache]);

  const handleLoadMore = async () => {
    await loadMoreFromInternet(search);
  };

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity style={styles.exerciseCard} onPress={() => setSelectedExercise(item)}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSub}>{item.category} • {item.equipment}</Text>
      </View>
      <Dumbbell color="#dfe6e9" size={24} />
    </TouchableOpacity>
  );

  const ListFooter = () => (
    <View style={styles.footer}>
      {search.length > 0 && filteredExercises.length === 0 ? (
         <Text style={styles.noResultsText}>No local matches for "{search}"</Text>
      ) : (
         <Text style={styles.footerText}>Found {filteredExercises.length} cached exercises</Text>
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
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchHeader}>
        <Search color="#b2bec3" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Fast search database..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#b2bec3"
        />
      </View>

      {selectedExercise ? (
        <ScrollView style={styles.detailContainer}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to list</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedExercise.name}</Text>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <VideoIcon color="#00b894" size={24} />
              <Text style={styles.sectionTitle}>Guide Video</Text>
            </View>
            <View style={styles.videoWrapper}>
              {videoLoading && <ActivityIndicator color="#fff" style={styles.videoLoader} />}
              <Video
                source={{ uri: cachedVideoUri || selectedExercise.videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isMuted={true}
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
        </ScrollView>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, color: '#636e72', fontWeight: '600' },
  searchHeader: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, margin: 15, borderRadius: 15, elevation: 3 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#2d3436' },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  exerciseCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, elevation: 2 },
  cardInfo: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#2d3436' },
  cardSub: { fontSize: 13, color: '#636e72', marginTop: 4 },
  detailContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#0984e3', fontSize: 16, fontWeight: '700' },
  detailTitle: { fontSize: 26, fontWeight: '900', color: '#2d3436' },
  section: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 10, color: '#2d3436' },
  videoWrapper: { width: '100%', height: 200, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center' },
  videoPlayer: { width: '100%', height: '100%' },
  videoLoader: { position: 'absolute', alignSelf: 'center', zIndex: 1 },
  instructionText: { fontSize: 15, lineHeight: 24, color: '#444' },
  footer: { paddingVertical: 30, alignItems: 'center' },
  footerText: { color: '#b2bec3', fontSize: 12, marginBottom: 10, fontWeight: '600' },
  noResultsText: { color: '#d63031', fontSize: 14, marginBottom: 15, fontWeight: '700' },
  loadMoreButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#00b894', borderStyle: 'dashed' },
  loadMoreText: { color: '#00b894', fontWeight: '800', marginLeft: 8 },
  targetedButton: { backgroundColor: '#0984e3', borderColor: '#0984e3', borderStyle: 'solid', width: '100%' },
  targetedText: { color: '#fff' }
});
