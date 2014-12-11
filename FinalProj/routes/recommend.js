var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");
var username = 'andrew_82'; // set to session

router.get('/', function(req, res) {
	query_db(res);
});


function query_db(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			//WHERE F.USERNAME2 = 'andrew_82';
			connection.execute("SELECT DISTINCT(L.NAME) FROM LOCATION L INNER JOIN TRIP_LOCATION T ON T.LOC_ID = L.ID INNER JOIN PARTICIPATES P ON P.TRIP_ID = T.TRIP_ID INNER JOIN FRIENDS F ON F.USERNAME1 = P.USERNAME WHERE F.USERNAME2 = '" + username +"'",
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						res.send(JSON.stringify(results));
					}
				});
		}
	});
}

module.exports = router;