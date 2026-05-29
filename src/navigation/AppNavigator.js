import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useDispatch } from 'react-redux';
import { store, setUser, logout } from '../store';

import { Auth } from '../firebase/config';
import { getUser } from '../services/userService';

import ProfileScreen from '../screens/ProfileScreen';
import RideRequestScreen from '../screens/RideRequestScreen';
import TrackingScreen from '../screens/TrackingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import HistoryScreen from '../screens/HistoryScreen';

import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: '🚗',
  History: '📋',
  Payment: '💳',
  Profile: '👤',
};

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22 },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: COLORS.white, fontSize: 16 },
});

const renderTabIcon = (routeName) => ({ color }) => (
  <Text style={[styles.tabIcon, { color }]}>{TAB_ICONS[routeName]}</Text>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.darkGray,
        borderTopColor: COLORS.lightGray,
        height: 60,
        paddingBottom: 10
      },
      tabBarActiveTintColor: COLORS.green,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarLabel: () => null,
      tabBarIcon: renderTabIcon(route.name),
    })}
  >
    <Tab.Screen name="Home" component={RideRequestScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Payment" component={PaymentScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={MainTabs} />
    <Stack.Screen name="Tracking" component={TrackingScreen} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = Auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await getUser(currentUser.uid);
          dispatch(setUser({ uid: currentUser.uid, email: currentUser.email, ...profile }));
        } catch (error) {
          console.warn('Error cargando usuario:', error.message);
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
};

const AppNavigator = () => (
  <Provider store={store}>
    <RootNavigator />
  </Provider>
);

export default AppNavigator;