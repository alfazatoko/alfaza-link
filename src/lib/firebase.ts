import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaEk_2oZkqQE49XzyEjMf1W0ohko74bbY",
  authDomain: "alfazatrend.firebaseapp.com",
  databaseURL: "https://alfazatrend-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alfazatrend",
  storageBucket: "alfazatrend.firebasestorage.app",
  messagingSenderId: "387772626852",
  appId: "1:387772626852:web:a7e60cb0eec6e96fb6b331"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
