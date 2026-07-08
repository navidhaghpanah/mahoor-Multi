"use client";

/* Manual-publish tracking: which external platforms this listing was posted on. */
export type PublishPlatform = "divar" | "sheypoor" | "instagram";
export interface ExternalPublication {
  url?: string;
  at?: string; // ISO date of when it was marked published
}
export type ExternalPublications = Partial<Record<PublishPlatform, ExternalPublication>>;

export interface Listing {
  id?: string;
  code?: string;
  title: string;
  deal: string;
  propType: string;
  price: string;
  size: number;
  buildingArea?: number;
  beds: number;
  documents?: string;
  phone: string;
  location: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  images?: string[];
  desc?: string;
  advisorName?: string;
  advisorPhone?: string;
  submitterPhone?: string | null;
  isPublicSubmission?: boolean;
  externalPublications?: ExternalPublications;
  status: "pending" | "approved";
  createdAt?: any;
}

/* Fetch approved listings (public feed). */
export async function fetchListings(): Promise<Listing[]> {
  try {
    const res = await fetch("/api/listings", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.listings ?? []) as Listing[];
  } catch {
    return [];
  }
}

/* Fetch pending (unapproved) listings — for the manager approval queue. */
export async function fetchPendingListings(): Promise<Listing[]> {
  try {
    const res = await fetch("/api/listings?status=pending", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.listings ?? []) as Listing[];
  } catch {
    return [];
  }
}

/* Save the manual-publish status/links of a listing (full object replace). */
export async function updateExternalPublications(
  id: string,
  pubs: ExternalPublications
): Promise<void> {
  await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ externalPublications: pubs }),
  });
}

/* Approve a listing (manager action). */
export async function approveListing(id: string): Promise<void> {
  await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approve: true }),
  });
}

/*
 * Keep the same callback-based API the components expect.
 * Firebase used real-time onSnapshot; here we poll the API every 15s
 * and return an unsubscribe function.
 */
export function subscribeToListings(cb: (listings: Listing[]) => void) {
  let active = true;

  const load = async () => {
    const listings = await fetchListings();
    if (active) cb(listings);
  };

  load();
  const interval = setInterval(load, 15000);

  return () => {
    active = false;
    clearInterval(interval);
  };
}

export async function addListing(
  listing: Omit<Listing, "id" | "createdAt">
): Promise<string> {
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listing),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "خطا در ثبت آگهی");
  return data.id as string;
}

/*
 * Compress and convert a selected image file to a Base64 data URL.
 * Images are resized to max 1400px wide/tall and re-encoded at 0.78 quality
 * (typically <200 KB per photo) so multi-image payloads stay within Vercel's
 * 4.5 MB request body limit even for high-resolution camera shots.
 */
export async function uploadImage(
  file: File,
  _listingId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  onProgress?.(10);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      onProgress?.(40);
      const img = new Image();
      img.onload = () => {
        const MAX = 1400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        onProgress?.(90);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        onProgress?.(100);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = ev.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Kept for API compatibility (image is now saved on create). */
export async function updateListingImage(_id: string, _imageUrl: string) {
  /* no-op: the image is included in the initial addListing payload */
}

/* Delete a listing by id via the Neon-backed API route. */
export async function deleteListing(id: string) {
  await fetch("/api/listings/" + id, { method: "DELETE" });
}

/* Geocode an address to lat/lng using Nominatim (OpenStreetMap) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?q=" +
      encodeURIComponent(address + " ایران") +
      "&format=json&limit=1";
    const res = await fetch(url, { headers: { "Accept-Language": "fa" } });
    const data = await res.json();
    if (data.length > 0)
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}
