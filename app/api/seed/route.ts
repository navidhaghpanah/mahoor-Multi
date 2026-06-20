import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../src/db/seed';

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ message: "Seed successful" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
