import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MyContextControllerProvider } from './index';
import Router from './router_admin/Router';
import { MenuProvider } from 'react-native-popup-menu';

const App = () => {
  return (
    <MyContextControllerProvider>
      <MenuProvider>
        <NavigationContainer>
          <Router />
        </NavigationContainer>
      </MenuProvider>
    </MyContextControllerProvider>
  );
};

export default App;
