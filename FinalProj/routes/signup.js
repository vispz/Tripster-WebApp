var express = require('express');
var router = express.Router();
var crypto=require('crypto');

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
function query_db(res, reqbody, userDetails, req) {
	console.log("reqbody: ", reqbody);
	var checkRes = checkInputs(reqbody, userDetails);

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

	var firstname = reqbody.firstname;
	var lastname = reqbody.lastname;
	var emailid = reqbody.emailid;
	var dob = reqbody.dob;
	var username = reqbody.username;
	var sha1=crypto.createHash('sha1');
	var password=sha1.update(reqbody.password).digest('hex');
	

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
						req.session.fromSignup = true;
						req.session.username = username;
						req.session.password = password;
						res.redirect('/login');
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}

/*Returns usernames and emailid in db
*/
function getUsersInDb(res, reqbody, req)
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
						query_db(res, reqbody, userDetails, req);	
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
	
}

/*
* Parses input and checks to see if valid
*/
function checkInputs(reqbody, userDetails)
{

	var isSuccess, msg;
	isSuccess = SuccessEnum.SUCCESS;
	
	var usernameGn = reqbody.username;
	var emailidGn = reqbody.emailid;
	console.log("userDetails in checkInputs" , userDetails);
	console.log("reqbody in checkInputs" , reqbody);


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
	getUsersInDb(res,req.body, req);
	
});

module.exports = router;