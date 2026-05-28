import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCmGIMfGLXhrP7dJ4SGYfxxVGEc9yjx4A",
  authDomain: "cometsync-44e93.firebaseapp.com",
  projectId: "cometsync-44e93",
  storageBucket: "cometsync-44e93.appspot.com",
  messagingSenderId: "286609927630",
  appId: "1:286609927630:web:15fcc8d3656f0d5df04f9f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);