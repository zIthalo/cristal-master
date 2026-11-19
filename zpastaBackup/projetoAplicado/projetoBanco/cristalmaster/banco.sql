-- =====================================================================
-- Cristal Master - Criação do banco de dados (MySQL 8+)
-- Execute como administrador (root):  mysql -u root -p < docs/banco.sql
-- As TABELAS serão criadas pelo Hibernate (spring.jpa.hibernate.ddl-auto=update)
-- quando as entidades forem desenvolvidas.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cristalmaster
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Usuário exclusivo da aplicação (evita usar o root na conexão)
-- TROQUE a senha abaixo e use a mesma em DB_PASSWORD.
CREATE USER IF NOT EXISTS 'cristal'@'%' IDENTIFIED BY 'troque_esta_senha';
GRANT ALL PRIVILEGES ON cristalmaster.* TO 'cristal'@'%';
FLUSH PRIVILEGES;

-- Conferência
SHOW DATABASES LIKE 'cristalmaster';
