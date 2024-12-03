import {createStackNavigator} from "@react-navigation/stack"
import Login from "../admin/Login"
import Admin from "./Admin"
import ForgotPassword from "../admin/ForgotPassword"

const Stack = createStackNavigator()

const Router = () =>{
    return(
        <Stack.Navigator
            
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="Login" component={Login}/>
            <Stack.Screen name="Admin" component={Admin}/>
            <Stack.Screen name="ForgotPassword" component={ForgotPassword}/>
            
            
        </Stack.Navigator>
    )
}

export default Router;