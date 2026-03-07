import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

const CACHE_EXPIRY_DAYS = 14;
const INITIAL_FETCH_LIMIT = 500; // Increased to catch common exercises like Bench Press
const SEARCH_LIMIT = 50;

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
          if (diffDays > CACHE_EXPIRY_DAYS) {
            console.log('Cache expired, clearing...');
            cache = [];
          }
        }

        if (cache.length === 0) {
          await fetchInitialExercises();
        } else {
          console.log(`App: Loaded ${cache.length} exercises from cache.`);
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
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  });

  const fetchInitialExercises = async () => {
    try {
      console.log(`App: Performing initial sync (${INITIAL_FETCH_LIMIT} items)...`);
      const response = await fetch(`https://wger.de/api/v2/exerciseinfo/?language=2&limit=${INITIAL_FETCH_LIMIT}`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      const mappedData = data.results.map(mapExercise);
      setExerciseCache(mappedData);
      await AsyncStorage.setItem('@exercise_cache', JSON.stringify(mappedData));
      await AsyncStorage.setItem('@cache_last_access', new Date().toISOString());
    } catch (error) {
      console.error('Initial fetch failed', error);
    }
  };

  // This function now handles both pagination and targeted search
  const loadMoreFromInternet = async (query = '') => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      let url = `https://wger.de/api/v2/exerciseinfo/?language=2&limit=${SEARCH_LIMIT}`;

      if (query) {
        // If there's a search term, we use the name filter
        console.log(`App: Fetching internet results for "${query}"...`);
        url += `&name=${encodeURIComponent(query)}`;
      } else {
        // Otherwise, we just pull the next offset
        url += `&offset=${exerciseCache.length}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const newItems = data.results.map(mapExercise);

      if (newItems.length === 0 && query) {
         // Fallback to broader term search if name filter is too strict
         console.log('App: No results for name filter, trying broader term search...');
         // (Wger's exerciseinfo name filter is exact-ish, so we might need this in future)
      }

      setExerciseCache(prev => {
        const updated = [...prev, ...newItems];
        const unique = updated.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        AsyncStorage.setItem('@exercise_cache', JSON.stringify(unique));
        return unique;
      });
    } catch (error) {
      console.error('Load more failed', error);
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
    else clearInterval(interval);
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
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
