DROP DATABASE IF EXISTS bamazonDB;
CREATE DATABASE bamazonDB;
USE bamazonDB;


CREATE TABLE departments (
    department_id INT NOT NULL AUTO_INCREMENT,
    department_name VARCHAR(50) NOT NULL,
    over_head_costs DECIMAL(15,2),
    PRIMARY KEY(department_id)
);

CREATE TABLE products (
    item_id INT NOT NULL AUTO_INCREMENT,
    product_name VARCHAR(50) NOT NULL,
    -- department_name VARCHAR(50),
    dept_id INT,
    price DECIMAL(10,2),
    stock_quantity INT,
    PRIMARY KEY(item_id),
    FOREIGN KEY(dept_id) REFERENCES departments(department_id)
);

ALTER TABLE products ADD product_sales DECIMAL(15,2);