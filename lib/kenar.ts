// Server-side only. Reads KENAR_API_KEY + KENAR_BUSINESS_TOKEN from env.
// Complete no-op if either is missing — never breaks the listing publish flow.
// SUBMIT_POST scope requires Divar team approval (pending); all errors are logged
// and swallowed so callers always fire-and-forget safely.

export interface ListingForKenar {
  title: string;
  price: number;
  type: string;         // DB 'type' col: propType (apartment/villa/…) or deal (sale/rent/…)
  location: string;
  areaSize: number;
  rooms: number;
  imageUrl?: string | null;
  advisorPhone: string;
  lat?: number | null;
  lng?: number | null;
}

// Our propType/deal values → Divar category_slug
// (best-effort; verify exact slugs via /assets/categories once SUBMIT_POST is approved)
function toCategorySlug(type: string): string {
  const m: Record<string, string> = {
    apartment:  'apartment-sell',  آپارتمان:  'apartment-sell',
    villa:      'villa-sell',      ویلا:      'villa-sell',
    land:       'land',            زمین:      'land',
    commercial: 'shop',            تجاری:     'shop',
    sale:       'apartment-sell',
    rent:       'apartment-rent',
    mortgage:   'apartment-rent',
    presale:    'apartment-presell',
  };
  return m[type] ?? 'apartment-sell';
}

async function uploadImageToKenar(apiKey: string, imageDataUrl: string): Promise<string | null> {
  try {
    const urlRes = await fetch('https://open-api.divar.ir/v1/open-platform/post/image-upload-url', {
      headers: { 'x-api-key': apiKey },
    });
    if (!urlRes.ok) {
      console.error('[Kenar] image-upload-url', urlRes.status, await urlRes.text());
      return null;
    }
    const { upload_url, path } = await urlRes.json();

    const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
    const mime   = mimeMatch?.[1] ?? 'image/jpeg';
    const b64    = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(b64, 'base64');

    const putRes = await fetch(upload_url, {
      method:  'PUT',
      headers: { 'Content-Type': mime, 'Content-Length': String(buffer.length) },
      body:    buffer,
    });
    if (!putRes.ok) {
      console.error('[Kenar] image PUT', putRes.status);
      return null;
    }
    return path as string;
  } catch (e: any) {
    console.error('[Kenar] uploadImage:', e?.message);
    return null;
  }
}

async function fetchCategoryFields(
  apiKey: string,
  slug: string,
  listing: ListingForKenar,
): Promise<Record<string, any>> {
  try {
    const res = await fetch(
      `https://open-api.divar.ir/v1/open-platform/assets/submit-schema/${slug}`,
      { headers: { 'x-api-key': apiKey } },
    );
    if (!res.ok) return {};
    const schema = await res.json();
    const props: Record<string, any> = schema?.properties ?? schema?.schema?.properties ?? {};
    const fields: Record<string, any> = {};
    for (const key of Object.keys(props)) {
      const k = key.toLowerCase();
      if (k.includes('size') || k === 'متراژ')      fields[key] = listing.areaSize;
      else if (k.includes('room') || k === 'اتاق')  fields[key] = listing.rooms;
      else if (k.includes('price') || k === 'قیمت') fields[key] = listing.price;
    }
    return fields;
  } catch {
    return {};
  }
}

export async function postListingToKenar(listing: ListingForKenar): Promise<void> {
  const apiKey        = process.env.KENAR_API_KEY;
  const businessToken = process.env.KENAR_BUSINESS_TOKEN;
  if (!apiKey || !businessToken) return;

  const categorySlug = toCategorySlug(listing.type);

  try {
    const imagePaths: string[] = [];
    if (listing.imageUrl?.startsWith('data:image/')) {
      const path = await uploadImageToKenar(apiKey, listing.imageUrl);
      if (path) imagePaths.push(path);
    }

    const categoryFields = await fetchCategoryFields(apiKey, categorySlug, listing);

    const body = {
      business_token: businessToken,
      general_data: {
        category_slug:    categorySlug,
        title:            listing.title,
        description:      listing.location,
        images:           imagePaths,
        city:             'mahmoudabad',
        location_type:    listing.lat && listing.lng
                            ? 'LOCATION_TYPE_APPROXIMATE'
                            : 'LOCATION_TYPE_EMPTY',
        ...(listing.lat && listing.lng
          ? { latitude: listing.lat, longitude: listing.lng }
          : {}),
        hide_phone:       false,
        chat_enabled:     true,
        landline_numbers: ['01144735333'],
      },
      category_fields: categoryFields,
    };

    const res = await fetch(
      'https://open-api.divar.ir/experimental/open-platform/posts/new-v2',
      {
        method:  'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      },
    );

    if (!res.ok) {
      // 403 "missing permission SUBMIT_POST" is expected until Divar approves the scope
      console.error(`[Kenar] submit ${res.status}:`, (await res.text()).slice(0, 200));
    } else {
      const data = await res.json();
      console.log('[Kenar] listing posted:', data?.token ?? JSON.stringify(data));
    }
  } catch (e: any) {
    console.error('[Kenar] postListing:', e?.message ?? e);
  }
}
