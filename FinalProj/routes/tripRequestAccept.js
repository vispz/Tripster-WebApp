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
	var tripid = req.query.tripid;
	var isAccepted = req.query.accepted;

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			
			var cmd;
			if (isAccepted==true || isAccepted =='true')
			{
				cmd = "UPDATE participates SET rsvp='accepted' WHERE username='"+username+"' AND trip_id = "+tripid;
			}
			else if (isAccepted==false || isAccepted =='false')
			{
				cmd = "DELETE FROM PARTICIPATES WHERE USERNAME = '"+username+"' AND TRIP_ID = "+tripid;
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
							req.session.no_trips = req.session.no_trips+1; 
						for (var i = 0 ; i < req.session.trip_requests.length; i++)
							if (req.session.trip_requests[i].TRIP_ID == tripid )
							{
								req.session.trip_requests.splice(i,1);
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
	console.log("Req query for tripAcceptance : "+req.query)
	queryDb(res,req);
	
});

module.exports = router;
