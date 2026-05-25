import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout, WorkoutSet } from '../types';
import * as Haptics from 'expo-haptics';

// Rad-format fra SQL (snake_case). Mappes til Workout (camelCase) i loadWorkouts.
type WorkoutDbRow = {
  id: string;
  exercise_names: string | null
  created_at: string;
  set_count: number;
};

type SetDbRow = {
  id: string;
  workout_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  set_order: number;
};


export default function HistoryScreen() {
  const db = useSQLiteContext();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [setsByWorkout, setSetsByWorkout] = useState<Record<string, WorkoutSet[]>>({});

  async function loadWorkouts() {
    const query = `
      SELECT 
      w.id, 
      w.created_at, 
      COUNT(ws.id) AS set_count,
      GROUP_CONCAT(DISTINCT e.name) AS exercise_names
      FROM workouts w
      LEFT JOIN workout_sets ws ON ws.workout_id = w.id
      LEFT JOIN exercises e ON e.id = ws.exercise_id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `;

    const rows = await db.getAllAsync<WorkoutDbRow>(query);
    const workouts = rows.map((r) => ({ id: r.id, createdAt: r.created_at, setCount: r.set_count, exerciseNames: r.exercise_names ? r.exercise_names.split(',') : [] }))
    setWorkouts(workouts);

    const setRows = await db.getAllAsync<SetDbRow>(`
      SELECT 
        ws.id, ws.workout_id, ws.weight, ws.reps, ws.set_order,
        e.name AS exercise_name
      FROM workout_sets ws
      JOIN exercises e ON e.id = ws.exercise_id
      ORDER BY ws.workout_id, ws.set_order
    `);

    const grouped: Record<string, WorkoutSet[]> = {};

    for (const r of setRows) {
      const set: WorkoutSet = {
        id: r.id,
        workoutId: r.workout_id,
        exerciseName: r.exercise_name,
        weight: r.weight,
        reps: r.reps,
        setOrder: r.set_order
      }

      if (!grouped[r.workout_id]) {
        grouped[r.workout_id] = [];
      }

      grouped[r.workout_id].push(set);

    }

    setSetsByWorkout(grouped);
  }

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );


  function formatDate(iso: string): string {
    const date = new Date(iso).toLocaleDateString('nb-NO', {
      'day': 'numeric',
      'month': 'short',
      'year': 'numeric'
    });

    return date;
  }

  function deleteHistoryWorkout(workoutId: string) {
    Alert.alert(
      'Slette økt?',
      'Er du sikker på at du vil slette økten?', [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            await db.runAsync('DELETE FROM workouts WHERE id = ?', [workoutId]);
            await loadWorkouts();
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historikk</Text>

      {workouts.length === 0 && (
        <Text style={styles.emptyText}>Ingen økter logget ennå.</Text>
      )}

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onLongPress={() => deleteHistoryWorkout(item.id)}
          >
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.meta}>{item.exerciseNames.join(', ')}</Text>
            <Text style={styles.meta}>{item.setCount} sett</Text>


          {(expandedId === item.id &&
            <View>
              {(setsByWorkout[item.id] ?? []).map((s) => (
                <Text>
                   {s.setOrder + 1}. {s.exerciseName}: <Text style={styles.exerciseRowValue}>{s.weight} kg x {s.reps}</Text>
                </Text>
              ))}
            </View>
          )}

          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a3a5c',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  setsContainer: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#1a3a5c',
  },
  setLine: {
    fontSize: 14,
    color: '#444',
    paddingVertical: 2,
  },
  exerciseRowValue: {
    fontWeight: 600
  }

});
