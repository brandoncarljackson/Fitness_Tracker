import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

const CACHE_EXPIRY_DAYS = 14;
const SYNC_BATCH_SIZE = 200;
const TOTAL_SYNC_LIMIT = 1000;

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [exerciseCache, setExerciseCache] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', weight: '', height: '', goal: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('@workout_history');
        const storedProfile = await AsyncStorage.getItem('@user_profile');
        const storedCache = await AsyncStorage.getItem('@exercise_cache');
        const lastAccess = await AsyncStorage.getItem('@cache_last_access');

        if (storedHistory) setWorkoutHistory(JSON.parse(storedHistory));
        if (storedProfile) setUserProfile(JSON.parse(storedProfile));

        let cache = storedCache ? JSON.parse(storedCache) : [];
        const now = new Date();

        if (lastAccess) {
          const diffDays = Math.ceil(Math.abs(now - new Date(lastAccess)) / (1000 * 60 * 60 * 24));
          if (diffDays > CACHE_EXPIRY_DAYS) cache = [];
        }

        if (cache.length < 50) {
          await performDeepSync();
        } else {
          setExerciseCache(cache);
          await AsyncStorage.setItem('@cache_last_access', now.toISOString());
        }
      } catch (e) {
        console.error('Failed to load local storage', e);
      }
    };
    loadData();
  }, []);

  const mapExercise = (item) => ({
    id: String(item.id),
    name: item.name || 'Unknown Exercise',
    category: item.category ? (typeof item.category === 'object' ? item.category.name : item.category) : 'General',
    equipment: item.equipment && item.equipment.length > 0 ? item.equipment[0].name : 'No equipment',
    instructions: item.description ? item.description.replace(/<[^>]*>?/gm, '') : 'No instructions available.',
    // Using a more reliable sample video URL
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  });

  const performDeepSync = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    let allFetched = [];
    try {
      for (let offset = 0; offset < TOTAL_SYNC_LIMIT; offset += SYNC_BATCH_SIZE) {
        const response = await fetch(`https://wger.de/api/v2/exerciseinfo/?language=2&limit=${SYNC_BATCH_SIZE}&offset=${offset}`);
        const data = await response.json();
        if (data.results) {
          allFetched = [...allFetched, ...data.results.map(mapExercise)];
        }
        if (!data.next) break;
      }

      setExerciseCache(allFetched);
      await AsyncStorage.setItem('@exercise_cache', JSON.stringify(allFetched));
      await AsyncStorage.setItem('@cache_last_access', new Date().toISOString());
    } catch (error) {
      console.error('Deep sync failed', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreFromInternet = async (query = '') => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      // Use broader search endpoint for fuzzy matching
      const response = await fetch(`https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(query)}`);
      const searchData = await response.json();

      if (searchData.suggestions) {
        // Broad search gives suggestions with base IDs, we fetch details for the top few
        const detailPromises = searchData.suggestions.slice(0, 10).map(async (s) => {
          const detailRes = await fetch(`https://wger.de/api/v2/exerciseinfo/${s.data.id}/?language=2`);
          if (detailRes.ok) return detailRes.json();
          return null;
        });

        const details = (await Promise.all(detailPromises)).filter(d => d !== null);
        const newItems = details.map(mapExercise);

        setExerciseCache(prev => {
          const updated = [...prev, ...newItems];
          const unique = updated.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          AsyncStorage.setItem('@exercise_cache', JSON.stringify(unique));
          return unique;
        });
      }
    } catch (error) {
      console.error('Internet search failed', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const updateProfile = async (newProfile) => {
    setUserProfile(newProfile);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
  };

  const startWorkout = () => { setActiveWorkout({ startTime: new Date(), exercises: [] }); setTimer(0); };
  const endWorkout = () => {
    if (activeWorkout) {
      const completed = { ...activeWorkout, endTime: new Date(), duration: timer };
      const newHistory = [completed, ...workoutHistory];
      setWorkoutHistory(newHistory);
      AsyncStorage.setItem('@workout_history', JSON.stringify(newHistory));
      setActiveWorkout(null);
    }
  };

  const addExerciseToWorkout = (exercise) => {
    if (activeWorkout) {
      setActiveWorkout(prev => ({ ...prev, exercises: [...prev.exercises, exercise] }));
    }
  };

  useEffect(() => {
    let interval;
    if (activeWorkout) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        workoutHistory,
        exerciseCache,
        timer,
        userProfile,
        isLoadingMore,
        startWorkout,
        endWorkout,
        addExerciseToWorkout,
        updateProfile,
        loadMoreFromInternet,
        performDeepSync
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
