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

function saveData(req,res)
{
	var password = req.query.password;
	var email = req.query.email;
	var affiliation = req.query.affiliation;
	var lastname = req.query.lastname;
	var firstname = req.query.firstname;
	var photo_url = req.query.photo_url;
	var interests = req.query.interests;

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			if (req.body.new_password)
				var cmd = "INSERT INTO users( password, dob, firstname, lastname, email, "+
					" affiliation, interests, photo_url ) values( "+ 
					"";
			else
			console.log("\n\n\n\n\n\n\n\n\n\n\n");
			console.log(cmd);
			console.log("\n\n\n\n\n\n\n\n\n\n\n");
			
			connection.execute(cmd, 
						[], 
				function(err, userDetails) 
				{
					if ( err ) 
					{	
						console.log("Error occurred while getting usernames and email ids from db");
						res.render('index.jade',
						{
							success : SuccessEnum.FAIL,
							error : "Connection error occurred please try later"
						});
						return;
					} 
					else 
					{
						console.log("successfully got usernames and email ids from db");
						console.log("userDetails", userDetails)
						connection.close(); // done with the connection	
						query_db(res, reqbody, userDetails, req);	
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
	
}


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
