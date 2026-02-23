import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
