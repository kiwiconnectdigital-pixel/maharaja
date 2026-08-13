-- ============================================================
-- FIRM FEED - MYSQL SCHEMA
-- ============================================================
-- User <-> Firm relationship:
--
-- users.firm_ids  -> JSON array of firm IDs
-- firms.user_ids  -> JSON array of user IDs
--
-- Example:
-- users.firm_ids = [1, 2, 5]
-- firms.user_ids = [1, 3, 7]
--
-- No firm_owners table is required.
-- ============================================================


CREATE DATABASE IF NOT EXISTS firm_feed
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE firm_feed;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                          INT AUTO_INCREMENT PRIMARY KEY,

    name                        VARCHAR(150) NOT NULL,

    email                       VARCHAR(150) NULL,

    dob                         VARCHAR(20) NULL,

    image                       VARCHAR(255) NULL,

    bloodGroup                  VARCHAR(20) NULL,

    mobile                      VARCHAR(15) NOT NULL,

    password                    VARCHAR(255) NOT NULL,

    role                        ENUM('admin','user')
                                DEFAULT 'user',

    firm_ids                    JSON NULL,

    is_password_reset_required  TINYINT(1)
                                DEFAULT 1,

    is_inactive                 TINYINT(1)
                                DEFAULT 0,

    created_by                  INT NULL,

    created_at                  DATETIME
                                DEFAULT CURRENT_TIMESTAMP,

    updated_at                  DATETIME
                                DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    name            VARCHAR(100) NOT NULL UNIQUE,

    slug            VARCHAR(120) NOT NULL UNIQUE,

    description     TEXT NULL,

    is_inactive     TINYINT(1)
                    DEFAULT 0,

    created_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP,

    updated_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- FIRMS
-- ============================================================

CREATE TABLE IF NOT EXISTS firms (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    name            VARCHAR(150) NOT NULL,

    category_id     INT NULL,

    description     TEXT NULL,

    logo            VARCHAR(255) NULL,

    address         VARCHAR(255) NULL,

    city            VARCHAR(100) NULL,

    state           VARCHAR(100) NULL,

    pincode         VARCHAR(10) NULL,

    contact_email   VARCHAR(150) NULL,

    contact_phone   VARCHAR(15) NULL,

    user_ids        JSON NULL,

    status          ENUM('active','inactive')
                    DEFAULT 'active',

    created_by      INT NULL,

    created_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP,

    updated_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_firms_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_firms_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- FEEDS
-- ============================================================
-- Admin uploaded posts visible to users
-- ============================================================

CREATE TABLE IF NOT EXISTS feeds (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    title           VARCHAR(200) NOT NULL,

    content         TEXT NULL,

    uploaded_by     INT NOT NULL,

    status          ENUM('published','draft')
                    DEFAULT 'published',

    created_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP,

    updated_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_feeds_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- FEED MEDIA
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_media (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    feed_id         INT NOT NULL,

    media_url       VARCHAR(255) NOT NULL,

    media_type      ENUM('image','video')
                    DEFAULT 'image',

    created_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feed_media_feed
        FOREIGN KEY (feed_id)
        REFERENCES feeds(id)
        ON DELETE CASCADE
);


-- ============================================================
-- UPLOAD LOGS
-- ============================================================
-- Stores Excel/CSV bulk upload history
-- ============================================================

CREATE TABLE IF NOT EXISTS upload_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    uploaded_by     INT NOT NULL,

    type            ENUM('users','firms')
                    NOT NULL,

    file_name       VARCHAR(255) NULL,

    total_rows      INT DEFAULT 0,

    success_count   INT DEFAULT 0,

    failed_count    INT DEFAULT 0,

    error_log       JSON NULL,

    created_at      DATETIME
                    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_upload_logs_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- SAMPLE DATA STRUCTURE
-- ============================================================
-- These are examples only.
-- ============================================================

-- User:
--
-- id = 1
-- name = Mr Narendra Kashyap
-- firm_ids = [1, 2]


-- Firm:
--
-- id = 1
-- name = Tarun Fabrics
-- user_ids = [1, 2, 3]


-- Firm:
--
-- id = 2
-- name = Vinay Saree
-- user_ids = [1, 5]


-- ============================================================
-- CHECK USER-FIRM RELATIONSHIP
-- ============================================================

-- SELECT id, name, firm_ids
-- FROM users;


-- SELECT id, name, user_ids
-- FROM firms;


-- ============================================================
-- JSON EXAMPLES
-- ============================================================

-- Add firm IDs to a user:
--
-- UPDATE users
-- SET firm_ids = JSON_ARRAY(1, 2, 3)
-- WHERE id = 1;


-- Add user IDs to a firm:
--
-- UPDATE firms
-- SET user_ids = JSON_ARRAY(1, 2, 3)
-- WHERE id = 1;


-- Find users having firm ID 1:
--
-- SELECT *
-- FROM users
-- WHERE JSON_CONTAINS(firm_ids, '1');


-- Find firms having user ID 1:
--
-- SELECT *
-- FROM firms
-- WHERE JSON_CONTAINS(user_ids, '1');