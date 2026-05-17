import { StyleSheet, Text, View } from 'react-native';

export default function ExercisesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Øvelser</Text>
      <Text style={styles.hint}>Liste over øvelser kommer her.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
});
