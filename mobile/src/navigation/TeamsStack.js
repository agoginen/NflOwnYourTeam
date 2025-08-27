import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import TeamsScreen from '../screens/MainTabs/TeamsScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import { COLORS } from '../../../shared/constants/app';

const Stack = createStackNavigator();

export default function TeamsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="Teams" 
        component={TeamsScreen}
        options={{ title: 'NFL Teams' }}
      />
      <Stack.Screen 
        name="TeamDetail" 
        component={TeamDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.teamName || 'Team Details' 
        })}
      />
    </Stack.Navigator>
  );
}
