ALTER TABLE "colourways" ALTER COLUMN "price_pesewas" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published" boolean DEFAULT false NOT NULL;