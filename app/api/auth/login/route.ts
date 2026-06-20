import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    // Convert any Persian numbers to English to ensure query match
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let sanitizedPhone = phone as string;
    if(typeof sanitizedPhone === 'string') {
      for(let i=0; i<10; i++) {
        sanitizedPhone = sanitizedPhone.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
      }
    }

    const matchedUsers = await db.select().from(users).where(eq(users.phoneNumber, sanitizedPhone));
    
    if (matchedUsers.length > 0) {
      return NextResponse.json({ user: matchedUsers[0] });
    } else {
      return NextResponse.json({ error: "کاربری با این شماره یافت نشد." }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
