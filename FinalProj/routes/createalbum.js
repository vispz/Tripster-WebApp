var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};
var oracle = require("oracle");
var username ;
var trip_id;
var albumname;
var privacy;
var new_album_id;

router.get('/', function(req, res) {
	username = req.session.name;

	if(!req.session.name)
	{	
		res.render('index.jade',
						{
							success : 0,
							error : "Please log in first"
						});
	}
	else
	{
username = req.session.name;
	trip_id = req.query.tripid;
	//res.send(trip_id)
	console.log("In get trip_id : ", trip_id );
	res.render('createalbum', {TRIP_ID: trip_id});
	}
});

// This method is responsible for when user clicks create album button.
// It should send data to RDS to save new album and return a page to add media to that album.
// For now, I'm just printing to the screen the new album information.
// Still need to know how to get username and trip_id to save new album instance.
router.post('/', function(req, res) {
	if(!req.session.name)
	{	
		res.render('index.jade',
						{
							success : 0,
							error : "Please log in first"
						});
	}
	else
	{
	console.log("In post trip_id : ", trip_id );
	console.log(typeof(trip_id));

username = req.session.name;
	trip_id = parseInt(req.body.trip_id);
	//trip_id = req.body.trip_id;
	

	albumname = req.body.albumname;
	privacy = req.body.privacy;
	//res.send(req.body);
	getNewAlbumID(res, req, trip_id);
	}
});


function getNewAlbumID(res, req, trip_id) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
			connection.execute("SELECT MAX(ID) AS MAX FROM ALBUMS",
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						new_album_id = parseInt(JSON.stringify(results[0].MAX)) + 1;
						create_album(res, trip_id);
					}
				});
		}
	});
}

function create_album(res, trip_id) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			var cmd = "INSERT INTO ALBUMS(ID, NAME, USERNAME, TRIP_ID, PRIVACY) VALUES(" + new_album_id + ", '" + albumname + "', '" + username + "', " + trip_id + ", '" + privacy +  "')";
			connection.execute(cmd,
				[], 
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						res.redirect('/viewalbums?tripid=' + trip_id);
					}
				});
		}
	});
}

module.exports = router;