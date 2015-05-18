exports.notFound = function notFound(req,res,next){
	res.status(404).send('you seem lost. you must taken a wrong turn back there');
};

exports.error = function error(err, req, res, next){
	console.log(err);
	res.status(500).send('something broken');
};