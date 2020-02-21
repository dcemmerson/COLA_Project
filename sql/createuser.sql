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

