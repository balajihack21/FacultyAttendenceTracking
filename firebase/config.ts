// Use Firebase v10+ modular imports (ESM)
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB1n_1okTZg8zTpxQexVbVqEqcrKAYq9Ho",
  authDomain: "facultybiometrcattendance.firebaseapp.com",
  databaseURL: "https://facultybiometrcattendance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "facultybiometrcattendance",
  storageBucket: "facultybiometrcattendance.firebasestorage.app",
  messagingSenderId: "1060264187584",
  appId: "1:1060264187584:web:7589519ff42f223f937f25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);
