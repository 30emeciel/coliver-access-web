// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from "firebase/app";
// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

firebase.initializeApp({
    apiKey: "AIzaSyC0ZH7VSj_diX-FDtPbJetrdZFAsu8Esv4",
    authDomain: "trentiemeciel.firebaseapp.com",
    databaseURL: "https://trentiemeciel.firebaseio.com",
    projectId: "trentiemeciel",
    storageBucket: "trentiemeciel.appspot.com",
    messagingSenderId: "706002851623",
    appId: "1:706002851623:web:a078c210d02ed43b95bb02"
  });

  export default firebase