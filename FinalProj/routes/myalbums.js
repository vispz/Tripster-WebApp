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
	query_db(res);
});

function query_db(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute("SELECT * FROM ALBUMS WHERE USERNAME ='" + username + "'",
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						myAlbumList(res, results);
					}
				});
		}
	});
}


function myAlbumList(res, results) {
	res.render('myalbums', {result: results});
}

module.exports = router;