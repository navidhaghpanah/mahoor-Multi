"use client";

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

/* Fetch all listings once from the Neon-backed API route. */
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
 * Image handling without Firebase Storage:
 * convert the selected file to a Base64 data URL so it can be sent
 * inside the listing payload and stored in the image_url text column.
 */
export async function uploadImage(
  file: File,
  _listingId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Kept for API compatibility (image is now saved on create). */
export async function updateListingImage(_id: string, _imageUrl: string) {
  /* no-op: the image is included in the initial addListing payload */
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
