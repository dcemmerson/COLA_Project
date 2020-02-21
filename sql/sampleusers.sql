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