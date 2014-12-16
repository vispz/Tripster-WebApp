var express = require('express');
var router = express.Router();

//Connect string to Oracle
var connectData = { 
		"hostname": "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com", 
		"user": "visp", 
		"password": "foreignkey99", 
		"database": "TRIPSTER" };
var oracle =  require("oracle");

function queryDb(res, req, isPost)
{	
	var username = req.session.name;
	if (isPost)
		var friend_username = req.body.submitAddFriend;
	else
		var friend_username = req.query.submitAddFriend;

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			
			var cmd;
			cmd = "INSERT INTO friends(username1, username2, status, sent_by) "+
				" VALUES( '"+ username+"' , '"+ friend_username+"'"+ ", 'pending', '"+ 
				username+"' )";
				
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, dbRetVals) 
				{
					if ( err ) 
					{
						console.log(err);
					} 
					else 
					{	
						if (isPost)
							res.redirect( '/login');
						else
							res.redirect('/login' );
					}
				}); // end connection.execute
		}
	}); // end oracle.connect

}
/* GET home page. */
 router.get('/', function(req, res) {
	console.log("Req query for friendAcceptance : "+req.query);
	if(!req.session.name){
		res.redirect('/');
	}
	else{
		queryDb(res,req, false);
	}
	//res.send( JSON.stringify(req.body.submitAddFriend.results ) );
});

/////
/* GET home page. */
router.post('/', function(req, res) {
	console.log("Req query for friendAcceptance : "+req.body);
	if(!req.session.name)
	{
		res.redirect('/');
	}
	else
	{
		queryDb(res,req, true);
	}
	//res.send( JSON.stringify(req.body.submitAddFriend.results ) );
});

module.exports = router;
