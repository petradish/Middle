import React from 'react';
import { AntDesign } from '@expo/vector-icons';

import Colors from '../constants/Colors';

export default function TabBarIcon(props) {
  return (
    <AntDesign
      name={props.name}
      size={25}
      style={{ marginBottom: -2 }}
      color={props.focused ? Colors.tabIconSelected : Colors.tabIconDefault}
    />
  );
}
