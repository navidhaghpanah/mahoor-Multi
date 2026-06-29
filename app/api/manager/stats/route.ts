import { NextResponse } from 'next/server';
import { db } from '../../../../src/db/index';
import { realEstateAds, users } from '../../../../src/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [allAdvisors, allListings] = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          phoneNumber: users.phoneNumber,
          currentPlan: users.currentPlan,
          agencyName: users.agencyName,
          title: users.title,
        })
        .from(users)
        .where(eq(users.isManager, false)),

      db
        .select({
          id: realEstateAds.id,
          advisorId: realEstateAds.advisorId,
          type: realEstateAds.type,
          price: realEstateAds.price,
          areaSize: realEstateAds.areaSize,
          rooms: realEstateAds.rooms,
          isManagerApproved: realEstateAds.isManagerApproved,
          views: realEstateAds.views,
          clicks: realEstateAds.clicks,
          leads: realEstateAds.leads,
          timestamp: realEstateAds.timestamp,
          title: realEstateAds.title,
          location: realEstateAds.location,
          imageUrl: realEstateAds.imageUrl,
          publishStatus: realEstateAds.publishStatus,
        })
        .from(realEstateAds)
        .orderBy(desc(realEstateAds.timestamp)),
    ]);

    // Compute per-advisor statistics in JS (small dataset)
    const advisors = allAdvisors.map((advisor) => {
      const listings = allListings.filter((l) => l.advisorId === advisor.id);
      const approved = listings.filter((l) => l.isManagerApproved).length;
      const pending  = listings.filter((l) => !l.isManagerApproved).length;

      const byType: Record<string, number> = {};
      for (const l of listings) {
        const t = l.type || 'نامشخص';
        byType[t] = (byType[t] ?? 0) + 1;
      }

      const totalViews  = listings.reduce((s, l) => s + (l.views  ?? 0), 0);
      const totalLeads  = listings.reduce((s, l) => s + (l.leads  ?? 0), 0);
      const totalClicks = listings.reduce((s, l) => s + (l.clicks ?? 0), 0);
      const prices      = listings.map((l) => Number(l.price)).filter((p) => p > 0);
      const avgPrice    = prices.length
        ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
        : 0;
      const lastActivity = listings[0]?.timestamp?.toISOString() ?? null;

      return {
        ...advisor,
        totalListings: listings.length,
        approved,
        pending,
        byType,
        totalViews,
        totalLeads,
        totalClicks,
        avgPrice,
        lastActivity,
        recentListings: listings.slice(0, 6).map((l) => ({
          id: l.id,
          title: l.title,
          location: l.location,
          type: l.type,
          price: Number(l.price),
          isManagerApproved: l.isManagerApproved,
          imageUrl: l.imageUrl,
          timestamp: l.timestamp?.toISOString() ?? null,
        })),
      };
    });

    const totalListings = allListings.length;
    const totalApproved = allListings.filter((l) =>  l.isManagerApproved).length;
    const totalPending  = allListings.filter((l) => !l.isManagerApproved).length;
    const totalViews    = allListings.reduce((s, l) => s + (l.views ?? 0), 0);
    const totalLeads    = allListings.reduce((s, l) => s + (l.leads ?? 0), 0);

    return NextResponse.json({
      totals: {
        totalListings,
        totalApproved,
        totalPending,
        totalAdvisors: allAdvisors.length,
        totalViews,
        totalLeads,
      },
      advisors,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
