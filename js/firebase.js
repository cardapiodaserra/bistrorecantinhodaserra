const firebaseConfig = {
  apiKey: "AIzaSyDzrvYa7sQW3r2pvZmVEj9EeJ9LFnjVBno",
  authDomain: "bistrorecantinhodaserra-730b4.firebaseapp.com",
  projectId: "bistrorecantinhodaserra-730b4",
  storageBucket: "bistrorecantinhodaserra-730b4.firebasestorage.app",
  messagingSenderId: "948013000242",
  appId: "1:948013000242:web:ac1894ef452e1e992ebe2b"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence: multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence not supported in this browser');
    }
  });
