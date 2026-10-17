-- Every product now counts inventory: give each colour × size a row (new ones start at 0).
INSERT INTO "inventory" ("colourway_id", "size", "quantity")
SELECT c."id", s.size, 0
FROM "colourways" c
JOIN "products" p ON p."id" = c."product_id"
CROSS JOIN LATERAL jsonb_array_elements_text(p."sizes") AS s(size)
ON CONFLICT ("colourway_id", "size") DO NOTHING;
