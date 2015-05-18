var express = require('express');

var app = express();
var routes = require('./routes');
var errorHandlers = require('./middleware/errorhanlers');
var log = require('./middleware/log');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var partials = require('express-partials');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var util = require('./middleware/ultilities');
var flash = require('connect-flash');
var config = require('./config/config');
var io = require('socket.io').listen(config.socketPort);

io.sockets.on('connection', function(socket){
	socket.on('join',function(data){
		io.sockets.emit('userJoined',data);
		socket.username = data.username;
	})
	// socket.emit('ping');

	socket.on('ping',function(data,done){
		console.log(data);
		socket.get('username',function(err,username){
			if(err) throw err;
			io.sockets.emit('ping', { username: username});
			done('ack');
		});
	});
})
// app.get('*',function(req,res){
// 	res.send("Express");
// })
app.use(partials());
app.use(flash());
app.use(util.templateRoutes);

app.set('view engine','ejs');
app.set('view option', { defaultLayout: 'layout'});
app.use(log.logger);
app.use(session({
	saveUninitialized: true,
	resave: true,
	store: new RedisStore({
		url: config.redisUrl
	}),
	secret: config.secret,
}));
app.use(cookieParser('123456'));

app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(csrf());
app.use(util.csrf);
app.use(util.authenticated);
app.get(config.routes.index,routes.index);
app.get(config.routes.login,routes.login);
app.get(config.routes.chat,[util.requireAuthentication],routes.chat);
app.post(config.routes.login,routes.loginProcess);
// app.get(config.routes.profile, [util.requireAuthentication], routes.profile);
app.get(config.routes.logout,[util.requireAuthentication], routes.logOut);
app.get('/error',function(req, res, next){
	next(new Error('A contrived error'));
});

app.use(function(req, res, next){
	if(req.session.pageCount){
		req.session.pageCount++;
	}
	else{
		req.session.pageCount = 1;
	}
	next();
})
app.use(errorHandlers.notFound);
app.use(errorHandlers.error);

app.listen(config.port,function(){
	console.log('app server run at ' + config.port);
});

