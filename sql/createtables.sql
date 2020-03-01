CREATE schema COLA;

USE cola;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `template`;
DROP TABLE IF EXISTS `subscription`;
DROP TABLE IF EXISTS `COLARates`;
DROP TABLE IF EXISTS `COLARates_subscription`;

CREATE TABLE user (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created` datetime NOT NULL,
	`modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
    	UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE template (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`name` varchar(255) NOT NULL,
	`file` blob NOT NULL,
  	`comment` text,
	`userId` int(11),
	PRIMARY KEY (`id`),
	FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE subscription (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`name` varchar(255) NOT NULL,
    	`comment` text,
	`userId` int(11),
	PRIMARY KEY (`id`),
	FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE COLARates (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`country` varchar(255) NOT NULL,
    	`post` varchar(255) NOT NULL,
    	`allowance` int(11) NOT NULL,
	`created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`last_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE COLARates_subscription (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`COLARatesId` int(11) NOT NULL,
	`subscriptionId` int(11) NOT NULL,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`COLARatesId`) REFERENCES `COLARates` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
	FOREIGN KEY (`subscriptionId`) REFERENCES `subscription` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS = 1;
