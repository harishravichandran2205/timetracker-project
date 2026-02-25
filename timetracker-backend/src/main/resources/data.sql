
INSERT ignore INTO app_user (id, email, first_name, last_name, password)
VALUES (1, 'timetrackeradmin@ogondigital.com', 'Admin', 'User', '$2a$10$XFY45yrS1HdMdRAdwaFVk.06DLzcv6Ie7NawzFW3a4vAXvaNI1Rsm');

--
-- Insert roles for admin user
INSERT ignore INTO user_roles (user_id, roles) VALUES (1, 'USER');
INSERT ignore  INTO user_roles (user_id, roles) VALUES (1, 'ADMIN');