import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../types';

type ExerciseRowProps = {
  exercise: Exercise;
  // TODO i steg 2: legg til onDelete-callback her
  onDelete: (id: string) => void
};

export default function ExerciseRow({ exercise, onDelete }: ExerciseRowProps) {
  return (
    <Pressable
    delayLongPress={600}
    onLongPress={() => onDelete(exercise.id)}
      style={styles.row}
    >
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  muscleGroup: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
