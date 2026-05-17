import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FITNESSLOG</Text>
      <Text style={styles.subTitle}>Bygget av Ylber Dervisi</Text>
      <Text>{new Date().toLocaleDateString('nb-NO', {day: 'numeric', month: 'long', year: 'numeric'})}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#000',
    fontSize: 25,

  },
  subTitle: {
    color: '#2d2d2dff',
    fontSize: 15
  }
});
