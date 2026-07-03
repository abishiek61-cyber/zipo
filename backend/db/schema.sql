CREATE DATABASE IF NOT EXISTS zipo;
USE zipo;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture VARCHAR(500),
  role ENUM('customer','admin','marketing') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS slogans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  badge VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  interior_addon DECIMAL(10,2) DEFAULT 300.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  slot_datetime DATETIME NOT NULL,
  include_interior BOOLEAN DEFAULT false,
  total_amount DECIMAL(10,2) NOT NULL,
  car_registration VARCHAR(50),
  address TEXT,
  status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  payment_order_id VARCHAR(255),
  payment_txn_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);
CREATE TABLE IF NOT EXISTS social_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform ENUM('instagram','facebook','whatsapp','twitter') NOT NULL,
  access_token TEXT,
  handle VARCHAR(255),
  expires_at TIMESTAMP NULL,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT IGNORE INTO slogans (text, sort_order) VALUES
  ('Zero wash, zero mess', 1),
  ('Scratch-free gloss tech', 2),
  ('Signature eco shine', 3),
  ('Premium detail, every detail', 4);
INSERT IGNORE INTO packages (name, description, badge, price) VALUES
  ('Essential wash', 'Full exterior wash, wheel clean, streak-free finish', 'Exterior', 399.00),
  ('Gloss tech', 'Scratch-free foam wash, clay bar, hand wax, tyre dressing', 'Signature', 799.00),
  ('Eco shine', 'Waterless eco wash, biodegradable products, no runoff', 'Eco', 599.00),
  ('Full detail', 'Complete exterior + interior, polish, leather treatment', 'Premium', 1499.00);
