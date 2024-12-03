import { createStackNavigator } from "@react-navigation/stack";
import { useMyContextProvider } from "../index";
import { Text } from "react-native-paper";
import { Menu, MenuTrigger, MenuOption, MenuOptions } from "react-native-popup-menu";
import { Alert, Image, TouchableOpacity } from "react-native";
import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseconfig';
import ChangePasswordad from '../admin/ChangePasswordad';
import Profile from '../admin/Profile';
const Stack = createStackNavigator();

const Routerpro = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    
    return (
        <Stack.Navigator
            initialRouteName="Profile"
            screenOptions={{
                headerStyle: {
                    backgroundColor: "orange"
                },
                
            }}
        >
            <Stack.Screen 
                name="Profile" 
                component={Profile} 
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen 
                name="ChangePasswordad" 
                component={ChangePasswordad} 
                options={({ navigation }) => ({
                    title: "Đổi mật khẩu",
                    headerLeft: () => (
                        <TouchableOpacity 
                            onPress={() => {
                                // Reset navigation state to Appointadmin
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Profile' }],
                                });
                            }}
                            style={{ padding: 10 }}
                        >
                            <Image 
                                source={require('../assets/back.png')} 
                                style={{ width: 25, height: 25, marginLeft: 10 }} 
                            />
                        </TouchableOpacity>
                    ), })}
            />
        </Stack.Navigator>
    )
}

export default Routerpro;