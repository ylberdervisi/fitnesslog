import { StyleSheet, Text, View } from 'react-native';

export default function LogWorkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logg økt</Text>
      <Text style={styles.hint}>Her registrerer du dagens treningsøkt.</Text>
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
