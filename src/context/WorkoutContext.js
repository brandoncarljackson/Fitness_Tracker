import React, { createContext, useState, useEffect, useContext } from 'react';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [timer, setTimer] = useState(0);

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
        exercises: [...activeWorkout.exercises, { ...exercise, sets: [] }],
      });
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        workoutHistory,
        timer,
        startWorkout,
        endWorkout,
        addExerciseToWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
