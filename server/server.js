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

/* i commented out next couple lines as i am uncertain what we need exactly if we
   take care of authentication using passportjs or auth0. Do we need to hash with
   bcrypt still if we use authenticator package?
*/
//var auth = require('./auth/auth');
//var bcrypt = require('bcrypt');
//const saltRounds = 10;

let hbs = require('express-handlebars').create({
    defaultLayout: 'main',
    extname: 'hbs',
    layoutDir: `${__dirname}/views/layouts`,
    partialsDir: `${__dirname}/views/partials`
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*app.use(session({
    secret: process.env.SESSION_PASSWORD,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
	path: '/',
	secure: false,
	httpOnly: true,
	maxAge: 600 * 100000
    }
    
}));*/

require('./routes/routes.js')(app);
require('./routes/ajax_routes.js')(app,mysql);
app.use(express.static('public'));

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('port', 10000);

let cssFile;
app.get(`/css/${cssFile}`, function(req,res){
    res.send(`/css/${cssFile}`);
    res.end;
});
let jsFile;
app.get(`/js/${jsFile}`, function(req,res){
    res.send(`/js/${jsFile}`);
    res.end();
});
let imgFile;
app.get(`/img/${imgFile}`, function(req,res){
    res.send(`/img/${imgFile}`);
    res.end();
});

app.get(`/login`, function(req,res) {
	res.render('login')
});

/* Error routes only used if none of the above routes return */
app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
