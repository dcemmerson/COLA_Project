USE cola;

INSERT INTO users(
    email,
    password,
    created,
    modified
)
VALUES
    (
        'test1@testing.com',
       	'password1',
        '2012-06-18T10:34:09',
        '2012-06-18T10:34:09'
    ),
    (
        'test2@testing.com',
        'password2',
        '2018-07-18T12:14:23',
        '2018-07-18T12:14:23'
    ),
    (
        'test3@testing.com',
        'password3',
        '2020-02-21T10:46:01',
        '2020-02-21T10:46:01'
    );

INSERT INTO template(
    name,
    file,
    comment
)
VALUES
    (
        'template1',
	'testval1'
    ),
    (
        'template2',
	'testval2',
	'this is a comment'
    ),
    (
        'template3',
	'testval3'
    );

INSERT INTO subscription(
    name
)
VALUES
    (
        'subscription1'
    ),
    (
        'subscription2'
    ),
    (
        'subscription3'
    );

INSERT INTO cola_rates(
    country,
    post,
    allowance
)
VALUES
    (
        'Botswana',
       	'Gaborone',
         5
    ),
     (
        'Belgium',
       	'Mons',
         15
    ),
    (
        'Italy',
        'Mount Vergine',
        20
    );
