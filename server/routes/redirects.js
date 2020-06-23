/*  filename: redirects.js
    last modified: 06/23/2020
    description: File contains some common possible typos if user
                    manually types route into url bar. These routes
                    shouldn't be used in app, these are just here
                    to help get user to the page they are looking
                    for. Should be imported into main server entry 
                    point, server.js.
*/

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
