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
	//res.render('viewmedia');
});

function query_db(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
			connection.execute("SELECT M.URL, A.NAME, R.COMMENTS FROM MEDIA M, ALBUMS A, RATE_MEDIA R WHERE M.ALBUM_ID = A.ID AND A.ID = 11 AND R.MEDIA_ID = M.ID ORDER BY A.NAME, M.ID",
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
	res.render('viewmedia', {result: results});
	//res.send(results)
}

module.exports = router;