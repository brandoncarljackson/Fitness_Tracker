import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Info, Dumbbell, Video as VideoIcon, ChevronDown, Globe, X, Flame } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useWorkout } from '../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORY_COLORS = {
  chest: '#e17055',
  back: '#0984e3',
  legs: '#6c5ce7',
  arms: '#00b894',
  shoulders: '#fdcb6e',
  abs: '#e84393',
  core: '#e84393',
  cardio: '#fd79a8',
  default: '#74b9ff',
};

function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.default;
  const key = category.toLowerCase();
  for (const k of Object.keys(CATEGORY_COLORS)) {
    if (key.includes(k)) return CATEGORY_COLORS[k];
  }
  return CATEGORY_COLORS.default;
}

// Convert a 6-digit hex color to an rgba string with the given opacity (0–1)
function hexToRgba(hex, opacity) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const { addExerciseToWorkout, activeWorkout, exerciseCache, loadMoreFromInternet, isLoadingMore } = useWorkout();

  const categories = useMemo(() => {
    const seen = new Set();
    for (const ex of exerciseCache) {
      if (ex.category) seen.add(ex.category);
    }
    return Array.from(seen).sort();
  }, [exerciseCache]);

  const filteredExercises = useMemo(() => exerciseCache.filter(ex => {
    const searchTerm = search.toLowerCase();
    const name = (ex.name || '').toLowerCase();
    const category = (ex.category || '').toLowerCase();
    const equipment = (ex.equipment || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm) || category.includes(searchTerm) || equipment.includes(searchTerm);
    const matchesCategory = !selectedCategory || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [exerciseCache, search, selectedCategory]);

  const handleLoadMore = async () => {
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
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={styles.loadingIconWrapper}>
          <ActivityIndicator size="large" color="#00b894" />
        </View>
        <Text style={styles.loadingTitle}>Building Your Library</Text>
        <Text style={styles.loadingText}>Syncing global exercise database...</Text>
      </View>
    );
  }

  if (selectedExercise) {
    const accentColor = getCategoryColor(selectedExercise.category);
    const alreadyAdded = isAlreadyInWorkout(selectedExercise.id);
    return (
      <ScrollView style={[styles.detailContainer, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={[styles.detailHero, { borderBottomColor: accentColor }]}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: accentColor }]}>← Back to list</Text>
          </TouchableOpacity>
          <View style={[styles.detailIconBadge, { backgroundColor: accentColor }]}>
            <Dumbbell color="#fff" size={28} />
          </View>
          <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
          <View style={styles.tagContainer}>
            <View style={[styles.tag, { backgroundColor: accentColor }]}>
              <Text style={styles.tagText}>{selectedExercise.category}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#636e72' }]}>
              <Text style={styles.tagText}>{selectedExercise.equipment}</Text>
            </View>
          </View>
        </View>

        {/* Video Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: hexToRgba('#00b894', 0.12) }]}>
              <VideoIcon color="#00b894" size={18} />
            </View>
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

        {/* Instructions Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: hexToRgba('#0984e3', 0.12) }]}>
              <Info color="#0984e3" size={18} />
            </View>
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.instructionText}>{selectedExercise.instructions || 'No detailed instructions available.'}</Text>
        </View>

        {/* Add to Workout Button */}
        {activeWorkout && (
          <TouchableOpacity
            style={[styles.addButtonLarge, alreadyAdded ? styles.addedButton : { backgroundColor: accentColor }]}
            onPress={() => handleAdd(selectedExercise)}
          >
            <Flame color="#fff" size={22} />
            <Text style={styles.addButtonText}>
              {alreadyAdded ? 'ALREADY IN WORKOUT' : 'ADD TO WORKOUT'}
            </Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Exercise Library</Text>
          <Text style={styles.screenSubtitle}>{exerciseCache.length} exercises available</Text>
        </View>
        <View style={styles.headerBadge}>
          <Dumbbell color="#fff" size={20} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchHeader}>
          <Search color="#00b894" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises, muscle groups..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#b2bec3"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X color="#b2bec3" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            const color = getCategoryColor(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setSelectedCategory(active ? null : cat)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Exercise List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredExercises.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Dumbbell color="#b2bec3" size={40} />
            </View>
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptySubtitle}>
              {search.length > 0
                ? `No local matches for "${search}"`
                : 'Try adjusting your filters'}
            </Text>
          </View>
        )}

        {filteredExercises.map((ex) => {
          const accent = getCategoryColor(ex.category);
          return (
            <TouchableOpacity
              key={ex.id}
              style={styles.exerciseCard}
              onPress={() => setSelectedExercise(ex)}
              activeOpacity={0.75}
            >
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{ex.name}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.categoryDot, { backgroundColor: accent }]} />
                    <Text style={styles.cardSub}>{ex.category}</Text>
                    <Text style={styles.cardDot}>·</Text>
                    <Text style={styles.cardSub}>{ex.equipment}</Text>
                  </View>
                </View>
                <View style={[styles.cardIconWrapper, { backgroundColor: hexToRgba(accent, 0.12) }]}>
                  <Dumbbell color={accent} size={20} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          {filteredExercises.length > 0 && (
            <Text style={styles.footerText}>
              Showing <Text style={styles.footerCount}>{filteredExercises.length}</Text> of {exerciseCache.length} exercises
            </Text>
          )}
          <TouchableOpacity
            style={[styles.loadMoreButton, search.length > 0 && styles.targetedButton]}
            onPress={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <ActivityIndicator color={search.length > 0 ? '#fff' : '#00b894'} />
            ) : (
              <>
                {search.length > 0 ? <Globe color="#fff" size={18} /> : <ChevronDown color="#00b894" size={18} />}
                <Text style={[styles.loadMoreText, search.length > 0 && styles.targetedText]}>
                  {search.length > 0 ? `Search Internet for "${search}"` : 'Load More Exercises'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

  // Loading State
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f2f5' },
  loadingIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,184,148,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loadingTitle: { fontSize: 22, fontWeight: '900', color: '#2d3436', marginBottom: 6 },
  loadingText: { color: '#636e72', fontWeight: '600', fontSize: 14 },

  // Screen Header
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  screenTitle: { fontSize: 26, fontWeight: '900', color: '#2d3436' },
  screenSubtitle: { fontSize: 13, color: '#636e72', fontWeight: '600', marginTop: 2 },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00b894', justifyContent: 'center', alignItems: 'center', elevation: 4 },

  // Search Bar
  searchBarWrapper: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  searchHeader: {
    backgroundColor: '#f0f2f5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#2d3436' },

  // Category Filters
  filterRow: { paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dfe6e9',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#00b894', borderColor: '#00b894' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#636e72' },
  filterChipTextActive: { color: '#fff' },

  // Exercise List
  listContainer: { paddingHorizontal: 15, paddingTop: 8, paddingBottom: 20 },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  cardInfo: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#2d3436' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  categoryDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  cardSub: { fontSize: 12, color: '#636e72', fontWeight: '600' },
  cardDot: { color: '#b2bec3', marginHorizontal: 5, fontSize: 12 },
  cardIconWrapper: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f2f6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2d3436', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#636e72', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },

  // Footer
  footer: { paddingVertical: 20, alignItems: 'center' },
  footerText: { color: '#b2bec3', fontSize: 12, marginBottom: 14, fontWeight: '600' },
  footerCount: { color: '#00b894', fontWeight: '900' },
  loadMoreButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 2, borderColor: '#00b894', borderStyle: 'dashed' },
  loadMoreText: { color: '#00b894', fontWeight: '800', marginLeft: 8, fontSize: 14 },
  targetedButton: { backgroundColor: '#0984e3', borderColor: '#0984e3', borderStyle: 'solid', width: '100%', justifyContent: 'center' },
  targetedText: { color: '#fff' },

  // Detail View
  detailContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  detailHero: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 3,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 15, fontWeight: '700' },
  detailIconBadge: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  detailTitle: { fontSize: 26, fontWeight: '900', color: '#2d3436', marginBottom: 12 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },

  // Section Cards
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIconBadge: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#2d3436' },

  // Video
  videoWrapper: { width: '100%', height: 210, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoPlayer: { width: '100%', height: '100%' },
  videoLoader: { position: 'absolute', zIndex: 1, alignItems: 'center' },
  videoLoaderText: { color: '#fff', fontSize: 12, marginTop: 10 },

  // Instructions
  instructionText: { fontSize: 15, lineHeight: 26, color: '#444' },

  // Add Button
  addButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    gap: 10,
  },
  addedButton: { backgroundColor: '#2d3436' },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
