CREATE DATABASE quiuboxdb
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

\connect quiuboxdb

\i database/quiuboxdb.sql
