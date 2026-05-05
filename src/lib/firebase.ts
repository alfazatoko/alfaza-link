import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWLJbjFCpEsxNY8l6a-9cCDBR9E4vG-Ww",
  authDomain: "alfazalink-ecb76.firebaseapp.com",
  projectId: "alfazalink-ecb76",
  storageBucket: "alfazalink-ecb76.firebasestorage.app",
  messagingSenderId: "358049561649",
  appId: "1:358049561649:web:6334d4f0ca22a4ef452910"
};

const app = initializeApp(firebaseConfig);

// Firestore dengan offline persistence — data tersimpan di IndexedDB
// Otomatis sync saat internet kembali, support multi-tab
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
