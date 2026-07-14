CREATE TABLE "channel_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"channel_name" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"api_key" text NOT NULL,
	"phone_number" text NOT NULL,
	"sync_status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" bigint NOT NULL,
	"type" text NOT NULL,
	"location" text NOT NULL,
	"area_size" integer NOT NULL,
	"building_area" integer,
	"rooms" integer NOT NULL,
	"documents" text,
	"image_url" text,
	"images" text,
	"submitter_phone" text,
	"source" text DEFAULT 'web',
	"publish_to_divar" boolean DEFAULT false NOT NULL,
	"publish_to_sheypoor" boolean DEFAULT false NOT NULL,
	"publish_to_mahoor" boolean DEFAULT true NOT NULL,
	"divar_id" text,
	"sheypoor_id" text,
	"external_publications" text,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"publish_status" text NOT NULL,
	"advisor_id" integer NOT NULL,
	"is_manager_approved" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"bot" text DEFAULT 'telegram' NOT NULL,
	"step" text DEFAULT 'idle' NOT NULL,
	"data" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"agency_name" text NOT NULL,
	"license_number" text NOT NULL,
	"email" text NOT NULL,
	"agency_address" text NOT NULL,
	"current_plan" text NOT NULL,
	"plan_expiry_date" text NOT NULL,
	"ads_limit_remaining" integer NOT NULL,
	"total_ads_allowed" integer NOT NULL,
	"direct_sync_limit_remaining" integer NOT NULL,
	"total_direct_sync_limit" integer NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"title" text,
	"pin" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "channel_credentials" ADD CONSTRAINT "channel_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_ads" ADD CONSTRAINT "real_estate_ads_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;