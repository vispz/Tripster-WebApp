var express = require('express');
var router = express.Router();

//Connect string to Oracle
var connectData = { 
		"hostname": "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com", 
		"user": "visp", 
		"password": "foreignkey99", 
		"database": "TRIPSTER" };
var oracle =  require("oracle");

// Indicator class for success or failure.
SuccessEnum = {
		SUCCESS : 1,
		FAIL : 0
};
// Indicator class saying what type of error occurred.
LoginErrorCodeEnum = {
	    CONNECTION_ERROR : 0,
	    INCORRECT_ID_PASSWORD : 1
};
console.log("INCORRECT : "+LoginErrorCodeEnum.CONNECTION_ERROR);

function queryDb(res, req)
{
	var username = req.session.name;
	var friend_username = req.query.friendusername;
	var isAccepted = req.query.accepted;

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			
			var cmd;
			if (isAccepted==true || isAccepted =='true')
			{
				cmd = "UPDATE friends SET status='accepted' WHERE (username1='"+username+"' AND username2 = '"
					+friend_username+"' ) "+
				" OR (username2= '"+username+"' AND username1 = '"+friend_username +"')";
			}
			else if (isAccepted==false || isAccepted =='false')
			{
				cmd = "DELETE FROM friends WHERE (username1='"+username+"' AND username2 = '"
					+friend_username+"' ) "+
				" OR (username2= '"+username+"' AND username1 = '"+friend_username +"')";
			}
				
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
						if (isAccepted==true || isAccepted == 'true')
							req.session.no_friends = req.session.no_friends+1; 
						for (var i = 0 ; i < req.session.friend_requests.length; i++)
							if (req.session.friend_requests[i].FRIEND_USERNAME == friend_username )
							{
								req.session.friend_requests.splice(i,1);
								res.redirect('/login');
							}
					}
				}); // end connection.execute
		}
	}); // end oracle.connect

}
/////
/* GET home page. */
router.get('/', function(req, res) {
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
	console.log("Req query for friendAcceptance : "+req.query)
	queryDb(res,req);
	}	
});

module.exports = router;
