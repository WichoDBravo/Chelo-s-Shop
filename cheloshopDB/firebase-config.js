// /cheloshopDB/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDE93o5qd45mX98N2OIK1VmoMiLYpmjHkw",
    authDomain: "cheloshop-b09.firebaseapp.com",
    projectId: "cheloshop-b09",
    storageBucket: "cheloshop-b09.firebasestorage.app",
    messagingSenderId: "350042741633",
    appId: "1:350042741633:web:3f0125638c65333f5e2680",
    measurementId: "G-XGDGHR2VWD"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };