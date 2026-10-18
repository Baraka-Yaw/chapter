ALTER TABLE "colourways" ADD COLUMN "sizes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "colourways" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;