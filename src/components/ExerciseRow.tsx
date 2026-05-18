import { StyleSheet, Text, View } from 'react-native';
import {Exercise} from '../types';

type ExerciseRowProps = {
  exercise: Exercise;
};

export default function ExerciseRow({ exercise }: ExerciseRowProps) {
    return (
        <View>        
                <View>
                    <Text>{exercise.name}</Text>
                </View>
        </View>
    );
}