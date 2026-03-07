import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [timer, setTimer] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: '',
    weight: '',
    height: '',
    goal: '',
  });

  // Load data on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('@workout_history');
        const storedProfile = await AsyncStorage.getItem('@user_profile');
        if (storedHistory) setWorkoutHistory(JSON.parse(storedHistory));
        if (storedProfile) setUserProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Failed to load local storage', e);
      }
    };
    loadData();
  }, []);

  // Save history when it changes
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem('@workout_history', JSON.stringify(workoutHistory));
      } catch (e) {
        console.error('Failed to save history', e);
      }
    };
    saveHistory();
  }, [workoutHistory]);

  // Save profile when it changes
  const updateProfile = async (newProfile) => {
    try {
      setUserProfile(newProfile);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  };

  useEffect(() => {
    let interval;
    if (activeWorkout) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const startWorkout = () => {
    setActiveWorkout({
      startTime: new Date(),
      exercises: [],
    });
    setTimer(0);
  };

  const endWorkout = () => {
    if (activeWorkout) {
      const completedWorkout = {
        ...activeWorkout,
        endTime: new Date(),
        duration: timer,
      };
      setWorkoutHistory([completedWorkout, ...workoutHistory]);
      setActiveWorkout(null);
    }
  };

  const addExerciseToWorkout = (exercise) => {
    if (activeWorkout) {
      setActiveWorkout({
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, { ...exercise }],
      });
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        workoutHistory,
        timer,
        userProfile,
        startWorkout,
        endWorkout,
        addExerciseToWorkout,
        updateProfile,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
