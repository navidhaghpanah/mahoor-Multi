import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/admin/reset-pin  { managerPhone, targetPhone }
// Manager clears a user's PIN so they go through OTP + PIN-setup on next login.
export async function POST(req: NextRequest) {
  try {
    const { managerPhone, targetPhone } = await req.json();
    if (!managerPhone || !targetPhone) {
      return NextResponse.json({ error: 'اطلاعات ناقص' }, { status: 400 });
    }

    const manager = await db.select({ isManager: users.isManager })
      .from(users).where(eq(users.phoneNumber, String(managerPhone)));
    if (!manager.length || !manager[0].isManager) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    await db.update(users).set({ pin: null }).where(eq(users.phoneNumber, String(targetPhone)));
    return NextResponse.json({ ok: true, message: 'PIN کاربر بازنشانی شد' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
