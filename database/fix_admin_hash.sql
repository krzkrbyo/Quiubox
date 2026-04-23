BEGIN;

UPDATE usuario
SET password_hash = '$2y$10$bvBOOsTUSa1vkiTBUqk5S.y2A.fXM3P1oi8jYRYzG4lPOQ7f97yzy'
WHERE username = 'admin';

COMMIT;
