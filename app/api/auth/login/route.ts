import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // Normalise Persian/Arabic-Indic digits to ASCII
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let sanitizedPhone = String(phone ?? '');
    for (let i = 0; i < 10; i++) {
      sanitizedPhone = sanitizedPhone
        .replace(persianNumbers[i], i.toString())
        .replace(arabicNumbers[i], i.toString());
    }

    // Check whether this phone belongs to a registered insider (advisor/manager).
    const matchedUsers = await db.select().from(users).where(eq(users.phoneNumber, sanitizedPhone));

    if (matchedUsers.length > 0) {
      // Insider: full user record + isInsider flag
      return NextResponse.json({ user: { ...matchedUsers[0], isInsider: true } });
    }

    // Public visitor: anyone can log in — return a minimal session object.
    // They get Listings + Add Listing + AI assistant; no advisor/manager tools.
    const publicUser = {
      id: null,
      uid: null,
      fullName: 'بازدیدکننده',
      phoneNumber: sanitizedPhone,
      agencyName: '',
      licenseNumber: '',
      email: '',
      agencyAddress: '',
      currentPlan: 'عمومی',
      planExpiryDate: '',
      adsLimitRemaining: 3,
      totalAdsAllowed: 3,
      directSyncLimitRemaining: 0,
      totalDirectSyncLimit: 0,
      isManager: false,
      isInsider: false,
    };
    return NextResponse.json({ user: publicUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
