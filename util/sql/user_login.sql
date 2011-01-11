DROP DATABASE IF EXISTS wormbase_user;
CREATE DATABASE wormbase_user;
USE wormbase_user;
GRANT SELECT ON `wormbase_user`.* TO 'wb'@'localhost';

DROP TABLE IF EXISTS users;
CREATE TABLE users (
            id            INTEGER AUTO_INCREMENT PRIMARY KEY, 
            username      char(255),
            password      char(255),
            email_address char(255),
            first_name    char(100),
            last_name     char(100),
	    gtalk_key	  text,
	    active        int(11) 
);

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
            id   INTEGER PRIMARY KEY,
            role TEXT
);

DROP TABLE IF EXISTS users_to_roles;
CREATE TABLE users_to_roles (
            user_id INTEGER,
            role_id INTEGER,
            PRIMARY KEY (user_id, role_id)
);

DROP TABLE IF EXISTS openid;
CREATE TABLE openid (
            openid_url char(255) PRIMARY KEY,
            user_id INTEGER
            
);

DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
            id INTEGER AUTO_INCREMENT PRIMARY KEY,
            reporter char(50),
            location char(100),
            submit_time char(50),
            content TEXT
);


DROP TABLE IF EXISTS users_to_issues;
CREATE TABLE users_to_issues (
            user_id INTEGER,
            issue_id INTEGER,
            PRIMARY KEY (user_id, issue_id)
);

DROP TABLE IF EXISTS issues;
CREATE TABLE issues (
            id INTEGER AUTO_INCREMENT PRIMARY KEY,
	    reporter INTEGER,
	    assigned_to INTEGER,
	    title TEXT ,
	    location char(100),
	    submit_time char(50),
	    state char(10),
	    content TEXT 
);

DROP TABLE IF EXISTS issues_threads;
CREATE TABLE issues_threads (
            thread_id  INTEGER,
            issue_id INTEGER,
	    user_id INTEGER,
	    submit_time char(50),
	    content TEXT,
            PRIMARY KEY (thread_id, issue_id)
);

DROP TABLE IF EXISTS user_saved;
CREATE TABLE user_saved (
		user_saved_id INTEGER AUTO_INCREMENT PRIMARY KEY,
		session_id char(72),
		page_id INTEGER,
        save_to char(50),
        time_saved INTEGER
);

DROP TABLE IF EXISTS pages;
CREATE TABLE pages (
		page_id INTEGER AUTO_INCREMENT PRIMARY KEY,
		url char(72),
		title TEXT
);

DROP TABLE IF EXISTS user_history;
CREATE TABLE user_history (
		session_id char(72),
		page_id INTEGER,
        latest_visit INTEGER,
        visit_count INTEGER,
        PRIMARY KEY (session_id, page_id)
);

INSERT INTO `roles` VALUES ('1','admin'),('2','curator'),('3','user'),('4','operator');

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
        id           char(72) primary key,
        session_data text,
        expires      int(10)
    );


