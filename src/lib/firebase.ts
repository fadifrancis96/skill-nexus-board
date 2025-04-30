
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlPt-hF_fTq1OGYkBR6AIa93KoJAAr6ug",
  authDomain: "shagla-project.firebaseapp.com",
  projectId: "shagla-project",
  storageBucket: "shagla-project.appspot.com",
  messagingSenderId: "565150701237",
  appId: "1:565150701237:web:8bb5119dd5d3d2c62190fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
