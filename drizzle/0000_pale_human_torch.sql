CREATE TYPE "public"."order_status" AS ENUM('new', 'confirmed', 'paid', 'made', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('available', 'preorder', 'coming-soon');--> statement-breakpoint
CREATE TABLE "colourways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"price_pesewas" integer NOT NULL,
	"sale_pesewas" integer,
	"palette" jsonb NOT NULL,
	"image" text,
	"sold_out" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "colourways_productId_key_unique" UNIQUE("product_id","key")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"product_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"zone_id" text NOT NULL,
	"zone_label" text NOT NULL,
	"delivery_pesewas" integer DEFAULT 0 NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"payment" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal_pesewas" integer NOT NULL,
	"total_pesewas" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"collection" text DEFAULT '' NOT NULL,
	"pattern" text DEFAULT 'plain' NOT NULL,
	"status" "product_status" DEFAULT 'available' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sizes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colourways" ADD CONSTRAINT "colourways_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_type_created_at_index" ON "events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_index" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_index" ON "orders" USING btree ("status");