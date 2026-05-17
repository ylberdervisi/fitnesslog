import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import ExercisesScreen from './src/screens/ExercisesScreen';
import LogWorkoutScreen from './src/screens/LogWorkoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          tabBarActiveTintColor: '#1a3a5c',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen name="Øvelser" component={ExercisesScreen} />
        <Tab.Screen name="Logg økt" component={LogWorkoutScreen} />
        <Tab.Screen name="Historikk" component={HistoryScreen} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
