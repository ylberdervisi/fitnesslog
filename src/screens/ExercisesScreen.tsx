import { useState } from 'react';
import {
  Button,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

const INITIAL_EXERCISES: Exercise[] = [
  { id: '1', name: 'Knebøy', muscleGroup: 'Bein' },
  { id: '2', name: 'Benkpress', muscleGroup: 'Bryst' },
  { id: '3', name: 'Markløft', muscleGroup: 'Rygg' },
  { id: '4', name: 'Skulderpress', muscleGroup: 'Skulder' },
  { id: '5', name: 'Pull-ups', muscleGroup: 'Rygg' },
  { id: '6', name: 'Bicep curl', muscleGroup: 'Armer' },
  { id: '7', name: 'Tricep dips', muscleGroup: 'Armer' },
  { id: '8', name: 'Utfall', muscleGroup: 'Bein' },
  { id: '9', name: 'Rows', muscleGroup: 'Rygg' },
  { id: '10', name: 'Planke', muscleGroup: 'Kjerne' },
];

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [muscleGroupInput, setMuscleGroupInput] = useState('');

  function handleSave() {
    // TODO:
    // 1. Hvis nameInput er tom (eller bare whitespace), returner uten å gjøre noe.
    // 2. Lag et nytt Exercise-objekt med:
    //      - id: Date.now().toString()
    //      - name: nameInput.trim()
    //      - muscleGroup: muscleGroupInput.trim() — hvis tomt, sett 'Annet'
    // 3. Oppdater exercises-listen ved å legge til det nye objektet til SLUTTEN.
    //    Husk: ikke muter — bruk spread-operatoren.
    // 4. Tøm input-feltene (sett dem til tom string).
    // 5. Lukk modalen.
    if(!nameInput.trim()) {
        return;
    }

    const newExerciseGroup = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      muscleGroup: muscleGroupInput.trim() !== '' ? muscleGroupInput.trim() : 'Annet'
    }

    setExercises([...exercises, newExerciseGroup]);
    setNameInput('')    
    setMuscleGroupInput('')
    setModalVisible(false)
  }

  function handleCancel() {
    setNameInput('');
    setMuscleGroupInput('');
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Legg til øvelse</Text>
      </Pressable>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.muscleGroup}>{item.muscleGroup}</Text>
          </View>
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
