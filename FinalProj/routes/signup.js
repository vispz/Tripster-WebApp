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
/////
//Query the oracle database, and call output_actors on the results

//res = HTTP result object sent back to the client
//name = Name to query for
function query_db(res, req, userDetails) {
	console.log("Req: ", req);
	var checkRes = checkInputs(req, userDetails);

	if (typeof(checkRes)== 'undefined')
		return;

	if (checkRes.success == SuccessEnum.FAIL)
	{
		res.render('index.jade',
		{
			success : SuccessEnum.FAIL,
			error : checkRes.errormsg
		});
		return;
	}
	var firstname = req.firstname;
	var lastname = req.lastname;
	var emailid = req.emailid;
	var dob = req.dob;
	var username = req.username;
	var password = req.password;
	

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",
			var cmd = "INSERT  INTO USERS(username, firstname, lastname, "+ 
				"email, dob, password) VALUES( "+ "'"+username+"',"+"'"+ 
				firstname+"',"+"'"+ lastname +"',"+ "'"+ emailid+"',"+"'"+ 
				dob+"',"+"'"+password+"'"+" )";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, dbRetVals) 
				{
					if ( err ) 
					{
						console.log("Error occurred in inserting");
						res.render('index.jade',
						{
							success : SuccessEnum.FAIL,
							error : "Connection error occurred please try later"
						});
					} 
					else 
					{
							console.log("Inserted successfully");
							getDefaultImage(res, req);	
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}

function getDefaultImage(res, req)
{

	var firstname = req.firstname;
	var lastname = req.lastname;
	var emailid = req.emailid;
	var dob = req.dob;
	var username = req.username;
	var password = req.password;

	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",
			var cmd = "SELECT photo_url FROM users WHERE username='default'";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, dbRetVals) 
				{
					var def_url;
					if ( err ) 
					{
						def_url ="";
					} 
					else 
					{
							
						def_url = dbRetVals[0].PHOTO_URL;
							
					}
	
					var results = [{FIRSTNAME : firstname, 
											LASTNAME : lastname,
											USERNAME: username,
											PHOTO_URL : def_url}];
					res.render('home.jade',
					{ results: results });	
				}); // end connection.execute
		}
	}); // end oracle.connect

}

/*Returns usernames and emailid in db
*/
function getUsersInDb(res, req)
{
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			var cmd = "SELECT username, email FROM users";
			console.log(cmd);
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
						query_db(res, req, userDetails);	
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
	
}

/*
* Parses input and checks to see if valid
*/
function checkInputs(req, userDetails)
{

	var isSuccess, msg;
	isSuccess = SuccessEnum.SUCCESS;
	
	var usernameGn = req.username;
	var emailidGn = req.emailid;
	console.log("userDetails in checkInputs" , userDetails);
	console.log("req in checkInputs" , req);


	if (typeof(userDetails)== 'undefined'){
		console.log("in checkInputs userDetails undefined")
		return;
	}

	var arraySz = userDetails.length;
	for(var i=0; i < arraySz; i++)
	{
		if ( userDetails[i].USERNAME == usernameGn )
		{
			isSuccess = SuccessEnum.FAIL;
			msg = "Username already in db";
			break;
		}
		else if ( userDetails[i].EMAIL == emailidGn )
		{
			isSuccess = SuccessEnum.FAIL;
			msg = "An account with that id already exists in db";
			break;
		}
	}
	var retVal;
	if(isSuccess == SuccessEnum.SUCCESS)
	{
		console.log("Valid input checkInputs")
		retVal = {
					success : SuccessEnum.SUCCESS,
					errormsg : ""					
				};
	}
	else
	{
		console.log("Invalid input checkInputs"+msg);
		retVal = {
					success : SuccessEnum.FAIL,
					errormsg : msg
				};
	}
	return retVal;
}

/////
/* GET home page. */
router.post('/', function(req, res) {
	//.render('home.jade');
	console.log(req.body)
	getUsersInDb(res,req.body);
	
});

module.exports = router;
