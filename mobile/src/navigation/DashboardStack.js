import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../screens/MainTabs/DashboardScreen';
import { COLORS } from '../../../shared/constants/app';

const Stack = createStackNavigator();

export default function DashboardStack() {
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
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
}
