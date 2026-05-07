import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import type { UserRecord } from "./firestore";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  firebaseLoading: boolean;
  user: UserRecord | null;
  shift: string | null;
  loginTime: string | null;
  login: (user: UserRecord, shift: string, serverAbsenTime?: string) => void;
  logout: () => void;
  firebaseLogin: (email: string, password: string) => Promise<void>;
  firebaseRegister: (email: string, password: string) => Promise<void>;
  firebaseLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [user, setUser] = useState<UserRecord | null>(() => {
    const stored = localStorage.getItem("alfaza_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [shift, setShift] = useState<string | null>(() => localStorage.getItem("alfaza_shift"));
  const [loginTime, setLoginTime] = useState<string | null>(() => localStorage.getItem("alfaza_login_time"));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setFirebaseLoading(false);
      
      const storedUser = localStorage.getItem("alfaza_user");
      const storedShift = localStorage.getItem("alfaza_shift");
      const storedShiftDate = localStorage.getItem("alfaza_shift_date");
      const storedLoginTime = localStorage.getItem("alfaza_login_time");
      
      // Check if shift is from today
      const today = new Date().toISOString().split('T')[0];
      if (storedShift && storedShiftDate === today) {
        setShift(storedShift);
      } else {
        setShift(null);
        localStorage.removeItem("alfaza_shift");
        localStorage.removeItem("alfaza_shift_date");
      }

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedLoginTime) setLoginTime(storedLoginTime);
    });
    return () => unsubscribe();
  }, []);

  const login = (newUser: UserRecord, newShift: string, serverAbsenTime?: string) => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const s = now.getSeconds().toString().padStart(2, "0");
    const timeStr = serverAbsenTime || `${h}:${m}:${s}`;
    const today = now.toISOString().split('T')[0];

    setUser(newUser);
    setShift(newShift);
    setLoginTime(timeStr);
    
    localStorage.setItem("alfaza_user", JSON.stringify(newUser));
    localStorage.setItem("alfaza_shift", newShift);
    localStorage.setItem("alfaza_shift_date", today);
    localStorage.setItem("alfaza_login_time", timeStr);
  };

  const logout = () => {
    setUser(null);
    // Kita TIDAK menghapus shift di sini agar "Shift" tetap diingat di perangkat ini untuk hari yang sama.
    // Shift hanya akan dihapus jika ganti hari (cek di useEffect initialization).
    setLoginTime(null);
    localStorage.removeItem("alfaza_user");
    localStorage.removeItem("alfaza_login_time");
  };

  const firebaseLogin = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const firebaseRegister = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const firebaseLogout = async () => {
    logout();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        firebaseLoading,
        user,
        shift,
        loginTime,
        login,
        logout,
        firebaseLogin,
        firebaseRegister,
        firebaseLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
