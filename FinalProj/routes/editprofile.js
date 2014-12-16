var express = require('express');
var router = express.Router();

//Connect string to Oracle
var connectData = { 
		"hostname": "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com", 
		"user": "visp", 
		"password": "foreignkey99", 
		"database": "TRIPSTER" };
var oracle =  require("oracle");



/* render page */
router.get('/', function(req, res) {
	
	// Delete session variables when 
	// entering login page.
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
	console.log('In get editprofile');
	var retVal = { results: req.session};
	console.log("RETVAL",retVal);
  	res.render('editprofile.jade', retVal);
  	}
});


router.post('/', function (req, res){
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
	console.log('In post editprofile');
	saveData(res, req);
	}
});
module.exports = router;
