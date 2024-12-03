import { createStackNavigator } from "@react-navigation/stack";
import { useMyContextProvider } from "../index";
import { Text } from "react-native-paper";
import { Menu, MenuTrigger, MenuOption, MenuOptions } from "react-native-popup-menu";
import { Alert, Image, TouchableOpacity } from "react-native";
import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseconfig';
import Services from '../admin/Services';
import AddNewService from '../admin/AddNewService';
import ServiceUpdate from '../admin/ServiceUpdate';
import OrderDetail from '../admin/OrderDetail';
import ChangePasswordad from '../admin/ChangePasswordad';
import ForgotPassword from '../admin/ForgotPassword';   

const Stack = createStackNavigator();

const RouterService = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    
    //đây là router của admin
    //đây là thanh ở trên của admin
    return (
        <Stack.Navigator
            initialRouteName="Services"
            screenOptions={{
                headerStyle: {
                    backgroundColor: "orange"
                },
                
            }}
        >
            <Stack.Screen 
        options={{headerLeft: null, title: (userLogin != null) && (userLogin.fullName)}} 
        name="Services" component={Services} />
        <Stack.Screen 
        name="AddNewService" 
        component={AddNewService} 
        options={({ navigation }) => ({
            title: "Thêm mới sản phẩm",
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{ padding: 10 }}
                >
                    <Image 
                        source={require('../assets/back.png')} 
                        style={{ width: 25, height: 25, marginLeft: 10 }} 
                    />
                </TouchableOpacity>
            ),
        })}
        />
        <Stack.Screen name="ServiceUpdate" component={ServiceUpdate} options={({ navigation }) => ({
            title: "Cập nhật sản phẩm" ,
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{ padding: 10 }}
                >
                    <Image 
                        source={require('../assets/back.png')} 
                        style={{ width: 25, height: 25, marginLeft: 10 }} 
                    />
                </TouchableOpacity>
            ),
            })}/>
        
        </Stack.Navigator>
        
        
    )
}

export default RouterService;
