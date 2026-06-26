import { db } from './index';
import { users } from './schema';

const seedUsers = [
  {
    uid: 'mock_uid_admin',
    fullName: 'محمد مهدی آزاد (مدیر ارشد)',
    phoneNumber: '09113276647',
    agencyName: 'مجموعه تخصصی املاک ماهور',
    licenseNumber: 'م-۱۵۹۸',
    email: 'info@mahoorrlste.ir',
    agencyAddress: 'محمودآباد، خیابان امام، بعد از نسیم ۶۹/۱ — روبروی پارکینگ قزوینی‌پور',
    currentPlan: 'پلاتینیوم',
    planExpiryDate: '۱۴۰۷/۱۲/۲۹',
    adsLimitRemaining: 120,
    totalAdsAllowed: 150,
    directSyncLimitRemaining: 950,
    totalDirectSyncLimit: 1000,
    isManager: true,
  },
  {
    uid: 'mock_uid_heidari',
    fullName: 'خانم حیدری',
    phoneNumber: '09120996426',
    agencyName: 'مجموعه تخصصی املاک ماهور',
    licenseNumber: 'م-۵۴۲۰',
    email: 'heidari@mahoorrlste.ir',
    agencyAddress: 'محمودآباد، خیابان امام، بعد از نسیم ۶۹/۱ — روبروی پارکینگ قزوینی‌پور',
    currentPlan: 'نقره‌ای',
    planExpiryDate: '۱۴۰۶/۱۲/۲۹',
    adsLimitRemaining: 28,
    totalAdsAllowed: 50,
    directSyncLimitRemaining: 120,
    totalDirectSyncLimit: 200,
    isManager: false,
  },
  {
    uid: 'mock_uid_rayee',
    fullName: 'آقای راعی',
    phoneNumber: '09120997453',
    agencyName: 'مجموعه تخصصی املاک ماهور',
    licenseNumber: 'م-۸۷۳۴',
    email: 'rayee@mahoorrlste.ir',
    agencyAddress: 'محمودآباد، خیابان امام، بعد از نسیم ۶۹/۱ — روبروی پارکینگ قزوینی‌پور',
    currentPlan: 'طلایی',
    planExpiryDate: '۱۴۰۶/۱۲/۲۹',
    adsLimitRemaining: 35,
    totalAdsAllowed: 50,
    directSyncLimitRemaining: 345,
    totalDirectSyncLimit: 500,
    isManager: false,
  }
];

export async function seedDatabase() {
  console.log("Seeding Database...");
  for (const u of seedUsers) {
    await db.insert(users)
      .values(u)
      .onConflictDoNothing({ target: users.uid });
  }
  console.log("Seeding complete.");
}
