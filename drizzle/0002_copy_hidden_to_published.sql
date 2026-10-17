-- Products that were visible are published; hidden ones become drafts.
UPDATE "products" SET "published" = NOT "hidden";
