BEGIN;

INSERT INTO usuario (id_rol, username, nombres, apellidos, email, password_hash, activo)
VALUES (
    1,
    'admin',
    'Administrador',
    'Quiubox',
    'admin@quiubox.local',
    '$2y$10$bvBOOsTUSa1vkiTBUqk5S.y2A.fXM3P1oi8jYRYzG4lPOQ7f97yzy',
    TRUE
);

COMMIT;
