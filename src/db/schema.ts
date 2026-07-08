import { relations } from 'drizzle-orm';
import { integer, bigint, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  agencyName: text('agency_name').notNull(),
  licenseNumber: text('license_number').notNull(),
  email: text('email').notNull(),
  agencyAddress: text('agency_address').notNull(),
  currentPlan: text('current_plan').notNull(),
  planExpiryDate: text('plan_expiry_date').notNull(),
  adsLimitRemaining: integer('ads_limit_remaining').notNull(),
  totalAdsAllowed: integer('total_ads_allowed').notNull(),
  directSyncLimitRemaining: integer('direct_sync_limit_remaining').notNull(),
  totalDirectSyncLimit: integer('total_direct_sync_limit').notNull(),
  isManager: boolean('is_manager').default(false).notNull(),
  title: text('title'),
  pin: text('pin'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const telegramSessions = pgTable('telegram_sessions', {
  chatId: bigint('chat_id', { mode: 'number' }).primaryKey(),
  bot:    text('bot').notNull().default('telegram'),
  step:   text('step').notNull().default('idle'),
  data:   text('data').notNull().default('{}'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const realEstateAds = pgTable('real_estate_ads', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
  type: text('type').notNull(),
  location: text('location').notNull(),
  areaSize: integer('area_size').notNull(),
  buildingArea: integer('building_area'),
  rooms: integer('rooms').notNull(),
  imageUrl: text('image_url'),
  images: text('images'),
  submitterPhone: text('submitter_phone'),
  source: text('source').default('web'),
  publishToDivar: boolean('publish_to_divar').default(false).notNull(),
  publishToSheypoor: boolean('publish_to_sheypoor').default(false).notNull(),
  publishToMahoor: boolean('publish_to_mahoor').default(true).notNull(),
  divarId: text('divar_id'),
  sheypoorId: text('sheypoor_id'),
  // JSON: { divar?: {url,at}, sheypoor?: {url,at}, instagram?: {url,at} } — manual publish tracking
  externalPublications: text('external_publications'),
  views: integer('views').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  leads: integer('leads').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  publishStatus: text('publish_status').notNull(),
  advisorId: integer('advisor_id').references(() => users.id).notNull(),
  isManagerApproved: boolean('is_manager_approved').default(false).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const channelCredentials = pgTable('channel_credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  channelName: text('channel_name').notNull(),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  apiKey: text('api_key').notNull(),
  phoneNumber: text('phone_number').notNull(),
  syncStatus: text('sync_status').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ads: many(realEstateAds),
  channels: many(channelCredentials),
}));

export const adsRelations = relations(realEstateAds, ({ one }) => ({
  advisor: one(users, {
    fields: [realEstateAds.advisorId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channelCredentials, ({ one }) => ({
  user: one(users, {
    fields: [channelCredentials.userId],
    references: [users.id],
  }),
}));
