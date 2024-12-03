import { createContext, useContext, useMemo, useReducer } from "react";
import { Alert } from "react-native";
import { auth, firestore } from './firebaseconfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const MyContext = createContext();
MyContext.displayName = "ChiliChicken";

const reducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_SUCCESS":
            return { ...state, userLogin: action.payload };
        case "LOGIN_ERROR":
            return { ...state, error: action.payload };
        case "LOGOUT":
            return { ...state, userLogin: null };
        default:
            throw new Error("Action không tồn tại");
    }
};

const MyContextControllerProvider = ({ children }) => {
    const initialState = {
        userLogin: null,
        services: [],
    };
    const [controller, dispatch] = useReducer(reducer, initialState);
    const value = useMemo(() => [controller, dispatch], [controller]);
    return (
        <MyContext.Provider value={value}>
            {children}
        </MyContext.Provider>
    );
};

function useMyContextProvider() {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error("useMyContextProvider phải được sử dụng trong MyContextControllerProvider");
    }
    return context;
}

const login = async (dispatch, email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get additional user data from Firestore
        const userDoc = doc(firestore, "USERS", email);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            dispatch({ type: "LOGIN_SUCCESS", payload: userData });
        } else {
            throw new Error("User data not found");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Lỗi đăng nhập", error.message);
        dispatch({ type: "LOGIN_ERROR", payload: error.message });
    }
};

export {
    MyContextControllerProvider,
    useMyContextProvider,
    login,
};