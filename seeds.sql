use bamazonDB;
INSERT INTO departments(department_name, over_head_costs) values
('Toys', 5000),
('Kitchen',1000),
('Yard',449),
('Bath',1500),
('Sports',3500),
('Outdoors',1188.99),
('Apparel',4400.50),
('Leisure',2500)

INSERT INTO products(product_name, dept_id, price, stock_quantity)
VALUES
('High beam laser gun', (SELECT department_id from departments where department_name = 'toys'),35.99,100),
('Electric blender', (SELECT department_id from departments where department_name = 'kitchen'),12.99,50),
('Lawn mower', (SELECT department_id from departments where department_name = 'yard'),449.99,75),
('Whitening tootbrush', (SELECT department_id from departments where department_name = 'bath'),15.99,1000),
('Neon soccer ball', (SELECT department_id from departments where department_name = 'sports'),35.99,500),
('Battery powered Fishing Line', (SELECT department_id from departments where department_name = 'outdoors'),88.99,400),
('Cuddly battery guinea pig', (SELECT department_id from departments where department_name = 'toys'),59.99,150),
('Sweat less shirt', (SELECT department_id from departments where department_name = 'apparel'),44.99,500),
('Airborne hoverboard',(SELECT department_id from departments where department_name = 'leisure'),2500,15),
('Underwater electric board', (SELECT department_id from departments where department_name = 'leisure'),3999,20),
