var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");
var username = 'lsn';
var album_id; // Set during get
var media_id; // Set during post
var loc_id; // Set during post
var caption; // Set during post
var imageurl; // Set during post
var type; // Set during post


router.get('/', function(req, res) {
	album_id = req.query.albumid;
	res.render('addmedia', {album: album_id});
});

router.post('/', function(req, res) {
	//res.send(req.body);
	//res.send(album_id);
	caption = req.body.caption;
	imageurl = req.body.imageurl;
	type = req.body.type;
	album_id = req.body.albumid;
	//res.send(req.body.albumid);
	//res.send(album_id + " " + media_id + " " + caption + " " + loc_id + " " + imageurl + " " + type);
	query_db(res, req);
});

// Queries the database and sets value for the new media_id and the loc_id associated with new media.
function query_db(res, req) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute("SELECT MAX(ID) AS MAX FROM MEDIA",
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						media_id = parseInt(JSON.stringify(results[0].MAX)) + 1;
					}
				});

			connection.execute("SELECT L.LOC_ID FROM TRIP_LOCATION L INNER JOIN ALBUMS A ON A.TRIP_ID = L.TRIP_ID WHERE A.ID = " + album_id,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						loc_id = parseInt(JSON.stringify(results[0].LOC_ID));

						add_media(res);
					}
				});
		}
	});
}

// Write a function to add media to MEDIA table.
function add_media(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			//console.log(album_id + " " + media_id + " " + caption + " " + loc_id + " " + imageurl + " " + type);
			var cmd = "INSERT INTO MEDIA VALUES(" + media_id + ", " + "'" + caption + "'" + ", " + loc_id + ", " + "'" + imageurl + "'" + ", " + album_id + ", " + "'" + type + "'" + ")";
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						returnToAlbum(res)
					}
				});
		}
	});
}



function returnToAlbum(res) {
	res.redirect('/media?albumid=' + album_id);
}

module.exports = router;