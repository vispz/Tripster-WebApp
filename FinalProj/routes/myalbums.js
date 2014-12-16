var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");
var username;

router.get('/', function(req, res) {
	username = req.session.name;
	query_db(res, req);
});

function query_db(res, req) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute("SELECT id, name FROM ALBUMS WHERE USERNAME ='" + username + "'",
				[],
				function(err, albums) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						myAlbumList(res, { results : req.session, albums :albums });
					}
				});
		}
	});
}


function myAlbumList(res, results) {
	res.render('myalbums',results);
}

module.exports = router;