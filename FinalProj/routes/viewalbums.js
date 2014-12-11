var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");
var trip_id;

router.get('/', function(req, res) {
	trip_id = req.query.tripid;
	query_db(res);
});

function query_db(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute("SELECT ID, NAME, TRIP_ID FROM ALBUMS WHERE TRIP_ID = " + trip_id + " AND PRIVACY = 'public' OR PRIVACY = 'sharedWithTripMembers'",
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