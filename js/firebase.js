const firebaseConfig = {
  apiKey: "SUBSTITUIR_PELA_API_KEY",
  authDomain: "SUBSTITUIR_PELO_AUTH_DOMAIN",
  projectId: "SUBSTITUIR_PELO_PROJECT_ID",
  storageBucket: "SUBSTITUIR_PELO_STORAGE_BUCKET",
  messagingSenderId: "SUBSTITUIR_PELO_SENDER_ID",
  appId: "SUBSTITUIR_PELO_APP_ID"
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
