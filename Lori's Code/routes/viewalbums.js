var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");

router.get('/', function(req, res) {

	query_db(res);
});

function query_db(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute("SELECT NAME FROM ALBUMS",
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						output_media(res, results);
					}
				});
		}
	});
}

function output_media(res, results) {
	res.render('viewalbums', {result: results});
}

module.exports = router;