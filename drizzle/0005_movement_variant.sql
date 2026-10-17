ALTER TABLE "inventory_movements" ADD COLUMN "colourway_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_colourway_id_colourways_id_fk" FOREIGN KEY ("colourway_id") REFERENCES "public"."colourways"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_movements_colourway_id_size_created_at_index" ON "inventory_movements" USING btree ("colourway_id","size","created_at");--> statement-breakpoint
-- Link existing history to its colour where the names still match.
UPDATE "inventory_movements" m SET "colourway_id" = c."id"
FROM "colourways" c
WHERE m."colourway_id" IS NULL AND c."product_id" = m."product_id" AND c."name" = m."colour_name";
