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
		//loadNumOfAttribs(req, res, username);
		loadFriendRequests(res, req, username);
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
			var cmd = "SELECT firstname, lastname, photo\_url, email, interests, affiliation, dob FROM users " +
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
							req.session.lastname = results[0].LASTNAME;
							req.session.photo_url = results[0].PHOTO_URL;
							req.session.interests = results[0].INTERESTS;
							req.session.affiliation = results[0].AFFILIATION;
							req.session.email = results[0].EMAIL;
							req.session.dob = results[0].DOB;
							loadFriendRequests(res, req, username);
							//loadNumOfAttribs(req, res, username);
							
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
				"F.STATUS = 'pending' AND F.SENT_BY != F.USERNAME1";
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
						loadTripsNewsFeed(res,req, username, true);
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}


function loadTripsNewsFeed(res, req, username, toRender)
{
	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {

			var cmd = 
			"SELECT U.USERNAME AS FRIEND\_USERNAME, U.FIRSTNAME AS FRIEND\_FIRSTNAME, U.LASTNAME AS FRIEND\_LASTNAME, "+
			" T.ID as TRIP\_ID, T.NAME as TRIP\_NAME "+
			"FROM USERS U INNER JOIN FRIENDS F ON U.USERNAME = F.USERNAME2 "+
			"INNER JOIN PARTICIPATES P ON P.USERNAME = U.USERNAME "+
			"INNER JOIN TRIPS T ON T.ID = P.TRIP_ID "+
			"WHERE F.USERNAME1 = '"+ username+"' AND P.RSVP = 'accepted' "+
			"AND F.STATUS ='accepted' AND ROWNUM <= 2";
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, newsfeed_trips_results) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{	
						//success
						console.log("\n\newsfeed_trips_results info : ", newsfeed_trips_results);
						loadAlbumsNewsFeed(res, req, username, newsfeed_trips_results, toRender);
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect	
}


function loadAlbumsNewsFeed(res, req, username, newsfeed_trips, toRender)
{
	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			console.log(err);
		} else {

			var cmd = 
				"WITH USER\_ALBUMS AS " +
				"( " +
				" SELECT U.USERNAME as FRIEND\_USERNAME, U.FIRSTNAME AS FRIEND\_FIRSTNAME, " +
				" U.LASTNAME AS FRIEND\_LASTNAME,A.ID AS ALBUM\_ID , A.NAME AS ALBUM\_NAME  " +
				" FROM USERS U     INNER JOIN FRIENDS F ON U.USERNAME = F.USERNAME2  " +
				" INNER JOIN ALBUMS A ON A.USERNAME = U.USERNAME   " +
				" WHERE F.USERNAME1 = '"+username+"' AND F.STATUS = 'accepted' AND ROWNUM <= 10), " +
				" ALL\_PHOTOS AS " +
				" ( " +
				" SELECT M.ID AS PHOTO\_ID, UA.FRIEND\_USERNAME, UA.FRIEND\_FIRSTNAME, " +
				" UA.FRIEND\_LASTNAME, UA.ALBUM\_ID , UA.ALBUM\_NAME " +
				" FROM MEDIA M  " +
				" INNER JOIN USER\_ALBUMS UA ON M.ALBUM\_ID = UA.ALBUM\_ID " +
				" WHERE M.TYPE = 'photo')," +
				" CHOSEN\_PHOTOS AS " +
				" ( SELECT MIN(PHOTO\_ID) AS PHOTO\_ID, FRIEND\_USERNAME, FRIEND\_FIRSTNAME," +
				" FRIEND\_LASTNAME, ALBUM\_ID , ALBUM\_NAME " +
				" FROM ALL\_PHOTOS " +
				" GROUP BY FRIEND\_USERNAME, FRIEND\_FIRSTNAME, FRIEND\_LASTNAME, ALBUM\_ID , " +
				" ALBUM\_NAME" +
				" ) " +
				" SELECT CP.PHOTO\_ID, CP.FRIEND\_USERNAME, CP.FRIEND\_FIRSTNAME, CP.FRIEND\_LASTNAME" +
				" , CP.ALBUM\_ID , CP.ALBUM\_NAME, M.URL AS PHOTO\_URL " +
				" FROM CHOSEN\_PHOTOS CP " +
				" INNER JOIN MEDIA M ON M.ID = CP.PHOTO\_ID ";
			
			console.log(cmd);
			connection.execute(cmd, 
						[], 
				function(err, newsfeed_albums) 
				{
					if ( err ) 
					{
						handleLoginError(res, LoginErrorCodeEnum.CONNECTION_ERROR);
					} 
					else 
					{	
						//success
						console.log("\n\nnewsfeed_albums info : ", newsfeed_albums);
						render_home(res, req, username, newsfeed_albums, newsfeed_trips);
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
function render_home(res, req,username,newsfeed_albums, newsfeed_trips) {
	console.log("REQ SESSION : ", req.session);
	var retVal = { results: req.session,
					newsfeed_trips : newsfeed_trips,
					newsfeed_albums : newsfeed_albums };
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
		loadTripsNewsFeed(res, req, req.session.name, false);
	}
	else
	{
		reqbody = req.body;
		query_db(req, res,reqbody.username, reqbody.password);
	}
});

router.get('/', function(req, res){
	
	console.log('\n\n\n\n\n\nreq session in get OF LOGIN : ', req.session);
	if(req.session.password!==undefined)
	{
		console.log('\n\n\n\n\n\nreq session in get OF LOGIN ');
		var sha1=crypto.createHash('sha1');
		password=sha1.update(req.session.password);
		req.session.password = undefined;
		query_db(req, res,req.session.username, password);
	}
	else if(req.session.name)
	{
		console.log("\n\n\nCached defined");
		loadTripsNewsFeed(res, req, req.session.name, false);
		
	}
	else
	{
		res.redirect('/');
	}
});

module.exports = router;
