import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWLJbjFCpEsxNY8l6a-9cCDBR9E4vG-Ww",
  authDomain: "alfazalink-ecb76.firebaseapp.com",
  projectId: "alfazalink-ecb76",
  storageBucket: "alfazalink-ecb76.firebasestorage.app",
  messagingSenderId: "358049561649",
  appId: "1:358049561649:web:6334d4f0ca22a4ef452910",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
