// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3nGx6mA9bPuvoA2DG9TEqiHxrzKOO2hc",
  authDomain: "doantn-2a04e.firebaseapp.com",
  projectId: "doantn-2a04e",
  storageBucket: "doantn-2a04e.appspot.com",
  messagingSenderId: "142204929063",
  appId: "1:142204929063:web:057a32bda76156de5e3a02",
  measurementId: "G-QE9G3B1LLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo analytics chỉ khi được hỗ trợ
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
}).catch(e => console.log(e));

// Khởi tạo các dịch vụ Firebase
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Thêm error handling
if (!app) {
    throw new Error('Firebase app initialization failed');
}

if (!firestore) {
    throw new Error('Firestore initialization failed');
}

// Export các instance để sử dụng trong ứng dụng
export { app, auth, firestore, storage };