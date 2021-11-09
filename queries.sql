CREATE TABLE seller_table (
    seller_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    seller_name VARCHAR(100) NOT NULL,
    seller_email VARCHAR(50) NOT NULL UNIQUE,
    seller_pass VARCHAR(100) NOT NULL,
    seller_reg_date DATETIME NOT NULL,
    seller_edit_date DATETIME NOT NULL,
    seller_bank_name VARCHAR(100) NOT NULL,
    seller_account_number BIGINT NOT NULL,
    seller_mob_no VARCHAR(20),
    seller_address VARCHAR(200),
    seller_firm_name VARCHAR(100) NOT NULL UNIQUE,
    seller_firm_address VARCHAR(200),
    seller_profile_pic VARCHAR(100),
    seller_firm_info VARCHAR(200)
);

CREATE TABLE customer_table (
    customer_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(50) NOT NULL UNIQUE,
    customer_pass VARCHAR(100) NOT NULL,
    customer_reg_date DATETIME NOT NULL,
    customer_edit_date DATETIME NOT NULL,
    customer_bank_name VARCHAR(50),
    customer_account_number BIGINT,
    customer_mob_no VARCHAR(20),
    customer_address VARCHAR(200)
);

CREATE TABLE product_table (
    product_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    product_category VARCHAR(45) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_about VARCHAR(200),
    product_pic VARCHAR(100) NOT NULL,
    product_price BIGINT NOT NULL,
    product_rating_count INT,
    product_best_rating INT,
    product_max_price BIGINT NOT NULL,
    product_seller_id INT NOT NULL,
    product_count_stock BIGINT NOT NULL,
    product_reg_date DATETIME NOT NULL,
    product_update_date DATETIME NOT NULL,
    FOREIGN KEY (product_seller_id) REFERENCES seller_table(seller_id) ON DELETE CASCADE
);

CREATE TABLE cart_table (
    -- cart_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    cart_product_id INT,
    cart_product_price BIGINT NOT NULL,
    cart_modified DATETIME NOT NULL,
    cart_product_count BIGINT NOT NULL,
    cart_purchased BOOLEAN NOT NULL,
    cart_product_total BIGINT NOT NULL,
    cart_customer_id INT,
    FOREIGN KEY (cart_product_id) REFERENCES product_table(product_id) ON DELETE
    SET
        NULL,
        FOREIGN KEY (cart_customer_id) REFERENCES customer_table(customer_id) ON DELETE CASCADE
);

CREATE TABLE transaction_table (
    transc_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    transc_date DATETIME NOT NULL,
    transc_product_id INT,
    transc_total_price BIGINT NOT NULL,
    -- transc_cart_id INT NOT NULL,
    transc_seller_id INT,
    transc_customer_id INT,
    transc_invoice_number VARCHAR(20) NOT NULL,
    transc_shipping_address varchar(200) NOT NULL,
    FOREIGN KEY (transc_product_id) REFERENCES product_table(product_id) ON DELETE
    SET
        NULL,
        FOREIGN KEY (transc_seller_id) REFERENCES seller_table(seller_id) ON DELETE
    SET
        NULL,
        FOREIGN KEY (transc_customer_id) REFERENCES customer_table(customer_id) ON DELETE
    SET
        NULL
);


DELIMITER $$
CREATE 
	TRIGGER customer_product_purchased AFTER INSERT 
    ON transaction_table
    FOR EACH ROW 
    BEGIN
		UPDATE cart_table SET 
		cart_purchased = true
		WHERE cart_customer_id = NEW.transc_customer_id AND 
        cart_product_id = NEW.transc_product_id;
	END $$
DELIMITER ;