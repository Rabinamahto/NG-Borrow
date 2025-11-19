import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfZ1qFarQuZxyXz30cNHe69sw0LmUtJi8",
  authDomain: "borrow-f16c7.firebaseapp.com",
  projectId: "borrow-f16c7",
  storageBucket: "borrow-f16c7.appspot.com",
  messagingSenderId: "128538103425",
  appId: "1:128538103425:web:6db2a8fc6714487f584780",
  measurementId: "G-9D3YY5W48F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;