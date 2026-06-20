import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "@/firebase-applet-config.json";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase setup tool provisions a specific named database if multiple DBs are used on the project.
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");
export const auth = getAuth(app);
