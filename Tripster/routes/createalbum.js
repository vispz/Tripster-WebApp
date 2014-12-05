var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	res.render('createalbum');
});

// This method is responsible for when user clicks create album button.
// It should send data to RDS to save new album and return a page to add media to that album.
// For now, I'm just printing to the screen the new album information.
// Still need to know how to get username and trip_id to save new album instance.
router.post('/', function(req, res) {
	var albumName = req.body.albumname;
	var privacy = req.body.privacy;
	var html = 'The new album is titled ' + albumName +
	'and its privacy is set to ' + privacy;

	res.send(html);
});

module.exports = router;