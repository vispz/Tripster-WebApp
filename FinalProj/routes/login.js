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
//Query the oracle databases

//res = HTTP result object sent back to the client
//name = Name to query for
function query_db(req, res, username, password) {
	
	// If values have already been cached
	if ( req.session && req.session.name && req.session.firstname && req.session.photo_url ){
		loadNumOfAttribs(req, res, username);
		return;
	}

	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",
			var cmd = "SELECT firstname, lastname, photo\_url FROM users " +
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
						
						//success
						if(results.length!=0)
						{	
							console.log("\n\n\nUser info : ", results);
							console.log("Photo url : ", results[0].PHOTO_URL);
							req.session.name = username;
							req.session.firstname = results[0].FIRSTNAME;
							req.session.photo_url = results[0].PHOTO_URL;
							loadNumOfAttribs(req, res, username);
							
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


function loadNumOfAttribs(req, res, username)
{

	// If values have already been cached
	if ( req.session.no_trips && req.session.no_albums && req.session.no_friends ){
		loadFriendRequests(req, res, username);
		return;
	}

	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",

			var cmd = 
			"WITH USER\_TRIPS AS " +
				"( "+
					"SELECT ID AS TRIP\_ID FROM TRIPS WHERE ADMIN = '"+ username +"' "+
				"), "+
				"NUM\_TRIPS AS " + 
				"( "+
					"SELECT COUNT(*) AS NO\_TRIPS FROM USER_TRIPS "+
				"), "+
				" NUM\_FRIENDS AS " +
				"( " +
					"SELECT COUNT(F.USERNAME2) AS NO\_FRIENDS FROM FRIENDS F WHERE F.USERNAME1 = '"+ username +"' AND F.STATUS = 'accepted'), "+
				"NUM\_ALBUMS AS "+
				"( "+
					" SELECT COUNT(A.ID) AS NO\_ALBUMS "+
					" FROM ALBUMS A INNER JOIN USER_TRIPS UT ON A.TRIP\_ID = UT.TRIP\_ID "+
				") "+
				"SELECT NO\_TRIPS, NO\_ALBUMS, NO\_FRIENDS FROM NUM\_TRIPS, NUM\_ALBUMS, NUM\_FRIENDS ";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, num_results) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{	
						//success
						console.log("\n\nnum info : ", num_results);
						req.session.no_trips = num_results[0].NO_TRIPS;
						req.session.no_albums = num_results[0].NO_ALBUMS;
						req.session.no_friends = num_results[0].NO_FRIENDS;
						loadFriendRequests(res, req, username);
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}

function loadFriendRequests(res, req, username)
{

	// If values have already been cached
	if ( req.session && req.session.friend_requests ){
		loadTripRequests(req, res, username);
		return;
	}
	
	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",

			var cmd = 
			"SELECT U.username AS friend_username, U.firstname AS friend\_firstname, U.lastname as friend\_lastname, "+
				"U.photo\_url as friend_photo\_url "+
				"FROM FRIENDS F INNER JOIN USERS U ON F.USERNAME2 = U.USERNAME "+
				"WHERE F.USERNAME1 = '"+username+"' AND "+
				"F.STATUS = 'pending'";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, friend_requests_results) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{	
						//success
						console.log("\n\nfriend_requests_results info : ", friend_requests_results);
						req.session.friend_requests = friend_requests_results;
						loadTripRequests(res, req, username);
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}


function loadTripRequests(res, req, username)
{

	// If values have already been cached
	if ( req.session && req.session.trip_requests_results ){
		render_home(res, req, username);
		return;
	}
	
	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {

			var cmd = 
			"SELECT T.ID as TRIP\_ID, T.NAME as TRIP\_NAME "+
			"FROM PARTICIPATES P INNER JOIN TRIPS T ON T.ID = P.TRIP_ID "+
			"WHERE P.USERNAME = '"+ username+"' AND P.RSVP = 'pending'";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, trip_requests_results) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{	
						//success
						console.log("\n\ntrip_requests_results info : ", trip_requests_results);
						req.session.trip_requests = trip_requests_results;
						render_home(res, req, username);
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
		var errorMsg = "Connection error occurred";
		console.log(errorMsg);
		res.render('index.jade',
						{
							success : SuccessEnum.FAIL,
							error : errorMsg
						});
		break;
		
	case LoginErrorCodeEnum.INCORRECT_ID_PASSWORD :
		var errorMsg = "Incorrect id and password";
		console.log(errorMsg);
		res.render('index.jade', {
					success : SuccessEnum.FAIL,
					error : errorMsg
				  });
		break;
	};
}
/////
//Given a set of query results, output a table

//res = HTTP result object sent back to the client
//name = Name to query for
//results = List object of query results
function render_home(res, req,username) {
	console.log("REQ SESSION : ", req.session);
	var retVal = { results: req.session };
	console.log("LOGIN -> HOME VALS : ", retVal);
	res.render('home.jade', retVal);
}

/////
/* POST home page. */
router.post('/', function(req, res) {

	console.log('\nin router.post');
	console.log('\n-- -----------');
	console.log('req : ', req.session)
	
	// If cache result is present
	if(req.session.name){
		console.log("\n\n\nCached defined");
		render_home(res, req, req.session.name);
	}
	else
	{
		reqbody = req.body;
		query_db(req, res,reqbody.username, reqbody.password);
	}
});

router.get('/', function(req, res){
	
	console.log('req session in get : ', req.session);
	if(req.session.name)
	{
		console.log("\n\n\nCached defined");
		render_home(res, req, req.session.name);
	}
	else
	{
		res.redirect('/');
	}
});

module.exports = router;
