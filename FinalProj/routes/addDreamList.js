var express = require('express');
var router = express.Router();

//Connect string to Oracle
var connectData = { 
		"hostname": "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com", 
		"user": "visp", 
		"password": "foreignkey99", 
		"database": "TRIPSTER" };
var oracle =  require("oracle");
var isPost = true;
function saveDream(res, req)
{	
	var username = req.session.name;
	if (isPost)
		var dream_loc_id = req.body.submitAddDreamList;
	else
		var dream_loc_id = req.query.submitAddDreamList;
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			
			var cmd;
			cmd = "INSERT INTO dreamlist(username, loc_id)"+
				" VALUES( '"+ username+"' , '"+ dream_loc_id+"' )";
				
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, dbRetVals) 
				{
					if ( err ) 
					{
						console.log(err);
						res.redirect('/login');
					} 
					else 
					{	
						res.redirect('/login');
					}
				}); // end connection.execute
		}
	}); // end oracle.connect

}

/////
/* GET home page. */
router.post('/', function(req, res) {
	isPost = true;
	console.log("Req query for friendAcceptance : "+req.body);
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
		saveDream(res,req);
	}
	//res.send( JSON.stringify(req.body.submitAddFriend.results ) );
});

/////
/* GET home page. */
router.get('/', function(req, res) {
	isPost = false;
	console.log("Req query for friendAcceptance : "+req.query);
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
		saveDream(res,req);
	}
	//res.send( JSON.stringify(req.body.submitAddFriend.results ) );
});


module.exports = router;
