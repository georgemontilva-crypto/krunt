-- Disposable retail price $29.99 -> $39.99 (requested Nov 2026).
-- Only touches the row if it still has the old default, so a price already
-- changed in the admin panel is left alone.
UPDATE `products` SET `retail_price_cents` = 3999 WHERE `slug` = 'disposable' AND `retail_price_cents` = 2999;
