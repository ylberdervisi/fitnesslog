import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise } from '../types';

// Et sett som er logget i den pågående økten, men ikke skrevet til DB ennå.
type PendingSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
};

type ExerciseDbRow = {
  id: string;
  name: string;
  muscle_group: string;
};

export default function LogWorkoutScreen() {
  const db = useSQLiteContext();

  // Alle øvelser — brukes for å velge i modalen.
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Sett som er lagt til i denne pågående økten (lever i state, ikke DB).
  const [currentSets, setCurrentSets] = useState<PendingSet[]>([]);

  // Modal-state.
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');

  // Last øvelser én gang ved mount — samme mønster som ExercisesScreen.
  useEffect(() => {
    async function load() {
      const rows = await db.getAllAsync<ExerciseDbRow>(
        'SELECT id, name, muscle_group FROM exercises ORDER BY name'
      );
      
      setExercises(
        rows.map((r) => ({ id: r.id, name: r.name, muscleGroup: r.muscle_group }))
      );
    }
    load();
  }, []);

  function handleAddSet() {
    // TODO (3a):
    // 1. Sjekk at selectedExerciseId, weightInput og repsInput er fylt ut.
    //    Hvis noe mangler eller er ugyldig, return uten å gjøre noe.
    // 2. Konverter weightInput til tall med parseFloat(), repsInput med parseInt().
    //    Bruk Number.isFinite(...) for å sjekke at de er gyldige tall.
    // 3. Finn øvelsen i exercises-listen for å hente navnet (vi viser det i lista).
    // 4. Lag et nytt PendingSet-objekt:
    //      - id: Date.now().toString()
    //      - exerciseId: selectedExerciseId
    //      - exerciseName: øvelsens navn
    //      - weight: parsed weight
    //      - reps: parsed reps
    // 5. Append til currentSets med spread-operatoren.
    // 6. Tøm weight og reps-feltene (la selectedExerciseId stå — vanlig å legge til
    //    flere sett av samme øvelse etter hverandre).
    if(!selectedExerciseId || !weightInput.trim() || !repsInput.trim()) {
      Alert.alert('Vekt/Reps må fylles ut');
      return;
    }

    const parsedWeightInput = parseFloat(weightInput);
    const parsedRepsInput = parseInt(repsInput);

    if (!Number.isFinite(parsedWeightInput) || !Number.isFinite(parsedRepsInput)) {
      return;
    }

    const exercise = exercises.find((e) => e.id === selectedExerciseId);
    if(!exercise) return;
    
    const newSet: PendingSet = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: parsedWeightInput,
      reps: parsedRepsInput
    };

    setCurrentSets([...currentSets, newSet]);
    setWeightInput('');
    setRepsInput('');
  }

  function handleRemoveSet(id: string) {
    setCurrentSets(currentSets.filter((s) => s.id !== id));
  }

  async function handleSaveWorkout() {
    if (currentSets.length === 0) {
      Alert.alert('Ingen sett', 'Legg til minst ett sett før du lagrer økten.');
      return;
    }

    const workoutId = Date.now().toString();
    const createdAt = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {

        await db.runAsync(
          'INSERT INTO workouts (id, created_at) VALUES (?, ?)',
          [workoutId, createdAt]
        );

        for (let i = 0; i < currentSets.length; i++) {
          const set = currentSets[i];

          await db.runAsync(
            `INSERT INTO workout_sets (id, workout_id, exercise_id, weight, reps, set_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [workoutId + '_' + i, workoutId, set.exerciseId, set.weight, set.reps, i]
          );
        }
      });


      setCurrentSets([]);
      Alert.alert('Lagret', `Økt med ${currentSets.length} sett er lagret.`);
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Feil', String(e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateHeader}>
        {new Date().toLocaleDateString('nb-NO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </Text>

      {currentSets.length === 0 ? (
        <Text style={styles.emptyText}>Ingen sett logget ennå.</Text>
      ) : (
        <FlatList
          data={currentSets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleRemoveSet(item.id)}
              delayLongPress={600}
              style={styles.setRow}
            >
              <Text style={styles.setExercise}>{item.exerciseName}</Text>
              <Text style={styles.setDetails}>
                {item.weight} kg × {item.reps} reps
              </Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Legg til sett</Text>
      </Pressable>

      <Pressable
        style={[
          styles.saveButton,
          currentSets.length === 0 && styles.saveButtonDisabled,
        ]}
        onPress={handleSaveWorkout}
        disabled={currentSets.length === 0}
      >
        <Text style={styles.saveButtonText}>Lagre økt</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nytt sett</Text>

            <Text style={styles.label}>Øvelse</Text>
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              style={styles.exercisePicker}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.pickerRow,
                    selectedExerciseId === item.id && styles.pickerRowSelected,
                  ]}
                  onPress={() => setSelectedExerciseId(item.id)}
                >
                  <Text>{item.name}</Text>
                </Pressable>
              )}
            />

            <Text style={styles.label}>Vekt (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="f.eks. 80"
            />

            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              placeholder="f.eks. 8"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Lukk"
                onPress={() => setModalVisible(false)}
                color="#888"
              />
              <Button title="Legg til" onPress={handleAddSet} />
            </View>
          </View>
        </View>
      </Modal>
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
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3a5c',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  setRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  setExercise: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  setDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2d8f4e',
    paddingVertical: 14,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a8c9b3',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  exercisePicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  pickerRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerRowSelected: {
    backgroundColor: '#e6eef6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
