// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQaL4dOFtJiehHqp2pdsoOzmqv3nkzoXM",
  authDomain: "mixlab-music-studio.firebaseapp.com",
  projectId: "mixlab-music-studio",
  storageBucket: "mixlab-music-studio.firebasestorage.app",
  messagingSenderId: "220040768224",
  appId: "1:220040768224:web:0a0503dcfae6622fce7e85"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);