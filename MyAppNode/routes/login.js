var express = require('express');
var router = express.Router();

//Connect string to Oracle
var connectData = { 
		"hostname": "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com", 
		"user": "visp", 
		"password": "foreignkey99", 
		"database": "TRIPSTER" };
var oracle =  require("oracle");

LoginErrorCodeEnum = {
	    CONNECTION_ERROR : 0,
	    INCORRECT_ID_PASSWORD : 1
};

SuccessEnum = {
		SUCCESS : 1,
		FAIL : 0
};

console.log("INCORRECT : "+LoginErrorCodeEnum.CONNECTION_ERROR);
/////
//Query the oracle database, and call output_actors on the results

//res = HTTP result object sent back to the client
//name = Name to query for
function query_db(res,username,password) {
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",
			var cmd = "SELECT firstname, lastname, affiliation, photo\_url FROM users " +
			"WHERE username = '"+username+"' AND password = '"+password+"'";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, results) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{
						console.log(results);
						console.log("length : ", results.length);
						connection.close(); // done with the connection
						
						if(results.length!=0)
						{	
							console.log(results[0].PHOTO_URL);
							output_actors(res, username, results);
						}
						else
						{
							handleLoginError(res, LoginErrorCodeEnum.INCORRECT_ID_PASSWORD);
						}
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}

/*
 * 
 */
function handleLoginError(res, errorCode){
	
	switch(errorCode){
	case LoginErrorCodeEnum.CONNECTION_ERROR :
		res.render('index.jade',
						{
							success : SuccessEnum.FAIL,
							error : LoginErrorCodeEnum.CONNECTION_ERROR
						});
		break;
		
	case LoginErrorCodeEnum.INCORRECT_ID_PASSWORD :
		res.render('index.jade', {
					success : SuccessEnum.FAIL,
					error : LoginErrorCodeEnum.INCORRECT_ID_PASSWORD
				  });
		break;
	};
}
/////
//Given a set of query results, output a table

//res = HTTP result object sent back to the client
//name = Name to query for
//results = List object of query results
function output_actors(res,username,results) {
	res.render('home.jade',
			{ title: "Username " + username,
		results: results }
	);
}

/////
/* GET home page. */
router.get('/', function(req, res) {
	//.render('home.jade');
	query_db(res,req.query.username, req.query.password);
};

module.exports = router;