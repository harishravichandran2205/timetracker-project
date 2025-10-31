
INSERT ignore INTO app_user (id, email, first_name, last_name, password)
VALUES (1, 'admin@ogon.com', 'Admin', 'User', '$2a$10$EX6klKB3SZwImF9JRWJrfeWfozx..5GCS22mqlcGe9Ol6fH42Ao2K');

--
-- Insert roles for admin user
INSERT ignore INTO user_roles (user_id, roles) VALUES (1, 'USER');
INSERT ignore  INTO user_roles (user_id, roles) VALUES (1, 'ADMIN');