var util = require('../middleware/ultilities');
var config = require('../config/config');
module.exports.index = index;

module.exports.login = login;
module.exports.loginProcess = loginProcess;
module.exports.chat = chat;
module.exports.logOut = logOut;
function index(req,res) {
	// res.send('Index');
	res.cookie('IndexCookie', 'This was set from Index');
	res.clearCookie('IndexCookie');
	res.render('index', { 
		title: "Index",
		cookie: JSON.stringify(req.cookies),
		session: JSON.stringify(req.session),
		signedCookie: JSON.stringify(req.signedCookies)
	});
}

function login(req,res){
	res.render('login', {
		title: 'login',
		message: req.flash('error')
	});
}

function loginProcess(req,res){
	// res.send(req.body.username + ' ' + req.body.password);
	// res.redirect('/');
	var isAuth = util.auth(req.body.username, req.body.password, req.session);
	if( isAuth ){
		res.redirect(config.routes.chat);
	}
	else{
		req.flash('error', 'Wrong Username or Password');
		res.redirect(config.routes.chat);
	}
}

function chat(req,res){
	res.send('Chat');
}

function logOut(req, res){
	util.logout(req.session);
	res.redirect(config.routes.index);
}

