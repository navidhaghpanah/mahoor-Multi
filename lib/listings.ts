"use client";

import { db, storage } from "./firebase";
import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export interface Listing {
  id?: string;
  title: string;
  deal: string;
  propType: string;
  price: string;
  size: number;
  beds: number;
  phone: string;
  location: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  desc?: string;
  advisorName?: string;
  advisorPhone?: string;
  status: "pending" | "approved";
  createdAt?: any;
}

const COLLECTION = "mahoor_listings";

export function subscribeToListings(cb: (listings: Listing[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
  });
}

export async function addListing(listing: Omit<Listing, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...listing,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateListingImage(id: string, imageUrl: string) {
  await updateDoc(doc(db, COLLECTION, id), { imageUrl });
}

export async function uploadImage(
  file: File,
  listingId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const storageRef = ref(storage, `listings/${listingId}/${Date.now()}_${file.name}`);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteListing(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/* Geocode an address to lat/lng using Nominatim (OpenStreetMap) */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + " ایران")}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "fa" } });
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}
