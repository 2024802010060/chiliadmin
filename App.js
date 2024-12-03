import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MyContextControllerProvider } from './index';
import Router from './router_admin/Router';
// Import Firebase cho web với cú pháp mới
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { MenuProvider } from 'react-native-popup-menu';
import { firestore as db, auth } from './firebaseconfig';
import { Provider as PaperProvider } from 'react-native-paper';

const App = () => {
  const admin = {
    fullName: "Admin",
    email: "admin@gmail.com",
    password: "123456",
    phone: "0912685449",
    address: "Bình Dương",
    role: "admin" 
  };

  useEffect(() => {
    const adminRef = doc(db, "ADMIN", admin.email);
    
    const unsubscribe = onSnapshot(adminRef, (docSnap) => {
      if (!docSnap.exists()) {
        createUserWithEmailAndPassword(auth, admin.email, admin.password)
          .then(response => {
            setDoc(adminRef, admin);
            console.log("Add new account admin");
          });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <PaperProvider>
      <MyContextControllerProvider>
        <MenuProvider>
          <NavigationContainer>
            <Router />
          </NavigationContainer>
        </MenuProvider>
      </MyContextControllerProvider>
    </PaperProvider>
  );
};

export default App;
