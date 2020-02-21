CREATE schema COLA;

USE cola;

CREATE TABLE users (
	id int NOT NULL AUTO_INCREMENT,
	email varchar(255) NOT NULL,
	password varchar(255) NOT NULL,
	created datetime NOT NULL,
	modified datetime NOT NULL,
	PRIMARY KEY (id),
    	UNIQUE (email)
);

CREATE TABLE template (
	id int NOT NULL AUTO_INCREMENT,
	name varchar(255) NOT NULL,
	file blob NOT NULL,
  	comment text,
	PRIMARY KEY (id)
);

CREATE TABLE subscription (
	id int NOT NULL AUTO_INCREMENT,
	name varchar(255) NOT NULL,
    	comment text,
	PRIMARY KEY (id)
);

CREATE TABLE cola_rates (
	id int NOT NULL AUTO_INCREMENT,
	country varchar(255) NOT NULL,
    	post varchar(255) NOT NULL,
    	allowance int NOT NULL,
	PRIMARY KEY (id)
);
