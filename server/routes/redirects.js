module.exports = function (app) {
    app.get('/subscription', function (req, res) {
	res.redirect('/subscriptions');
    });

    app.get('/FAQ', function (req, res) {
	res.redirect('/about');
    });

    app.get('/home', function (req, res) {
	res.redirect('/');
    });
}
