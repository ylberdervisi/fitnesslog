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
import ExerciseRow from '../components/ExerciseRow';
import { Exercise } from '../types';

// Rad-format fra SQL (snake_case) — mapppes til Exercise (camelCase) når vi leser.
type ExerciseDbRow = {
  id: string;
  name: string;
  muscle_group: string;
};

export default function ExercisesScreen() {
  const db = useSQLiteContext();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [muscleGroupInput, setMuscleGroupInput] = useState('');
  const [search, setSearch] = useState('');

  async function loadExercises() {
    const rows = await db.getAllAsync<ExerciseDbRow>(
      'SELECT id, name, muscle_group FROM exercises ORDER BY name'
    );
    setExercises(
      rows.map((r) => ({ id: r.id, name: r.name, muscleGroup: r.muscle_group }))
    );
  }

  useEffect(() => {
    loadExercises(); 
  }, [])

  async function handleSave() {
    if (!nameInput.trim()) {
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      muscleGroup: muscleGroupInput.trim() !== '' ? muscleGroupInput.trim() : 'Annet',
    };

    // TODO (steg 3c):
    // 1. Sett INSERT inn i databasen:
    //      await db.runAsync(
    //        'INSERT INTO exercises (id, name, muscle_group) VALUES (?, ?, ?)',
    //        [newExercise.id, newExercise.name, newExercise.muscleGroup]
    //      );
    // 2. Last listen på nytt med await loadExercises() — så vi viser
    //    nøyaktig det som er i databasen.
    // 3. Tøm input-feltene og lukk modalen (som før).

    await db.runAsync(
      'INSERT INTO exercises (id, name, muscle_group) VALUES (?, ?, ?)',
      [newExercise.id, newExercise.name, newExercise.muscleGroup]
    );

    await loadExercises();

    setNameInput('');
    setMuscleGroupInput('');
    setModalVisible(false);
  }

  function handleCancel() {
    setNameInput('');
    setMuscleGroupInput('');
    setModalVisible(false);
  }

  function handleDelete(id: string) {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise) return;

    Alert.alert(
      'Slett øvelse?',
      `Er du sikker på at du vil slette "${exercise.name}"?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
            await loadExercises();
          },
        },
      ]
    );
  }

  const filteredExercises = exercises.filter((exercise) =>
  exercise.name.toLowerCase().includes(search.toLowerCase())
);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Legg til øvelse</Text>
      </Pressable>

      <TextInput 
        style=""
        placeholder='Søk etter øvelse...'
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseRow exercise={item} onDelete={handleDelete} />

        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCancel}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ny øvelse</Text>

            <TextInput
              style={styles.input}
              placeholder="Navn (f.eks. Hip thrust)"
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />

            <TextInput
              style={styles.input}
              placeholder="Muskelgruppe (f.eks. Bein)"
              value={muscleGroupInput}
              onChangeText={setMuscleGroupInput}
            />

            <View style={styles.modalButtons}>
              <Button title="Avbryt" onPress={handleCancel} color="#888" />
              <Button title="Lagre" onPress={handleSave} />
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
  },
  addButton: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginHorizontal: 16,
    marginBottom: 8
  },
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
