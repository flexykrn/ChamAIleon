// Quick Firebase Connection Test
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCpEPAcCe6u77db0Sv_ZRmIWhA_TY6VAtI",
  authDomain: "chameleon-b5712.firebaseapp.com",
  projectId: "chameleon-b5712",
  storageBucket: "chameleon-b5712.firebasestorage.app",
  messagingSenderId: "543006332224",
  appId: "1:543006332224:web:db3ad2c46ca9a048e356a5",
  measurementId: "G-L6RGM8EZP5"
};

console.log('🔥 Testing Firebase Connection...\n');
console.log('Configuration:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);
console.log('- API Key:', firebaseConfig.apiKey.substring(0, 20) + '...\n');

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App Initialized Successfully!');
  
  const db = getFirestore(app);
  console.log('✅ Firestore Connection Established!');
  
  // Try to read from Firestore
  (async () => {
    try {
      const attacksRef = collection(db, 'attacks');
      const snapshot = await getDocs(attacksRef);
      console.log(`✅ Firestore Database Accessible!`);
      console.log(`📊 Found ${snapshot.size} documents in 'attacks' collection`);
      console.log('\n🎉 All Firebase services are working correctly!');
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.log('⚠️  Firestore accessible but permissions not set up yet');
        console.log('   Go to Firebase Console → Firestore → Rules');
        console.log('   Set rules to allow read/write for testing\n');
      } else {
        console.error('❌ Firestore Error:', error.message);
      }
    }
  })();
  
} catch (error) {
  console.error('❌ Firebase Initialization Failed!');
  console.error('Error:', error.message);
  console.error('\nPlease check:');
  console.error('1. Firebase project exists at https://console.firebase.google.com');
  console.error('2. API key is correct');
  console.error('3. Firestore is enabled in your project');
}
