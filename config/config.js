var redis = require('redis-url').connect();


var config = {
	port: 3000,
	socketPort:4000,
	secret: 'secret',
	redisUrl: redis.url,
	routes: {
		index: '/',
		profile: '/profile',
		login: '/login',
		logout: '/logout',
		chat: '/chat'
	}
};

module.exports = config;