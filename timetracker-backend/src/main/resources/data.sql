
INSERT ignore INTO app_user (id, email, first_name, last_name, password)
VALUES (1, 'admin@ogon.com', 'Admin', 'User', '$2a$10$OKKlmW5bQzpAAHJmeBUUsOLE7l2krYD.qwdcT6u4aXFNnrF9ZfvTK');

--
-- Insert roles for admin user
INSERT ignore INTO user_roles (user_id, roles) VALUES (1, 'USER');
INSERT ignore  INTO user_roles (user_id, roles) VALUES (1, 'ADMIN');