import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RouterService from "./RouterService";
import Customers from "../admin/Customers";
import Appointadmin from "../admin/Appointadmin";
import Profile from "../admin/Profile";
import { Image } from "react-native";
import Statistics from "../admin/Statistics";
import Routerapp from "./Routerapp";
import Routerpro from "./Routerpro";
import { useMyContextProvider } from "../index";

const Tab = createBottomTabNavigator();

const Admin = () => {
  const [controller] = useMyContextProvider();
  const { userLogin } = controller;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { height: 60 },
        tabBarActiveTintColor: '#FF6600',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="RouterService"
        component={RouterService}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/home.png")}
              style={{ width: 20, height: 20, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Routerapp"
        component={Routerapp}
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/appointment.png")}
              style={{ width: 20, height: 20, tintColor: color }}
            />
          ),
        }}
      />
      
      {(userLogin?.role !== 'user' && userLogin?.role !== null) && (
        <>
          <Tab.Screen
            name="Customers"
            component={Customers}
            options={{
              title: "Khách hàng",
              tabBarIcon: ({ color }) => (
                <Image
                  source={require("../assets/customer.png")}
                  style={{ width: 20, height: 20, tintColor: color }}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Statistics"
            component={Statistics}
            options={{
              title: "Thống kê",
              tabBarIcon: ({ color }) => (
                <Image
                  source={require("../assets/statistics.png")}
                  style={{ width: 20, height: 20, tintColor: color }}
                />
              ),
            }}
          />
        </>
      )}
      
      <Tab.Screen
        name="Routerpro"
        component={Routerpro}
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/account.png")}
              style={{ width: 20, height: 20, tintColor: color }}
            />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
};

export default Admin;
