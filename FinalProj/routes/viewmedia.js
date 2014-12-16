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
var album_id;

//For post request - add comments, ratings to media
var media_ref;
var comment;
var rating;

router.get('/', function(req, res) {
	username = req.session.name;
	album_id = req.query.albumid;
	getMedia(res, req);
});

router.post('/', function(req, res) {
	//res.send(req.body);
	username = req.session.name;
	album_id = req.body.albumid;
	media_ref = req.body.photoid;
	comment = req.body.comments;
	rating = req.body.ratings;
	add_comments(res);

	// if (req.body.comments != "") {
	// 	add_comments(res, req.body.comments, req.body.photoid)
	// } else if (req.body.ratings != "") {
	// 	add_rating(res, req.body.ratings, req.body.photoid)
	// } else {
	// 	res.render('viewmedia')
	// }
});

function add_comments(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			var cmd = "INSERT INTO RATE_MEDIA(USERNAME, MEDIA_ID, RATING, COMMENTS) VALUES(" + "'" + username + "'" + ", " + media_ref + ", " + rating + ", " + "'" + comment + "'" + ")";
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						res.redirect('/media?albumid=' + album_id);
					}
				});
		}
	});
}

// Original!!!!
// function query_db(res, req) {
// 	oracle.connect(connectData, function(err, connection) {
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
// 			connection.execute("SELECT M.ID, M.URL, A.NAME, R.COMMENTS, R.RATING FROM MEDIA M, ALBUMS A, RATE_MEDIA R WHERE M.ALBUM_ID = A.ID AND A.ID = " + album_id + " AND R.MEDIA_ID = M.ID ORDER BY M.ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						output_media(res, results);
// 					}
// 				});
// 		}
// 	});
// }

// // How to do 2 queries in one function
// function query_db(res, req) {
// 	oracle.connect(connectData, function(err, connection) {
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
// 			connection.execute("SELECT M.ID, M.URL, A.NAME, R.COMMENTS, R.RATING FROM MEDIA M, ALBUMS A, RATE_MEDIA R WHERE M.ALBUM_ID = A.ID AND A.ID = " + album_id + " AND R.MEDIA_ID = M.ID ORDER BY M.ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						var query1 = results;
// 						output_media(res, results);
// 					}
// 				});

// 			connection.execute("SELECT MEDIA_ID, COMMENTS FROM RATE_MEDIA ORDER BY MEDIA_ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						var query2 = results;

// 						output_media(res, results);
// 					}
// 				});
// 		}
// 	});
// }


function getMedia(res, req) {
	var cmd = "WITH REQ_MEDIA AS( SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ") SELECT Q.CAPTION, Q.URL, Q.ALBUM_ID, Q.NAME, Q.MEDIA_ID, AVG(R.RATING) AS AVG_RATING FROM REQ_MEDIA Q LEFT JOIN RATE_MEDIA R ON Q.MEDIA_ID = R.MEDIA_ID GROUP BY Q.MEDIA_ID, Q.CAPTION, Q.URL, Q.ALBUM_ID, Q.NAME"
	//var cmd = "SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ")";
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						getMediaResults(res, req, results);
					}
				});
		}
	});
}

function getMediaResults(res, req, media_results) {
	var cmd = "WITH REQ_MEDIA AS( SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ") SELECT R.MEDIA_ID, U.USERNAME, R.COMMENTS, U.FIRSTNAME, U.LASTNAME FROM RATE_MEDIA R INNER JOIN REQ_MEDIA Q ON R.MEDIA_ID = Q.MEDIA_ID INNER JOIN USERS U ON U.USERNAME = R.USERNAME";
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						var media_results_info = results;
						for (var i = 0; i < media_results.length; i ++) {
							media_results[i].comments = [];
						}

						for (var i = 0; i < media_results.length; i ++) {
							for(var j = 0; j <media_results_info.length; j++) {
								if(media_results[i].MEDIA_ID==media_results_info[j].MEDIA_ID) {
									media_results[i].comments.push(media_results_info[j]);
								}
							}
						}
						output_media(res, media_results);


					}
				});
		}
	});
}


function output_media(res, results) {
	if (are_results_empty(results)) {
		res.redirect('/addmedia?albumid=' + album_id);
	} else {
		res.render('viewmedia', {result: results});
	}
}

function are_results_empty(results) {
	return !Object.keys(results).length;
}

module.exports = router;