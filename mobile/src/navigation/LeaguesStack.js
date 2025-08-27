import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LeaguesScreen from '../screens/MainTabs/LeaguesScreen';
import LeagueDetailScreen from '../screens/LeagueStack/LeagueDetailScreen';
import CreateLeagueScreen from '../screens/LeagueStack/CreateLeagueScreen';
import JoinLeagueScreen from '../screens/LeagueStack/JoinLeagueScreen';
import StandingsScreen from '../screens/LeagueStack/StandingsScreen';
import AuctionScreen from '../screens/AuctionStack/AuctionScreen';
import { COLORS } from '../../../shared/constants/app';

const Stack = createStackNavigator();

export default function LeaguesStack() {
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
        name="Leagues" 
        component={LeaguesScreen}
        options={{ title: 'My Leagues' }}
      />
      <Stack.Screen 
        name="LeagueDetail" 
        component={LeagueDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.leagueName || 'League Details' 
        })}
      />
      <Stack.Screen 
        name="CreateLeague" 
        component={CreateLeagueScreen}
        options={{ title: 'Create League' }}
      />
      <Stack.Screen 
        name="JoinLeague" 
        component={JoinLeagueScreen}
        options={{ title: 'Join League' }}
      />
      <Stack.Screen 
        name="Standings" 
        component={StandingsScreen}
        options={{ title: 'Standings' }}
      />
      <Stack.Screen 
        name="Auction" 
        component={AuctionScreen}
        options={{ title: 'Auction Room' }}
      />
    </Stack.Navigator>
  );
}
