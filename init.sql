-- Initialize the dreamvacations database
USE dreamvacations;
DROP TABLE destinations;
-- Create the destinations table
CREATE TABLE IF NOT EXISTS destinations
(
      id INT AUTO_INCREMENT PRIMARY KEY,
      country VARCHAR(255) NOT NULL,
      capital VARCHAR(255),
      population BIGINT,
      region VARCHAR(255),
      currencies VARCHAR(255),
      anthem text
);
