import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevelopmentOnlyPleaseReplace",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project-id.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:mockappid1234567890",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MOCKMEASURE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-');
const useMockFlag = import.meta.env.VITE_USE_MOCK_BACKEND === 'true';

export const IS_MOCK = isPlaceholder || useMockFlag;

if (IS_MOCK) {
    console.info('🚀 CivicFlow: Core operating in MOCK MODE (Zero-Config). Use real keys in .env.local for Firebase.');
} else {
    console.info('🔥 CivicFlow: Firebase Production Environment Connected.');
}

export default app;
