import { createStackNavigator } from "@react-navigation/stack";
import { useMyContextProvider } from "../index";
import { Text } from "react-native-paper";
import { Menu, MenuTrigger, MenuOption, MenuOptions } from "react-native-popup-menu";
import { Alert, Image, TouchableOpacity } from "react-native";
import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseconfig';
import OrderDetail from '../admin/OrderDetail';
import Appointadmin from '../admin/Appointadmin';

const Stack = createStackNavigator();

const Routerapp = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    
    //đây là router của admin
    //đây là thanh ở trên của admin
    return (
        <Stack.Navigator
            initialRouteName="Appointadmin"
            screenOptions={{
                
                headerStyle: {
                    backgroundColor: "orange"
                },
                
            }}
        >
            <Stack.Screen name="Appointadmin" component={Appointadmin} options={{
                headerShown: false
            }}/>
            <Stack.Screen name="OrderDetail" component={OrderDetail} options={({ navigation }) => ({
            title: "Chi tiết đơn hàng",
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => {
                        // Reset navigation state to Appointadmin
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Appointadmin' }],
                        });
                    }}
                    style={{ padding: 10 }}
                >
                    <Image 
                        source={require('../assets/back.png')} 
                        style={{ width: 25, height: 25, marginLeft: 10 }} 
                    />
                </TouchableOpacity>
            ), })}/>
        </Stack.Navigator>
    )
}

export default Routerapp;