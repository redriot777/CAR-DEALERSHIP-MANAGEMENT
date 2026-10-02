-- Car Dealership Management System - database setup
-- Run with:  mysql -u root -p < database/car_dealership.sql
-- NOTE: running this script again resets the cars table to the sample data.

CREATE DATABASE IF NOT EXISTS car_dealership;

USE car_dealership;

DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(100) NOT NULL,
    manufacturing_year INT NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    transmission VARCHAR(50) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cars (brand, model, variant, manufacturing_year, fuel_type, transmission, price, status) VALUES
('Toyota',        'Innova Crysta', 'ZX',        2023, 'Diesel',   'Automatic', 2699000.00, 'Available'),
('Honda',         'City',          'VX',        2022, 'Petrol',   'Manual',    1349000.00, 'Sold'),
('Hyundai',       'Creta',         'SX(O)',     2024, 'Diesel',   'Automatic', 1899000.00, 'Available'),
('Tata',          'Nexon EV',      'Empowered', 2024, 'Electric', 'Automatic', 1749000.00, 'Reserved'),
('Mahindra',      'XUV700',        'AX7',       2023, 'Diesel',   'Automatic', 2399000.00, 'Available'),
('BMW',           '3 Series',      'Sport',     2022, 'Petrol',   'Automatic', 5990000.00, 'Under Service'),
('Mercedes-Benz', 'C-Class',       'C 220d',    2023, 'Diesel',   'Automatic', 6490000.00, 'Reserved'),
('Maruti Suzuki', 'Ertiga',        'ZXI CNG',   2023, 'CNG',      'Manual',    1199000.00, 'Available'),
('Toyota',        'Camry',         'Hybrid',    2022, 'Hybrid',   'Automatic', 4600000.00, 'Sold'),
('Hyundai',       'i20',           'Asta',      2021, 'Petrol',   'Manual',     899000.00, 'Sold');
