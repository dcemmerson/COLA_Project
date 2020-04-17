/*************************************************************************************
Description: Server config file for COLA rate change project. This file contains the 
             locations of routes, public content, and templating content.
************************************************************************************/
require('dotenv').config();
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
const url = require('url');

var session = require('express-session');
var mysql = require('./dbcon.js');

var passport=require('passport')
var MySQLStore = require('express-mysql-session')(session);




//var auth = require('./auth/auth');
let hbs = require('express-handlebars').create({
	defaultLayout: 'main',
	extname: 'hbs',
	layoutDir: `${__dirname}/views/layouts`,
	partialsDir: `${__dirname}/views/partials`
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));


var options = {
  host            : process.env.DB_HOST,
  user            : process.env.DB_USER,
  password        : process.env.DB_PASSWORD,
  database        : process.env.DB_NAME,
};

var sessionStore = new MySQLStore(options);
var bcrypt = require('bcrypt');
var passport=require('passport');
const saltRounds = 10;

app.use(session({
  secret: process.env.SESSION_PASSWORD,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
 
 // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());


require('./routes/routes.js')(app);
require('./routes/ajax_routes.js')(app, mysql);
app.use(express.static('public'));



app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', (__dirname) + '/views')
app.set('port', 10000);

const crcs = require('./server_functions/cola_rates_script.js')
crcs.schedule_crcs();

let cssFile;
app.get(`/css/${cssFile}`, function (req, res) {
    res.send(`/css/${cssFile}`);
    res.end();
});
let jsFile;
app.get(`/js/${jsFile}`, function (req, res) {
	res.send(`/js/${jsFile}`);
	res.end();
});
let imgFile;
app.get(`/img/${imgFile}`, function (req, res) {
	res.send(`/img/${imgFile}`);
	res.end();
});
let uswdsFile;
app.get(`/uswds/${uswdsFile}`, function (req, res) {
	res.send(`/uswds/${uswdsFile}`);
	res.end();
});

/* Error routes only used if none of the above routes return */
app.use(function (req, res) {
    console.log(req);
    console.log('404 route');
	res.status(404);
	res.render('404');
});

app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.type('plain/text');
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
