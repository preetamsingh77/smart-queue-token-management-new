# CivicFlow - MongoDB Backend Integration

We have successfully migrated the database layer from Firebase Firestore to a custom **MongoDB + Express.js + Socket.IO API Backend**. 
Firebase is now strictly used **only** for Authentication (User Logins / Magic Links / Google Auth). 

Here is what has changed:
1. **Frontend Hooks (`useQueue.ts`)**: No longer imports anything from `firebase/firestore`. It exclusively uses `axios` to make HTTP requests to your new Express backend.
2. **Real-time Engine (`useRealtime.ts`)**: Firestore `onSnapshot` has been replaced entirely with lightweight `socket.io-client`. It listens for `db_change` events to trigger React Query invalidations.
3. **Authentication Context (`AuthContext.tsx`)**: The user profiles are now pulled and created in MongoDB instead of `firestore_db.profiles`.

## Setup & Running the MongoDB Backend

### 1. Requirements
- **None!** I have integrated `mongodb-memory-server`, which automatically spins up an embedded MongoDB Database entirely in-memory when you start your Express backend! 
- If you wish to use an external persistent Cloud Database like Mongo Atlas, you can simply create a `.env` file in the `server` directory and specify:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/civicflow
  PORT=3008
  ```

### 2. Starting the Server (Auto-Seeding)
To start the Express + Socket.IO server:
```bash
cd server
npm start
```
Because of the embedded strategy, **the API will automatically seed the Database with default Services and Counters** upon first load!

### 4. Running the Frontend
In a separate terminal at the root directory of your project, start your Vite app normally:
```bash
npm run dev
```

Your system is now completely untethered from Firestore for data storage, resulting in much faster local read/writes and complete data sovereignty!
