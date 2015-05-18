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

var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, *');

        // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    };
};
app.use(enableCORS);

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

	socket.on('message',function(message){
		log( 'S --> Got message: ' , message );
		socket.boardcast.to(message.channel).emit('message', message.message);
	});

	socket.on('create or join',function(channel){
		console.log(socket.id);
		// for (var socketId in io.nsps['/'].adapter.rooms[channel]) {
		// 	console.log(socketId);
		// }
		// var numclients = io.sockets.clients(channel).length;
		// console.log('number client = ' + numclients);

		// if(numclients == 0){
		// 	socket.join(channel);
		// 	socket.emit('created',channel);
		// }
		// else if(numclients == 1){
		// 	io.sockets.in(channel).emit('remotePeerJoining',channel);
		// 	socket.join(channel);
		// 	socket.boardcast.to(channel).emit('boardcast: joined','S --> broadcast(): client ' + socket.id + ' joined channel ' + channel);
		// }
		// else {
		// 	console.log("channel full");
		// 	socket.emit('full',channel);
		// }
	});

	socket.on('response',function(response){
		log('S ---> Got response', response);
		socket.boardcast.to(response.channel).emit('response',response.message);
	});

	socket.on('Bye',function(channel){
		socket.boardcast.to(channel).emit('Bye');
		socket.disconnect();
	});

	socket.on('Ack', function(){
		console.log('Got an Ack');
		socket.disconnect();
	});

	function log(){
		var array = [">>> "];
		for(var i = 0; i< arguments.length; i++){
			array.push(arguments[i]);
		}
		socket.emit('log',array);
	}
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

