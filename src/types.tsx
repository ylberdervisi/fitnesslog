export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

export type Workout = {
  id: string;
  createdAt: string; // ISO-streng fra new Date().toISOString()
  setCount: number;
  exerciseNames: string[];
};

export type WorkoutSet = {
  id: string;
  workoutId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  setOrder: number;
};