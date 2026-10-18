-- Each colour starts with its product's sizes and its single photo (if any) as the first of its photos.
UPDATE "colourways" c SET "sizes" = p."sizes"
FROM "products" p
WHERE p."id" = c."product_id";
--> statement-breakpoint
UPDATE "colourways" SET "images" = jsonb_build_array("image") WHERE "image" IS NOT NULL;
