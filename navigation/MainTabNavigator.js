import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
// import MapScreen from '../screens/MapScreen';
// import DirectionScreen from '../screens/DirectionScreen';

const config = Platform.select({
  web: { headerMode: 'screen' },
  default: {},
});

const HomeStack = createStackNavigator(
  {
    Home: HomeScreen,
  },
  config
);

HomeStack.navigationOptions = {
  tabBarLabel: 'Me --> Meet',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name='team'
    />
  ),
};

HomeStack.path = '';

// const MapStack = createStackNavigator(
//   {
//     Map: MapScreen,
//   },
//   config
// );

// MapStack.navigationOptions = {
//   tabBarLabel: 'Meet',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon focused={focused} name='team' />
//   ),
// };

// MapStack.path = '';

// const DirectionStack = createStackNavigator(
//   {
//     Directions: DirectionScreen,
//   },
//   config
// );

// DirectionStack.navigationOptions = {
//   tabBarLabel: 'Me -> Meet -> ETA',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon focused={focused} name='clockcircleo'/>
//   ),
// };

// DirectionStack.path = '';

const tabNavigator = createBottomTabNavigator({
  HomeStack,
  // MapStack,
  // DirectionStack,
});

tabNavigator.path = '';

export default tabNavigator;
