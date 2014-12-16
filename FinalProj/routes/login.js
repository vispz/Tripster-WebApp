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

var Db = require('mongodb').Db,
 MongoClient = require('mongodb').MongoClient,
 Server = require('mongodb').Server,
 ReplSetServers = require('mongodb').ReplSetServers,
 ObjectID = require('mongodb').ObjectID,
 Binary = require('mongodb').Binary,
 GridStore = require('mongodb').GridStore,
 Grid = require('mongodb').Grid,
 Code = require('mongodb').Code,
 BSON = require('mongodb').pure().BSON,
 assert = require('assert');
var sys = require('sys');
var base64_encode = require('base64').encode;
var Buffer1 = require('buffer').Buffer;
var http = require('http');
var request = require('request');


LoginErrorCodeEnum = {
	    CONNECTION_ERROR : 0,
	    INCORRECT_ID_PASSWORD : 1
};

SuccessEnum = {
		SUCCESS : 1,
		FAIL : 0
};

// console.log("INCORRECT : "+LoginErrorCodeEnum.CONNECTION_ERROR);
/////
//Query the oracle databases

//res = HTTP result object sent back to the client
//name = Name to query for
function query_db(req, res, username, password) {
	
	// If values have already been cached
	if ( req.session && req.session.name && req.session.firstname && req.session.photo_url ){
		// loadNumOfAttribs(req, res, username);
		loadFriendRequests(res, req, username);
		return;
	}

	// If values are obtained first time in this session
	oracle.connect(connectData, function(err, connection) {
		if ( err ) {
			// console.log(err);
		} else {
			// selecting rows
//			connection.execute("SELECT * FROM users WHERE last_name='" + name + 
//			"' AND rownum <= 10",
			var cmd = "SELECT firstname, lastname, photo\_url, email, interests, affiliation, dob FROM users " +
			"WHERE username = '"+username+"' AND password = '"+password+"'";
			// console.log(cmd);
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
						// console.log(results);
						// console.log("length : ", results.length);
						connection.close(); // done with the connection
						setsession(res,req,results,username,LoginErrorCodeEnum.INCORRECT_ID_PASSWORD);
						
						//success
						
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect
}

function setsession(res,req,results,username,errorcode) {
if(results.length!=0)
						{	
							// // console.log("\n\n\nUser info : ", results);
							// // console.log("Photo url : ", results[0].PHOTO_URL);
							req.session.name = username;
							req.session.firstname = results[0].FIRSTNAME;
							req.session.lastname = results[0].LASTNAME;
							req.session.photo_url = results[0].PHOTO_URL;
							req.session.interests = results[0].INTERESTS;
							req.session.affiliation = results[0].AFFILIATION;
							req.session.email = results[0].EMAIL;
							req.session.dob = results[0].DOB;
							// loadNumOfAttribs(req, res, username);
							loadFriendRequests(res, req, username);
							
						}
						else
						{	
							handleLoginError(res, LoginErrorCodeEnum.INCORRECT_ID_PASSWORD);
						}
}

function wrapProfilePhoto(res, req, results, index,username) {

        // console.log("enter wrap media");
        // // console.log(index);

        if (index == results.length) {
            setsession(res,req,results,username, LoginErrorCodeEnum.INCORRECT_ID_PASSWORD);
            return;
        }

        //connects to mongo client and database running at port 27017
        MongoClient.connect('mongodb://127.0.0.1:27017/media', function(err, db) {

            if (!err) {
                // console.log("We are connected");
            } else {
                return;
            }
            //placing the media id in check id and asking gridstore if the id exists
            var checkid = results[index].PHOTO_URL.toString();

            GridStore.exist(db, checkid, function(err, result) { //check if the file that we pushed to gridstore exists
                // console.log("are we in gridstore exists????????????");
                if(result) {
                    // console.log("exists is 1, that means found in cache!!!!");
                    getCacheUserPhoto(res,req,db,results,index,username);

                }
                else if(!result) {
                    // console.log("aDid not find in cache :( !!!");
                    addToCacheUserPhoto(res,req,db,results,index,username);

                }
                else if(err) {
                    // console.log("Error occured");
                    return;
                }
                else {
                    // // console.log(result);
                    // // console.log(exists);
                    // console.log(err);

                }

                // console.log("gridstore exists function closes!");
            });


       });
    } //end of function


function getCacheUserPhoto(res,req,db,results,index,username) {
 //reading the data from mongodb for checkid and storing it in fileData: this is the image in binary

                    var hasImage;
                    // console.log("Data is in Cache!");
                    GridStore.read(db, results[index].PHOTO_URL.toString(), function(err, fileData) { //to read the data from the grid store. now this data will be in binary

                        //var buf = new Buffer(fileData, 'base64'); // Ta-da
                        // console.log("reading image in base 64 done");
                        // read all the data in base64 format string
                        // console.log('Done');

                        hasImage = true;
                        results[index].image="data:image/jpeg;base64,"+fileData.toString('base64'); //setting the image in the JSON
                        results[index].hasImage = true; //setting the property that the JSON contains the image at the index
                        //res.write(fileData, 'binary');
                        //res.end(fileData,'binary');
                        //// console.log(fileData);
                        //// console.log('Really done');
                      
                        db.close(); //i have obtained the cached data and i close the database
                        wrapProfilePhoto(res, req, results, index + 1,username);

                    }); //end of gridstore read


}

function addToCacheUserPhoto(res,req,db,results,index,username) {
 // console.log("Data is NOT in cache, so cache it ! ");

 var hasImage;
                    hasImage = false;
                    results.image = null;
                    results.hasImage = false; //setting the property that the JSON  doesn't contain the image at the index
                    var fileId = results[index].PHOTO_URL.toString();
                    var urlm = results[index].PHOTO_URL;
                    // // console.log("FILEID : ", fileId);
                    // // console.log("URLM : ", urlm);
                    var gridStore = new GridStore(db, fileId, 'w');
                    gridStore.chunkSize = 1024 * 256;
                    // Open the file
                    gridStore.open(function(err, gridStore) {
                        // console.log("gridstore open!");
                        http.get(urlm, function(response) {
                            //this is the http request and we get a response and the body
                            response.setEncoding('binary');
                            var image2 = '';
                            // // console.log(urlm);
                            // console.log('reading data in chunks first');
                                response.on('data', function(chunk){
                                      image2 += chunk;
                                    // console.log('reading data');
                                  });

                                response.on('end', function() {

                            // console.log("requesting HTTTP DONE!");
                            var image = new Buffer(image2, 'binary'); //we take this body in binary form
                            // console.log("CONVERTING FILE TO BINARY, DONE!");
                            // Write some data to the file
                            gridStore.write(image, function(err, gridStore) { // the opened gridstore file is written with the binary image

                                assert.equal(null, err);
                                if (!err)
                                     console.log("WRITING THE IMAGE DONE! ", err);
                                else
                                     console.log("Error occurred"); // Close (Flushes the data to MongoDB)
                                gridStore.close(function(err, result) { //the gridstore file is closed()
                                    assert.equal(null, err);

                                    // Verify that the file exists
                                    GridStore.exist(db, fileId, function(err, result) { //check if the file that we pushed to gridstore exists
                                        assert.equal(null, err);
                                        assert.equal(true, result);

                                        // Read back all the written content and verify the correctness
                                        GridStore.read(db, fileId, function(err, fileData) { //to read the data from the grid store. now this data will be in binary
                                            assert.equal(image.toString('base64'), fileData.toString('base64'));

                                            // console.log("reading image in base 64 done");
                                            // read all the data in base64 format string
                                            // console.log('Done');
                                            // // console.log(typeof(fileData));
                                            db.close();
                                            wrapProfilePhoto(res, req, results, index + 1,username);

                                        });
                                    });
                                });
                            });
                        });
                    }).on('error', function(e) {
                        // console.log("Got error: " + e.message);
                        wrapProfilePhoto(res, req, results, index + 1,username);
                    });
            });

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
			// console.log(err);
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
			// console.log(cmd);
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
						// // console.log("\n\nnum info : ", num_results);
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
			// console.log(err);
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
			// console.log(cmd);
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
						// // console.log("\n\nfriend_requests_results info : ", friend_requests_results);
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
			// console.log(err);
		} else {

			var cmd = 
			"SELECT T.ID as TRIP\_ID, T.NAME as TRIP\_NAME "+
			"FROM PARTICIPATES P INNER JOIN TRIPS T ON T.ID = P.TRIP_ID "+
			"WHERE P.USERNAME = '"+ username+"' AND P.RSVP = 'pending'";
			// console.log(cmd);
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
						// // console.log("\n\ntrip_requests_results info : ", trip_requests_results);
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
			// console.log(err);
		} else {

			var cmd =
			" WITH PARTRIPS AS ( "+
			" SELECT P.TRIP\_ID "+
			" FROM PARTICIPATES P "+
			" WHERE P.USERNAME ='"+ username+"' ), " +
			" PUBTRIPS AS ( "+
			" SELECT T.ID AS TRIP\_ID FROM TRIPS T "+
			" WHERE T.PRIVACY='public' ), "+
			" GOODTRIPS AS ( "+
			" SELECT * FROM PARTRIPS UNION "+
			" SELECT * FROM PUBTRIPS ) "+
			" SELECT U.USERNAME AS FRIEND\_USERNAME, U.FIRSTNAME AS FRIEND\_FIRSTNAME, U.LASTNAME AS FRIEND\_LASTNAME, "+
			" T.ID as TRIP\_ID, T.NAME as TRIP\_NAME "+
			" FROM USERS U INNER JOIN FRIENDS F ON U.USERNAME = F.USERNAME2 "+
			" INNER JOIN PARTICIPATES P ON P.USERNAME = U.USERNAME "+
			" INNER JOIN TRIPS T ON T.ID = P.TRIP\_ID "+
			" INNER JOIN GOODTRIPS G ON G.TRIP\_ID=P.TRIP\_ID "+
			" WHERE F.USERNAME1 = '"+ username+"' AND P.RSVP = 'accepted' "+
			" AND F.STATUS ='accepted' AND ROWNUM <= 3"+
			" ORDER BY T.TS DESC";
			 // console.log(cmd);
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
						 // console.log("\n\newsfeed_trips_results info : ", newsfeed_trips_results);
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
			// console.log(err);
		} else {

			var cmd = 
				" WITH PARALBUMS AS ( "+
				" SELECT A.ID AS ALBUM\_ID"+
				" FROM PARTICIPATES P "+
				" INNER JOIN ALBUMS A ON A.TRIP\_ID = P.TRIP\_ID "+
				" WHERE P.USERNAME ='"+ username+"' ), " +
				" PUBALBUMS AS ( "+
				" SELECT A.ID AS ALBUM\_ID FROM ALBUMS A "+
				" WHERE A.PRIVACY='public' ), "+
				" GOODALBUMS AS ( "+
				" SELECT * FROM PARALBUMS UNION "+
				" SELECT * FROM PUBALBUMS ), "+
				" USER\_ALBUMS AS " +
				" ( " +
				" SELECT U.USERNAME as FRIEND\_USERNAME, U.FIRSTNAME AS FRIEND\_FIRSTNAME, " +
				" U.LASTNAME AS FRIEND\_LASTNAME,A.ID AS ALBUM\_ID , A.NAME AS ALBUM\_NAME , " +
				" A.TS " +
				" FROM USERS U     INNER JOIN FRIENDS F ON U.USERNAME = F.USERNAME2  " +
				" INNER JOIN ALBUMS A ON A.USERNAME = U.USERNAME   " +
				" INNER JOIN GOODALBUMS G ON G.ALBUM\_ID = A.ID " +
				" WHERE F.USERNAME1 = '"+username+"' AND F.STATUS = 'accepted'), " +
				" ALL\_PHOTOS AS " +
				" ( " +
				" SELECT M.ID AS PHOTO\_ID, UA.FRIEND\_USERNAME, UA.FRIEND\_FIRSTNAME, " +
				" UA.FRIEND\_LASTNAME, UA.ALBUM\_ID , UA.ALBUM\_NAME , UA.TS " +
				" FROM MEDIA M  " +
				" INNER JOIN USER\_ALBUMS UA ON M.ALBUM\_ID = UA.ALBUM\_ID " +
				" WHERE M.TYPE = 'photo')," +
				" CHOSEN\_PHOTOS AS " +
				" ( SELECT MIN(PHOTO\_ID) AS PHOTO\_ID, FRIEND\_USERNAME, FRIEND\_FIRSTNAME," +
				" FRIEND\_LASTNAME, ALBUM\_ID , ALBUM\_NAME, TS " +
				" FROM ALL\_PHOTOS " +
				" GROUP BY FRIEND\_USERNAME, FRIEND\_FIRSTNAME, FRIEND\_LASTNAME, ALBUM\_ID , " +
				" ALBUM\_NAME, TS" +
				" ) " +
				" SELECT CP.PHOTO\_ID, CP.FRIEND\_USERNAME, CP.FRIEND\_FIRSTNAME, CP.FRIEND\_LASTNAME" +
				" , CP.ALBUM\_ID , CP.ALBUM\_NAME, M.URL AS PHOTO\_URL " +
				" FROM CHOSEN\_PHOTOS CP " +
				" INNER JOIN MEDIA M ON M.ID = CP.PHOTO\_ID "+
				" WHERE ROWNUM<=10 "
				" ORDER BY CP.TS DESC ";
			
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
						wrapAlbumNewsfeed(res,req,username,newsfeed_albums,newsfeed_trips,0);
						
					}
	
				}); // end connection.execute
		}
	}); // end oracle.connect	
}


function wrapAlbumNewsfeed(res,req,username,results,newsfeed_trips,index){
	// console.log("enter wrap media");
        // // console.log(index);
        
        if (index == results.length) {
            userRecommendations(res,req,username,results,newsfeed_trips);
            return;
        }

        //connects to mongo client and database running at port 27017
        MongoClient.connect('mongodb://127.0.0.1:27017/media', function(err, db) {

            if (!err) {
                // console.log("We are connected");
            } else {
                return;
            }
            //placing the media id in check id and asking gridstore if the id exists  
            var checkid = results[index].PHOTO_URL.toString();

            GridStore.exist(db, checkid, function(err, result) { //check if the file that we pushed to gridstore exists
                // console.log("are we in gridstore exists????????????");
                if(result) {
                    // console.log("exists is 1, that means found in cache!!!!");
                    getcache(res,req,db,username,results,newsfeed_trips,index);

                }
                else if(!result) {
                    // console.log("aDid not find in cache :( !!!");
                    addToCache(res,req,db,username,results,newsfeed_trips,index);

                }
                else if(err) {
                    // console.log("Error occured");
                    return;
                }
                else {
                    // // console.log(result);
                    // // console.log(exists);
                    // console.log(err);

                }
            
                // console.log("gridstore exists function closes!");
            });
            
        
       });
}

function getcache(res,req,db,username,results,newsfeed_trips,index) {
 //reading the data from mongodb for checkid and storing it in fileData: this is the image in binary

                    var hasImage;
                    // console.log("Data is in Cache!");
                    GridStore.read(db, results[index].PHOTO_URL.toString(), function(err, fileData) { //to read the data from the grid store. now this data will be in binary

                        //var buf = new Buffer(fileData, 'base64'); // Ta-da
                        // console.log("reading image in base 64 done");
                        // read all the data in base64 format string 
                        // console.log('Done');

                        hasImage = true;
                        results[index].PHOTO_URL="data:image/jpeg;base64,"+fileData.toString('base64'); //setting the image in the JSON
                        results[index].hasImage = true; //setting the property that the JSON contains the image at the index
                        //res.write(fileData, 'binary');
                        //res.end(fileData,'binary');
                        //// console.log(fileData);
                        //// console.log('Really done');
                       
                        db.close(); //i have obtained the cached data and i close the database
                        wrapAlbumNewsfeed(res,req,username,results,newsfeed_trips,index+1);

                    }); //end of gridstore read   
                

}

function addToCache(res,req,db,username,results,newsfeed_trips,index) {
 // console.log("Data is NOT in cache, so cache it ! ");

 var hasImage;
                    hasImage = false;
                    results.image = null;
                    results.hasImage = false; //setting the property that the JSON  doesn't contain the image at the index
                    var fileId = results[index].PHOTO_URL.toString();
                    var urlm = results[index].PHOTO_URL;
                    // // console.log("FILEID : ", fileId);
                    // // console.log("URLM : ", urlm);
                    var gridStore = new GridStore(db, fileId, 'w');
                    gridStore.chunkSize = 1024 * 256;
                    // Open the file
                    gridStore.open(function(err, gridStore) {
                        // console.log("gridstore open!");
                        http.get(urlm, function(response) {
                            //this is the http request and we get a response and the body
                            response.setEncoding('binary');
                            var image2 = '';
                            // // console.log(urlm);
                            // console.log('reading data in chunks first');
                                response.on('data', function(chunk){
                                      image2 += chunk;
                                    // console.log('reading data');
                                  });
                                
                                response.on('end', function() {

                            // console.log("requesting HTTTP DONE!");
                            var image = new Buffer(image2, 'binary'); //we take this body in binary form 
                            // console.log("CONVERTING FILE TO BINARY, DONE!");
                            // Write some data to the file
                            gridStore.write(image, function(err, gridStore) { // the opened gridstore file is written with the binary image

                                assert.equal(null, err);
                                if (!err)
                                     console.log("WRITING THE IMAGE DONE! ", err);
                                else
                                     console.log("Error occurred"); // Close (Flushes the data to MongoDB)
                                gridStore.close(function(err, result) { //the gridstore file is closed()
                                    assert.equal(null, err);

                                    // Verify that the file exists
                                    GridStore.exist(db, fileId, function(err, result) { //check if the file that we pushed to gridstore exists
                                        assert.equal(null, err);
                                        assert.equal(true, result);

                                        // Read back all the written content and verify the correctness
                                        GridStore.read(db, fileId, function(err, fileData) { //to read the data from the grid store. now this data will be in binary
                                            assert.equal(image.toString('base64'), fileData.toString('base64'));

                                            // console.log("reading image in base 64 done");
                                            // read all the data in base64 format string 
                                            // console.log('Done');
                                            // // console.log(typeof(fileData));
                                            db.close();
                                            wrapAlbumNewsfeed(res,req,username,results,newsfeed_trips,index+1);
                                         
                                        });
                                    });
                                });
                            });
                        });
                    }).on('error', function(e) {
                        // console.log("Got error: " + e.message);
                        wrapAlbumNewsfeed(res,req,username,results,newsfeed_trips,index+1);
                    });
            });

}

/*
 * 
 */
function handleLoginError(res, errorCode){
	
	switch(errorCode){
	case LoginErrorCodeEnum.CONNECTION_ERROR :
		var errorMsg = "Connection error occurred";
		// console.log(errorMsg);
		res.render('index.jade',
						{
							success : SuccessEnum.FAIL,
							error : errorMsg
						});
		break;
		
	case LoginErrorCodeEnum.INCORRECT_ID_PASSWORD :
		var errorMsg = "Incorrect id and password";
		// console.log(errorMsg);
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

function userRecommendations(res,req,username,newsfeed_albums,newsfeed_trips){
	var myquery = "WITH MYTRIPS AS ( "
+"SELECT P.TRIP_ID AS TRIP_ID FROM PARTICIPATES P "
+"INNER JOIN TRIPS T ON T.ID = P.TRIP_ID "
+"WHERE P.USERNAME = '"+username+"' OR T.ADMIN = '"+username+"'), "
+"MYFRIENDS AS( "
+"SELECT DISTINCT(F.USERNAME2) AS FRIEND FROM FRIENDS F "
+"WHERE F.USERNAME1 = '"+username+"'"
+"), GOODUSERS AS ("
+" SELECT DISTINCT(P.USERNAME) FROM PARTICIPATES P "
+" WHERE ((P.TRIP_ID IN (SELECT M.TRIP_ID FROM MYTRIPS M)) "+
	"AND P.USERNAME NOT IN (SELECT MF.FRIEND FROM MYFRIENDS MF) AND P.USERNAME != '"+username+"')"
+ " ) SELECT G.USERNAME, U.FIRSTNAME, U.LASTNAME, U.PHOTO_URL "
+ " FROM GOODUSERS G INNER JOIN USERS U ON U.USERNAME = G.USERNAME";
console.log("userRecommendations: ", myquery);
oracle.connect(connectData, function(err, connection) {
	if (err) {} // console.log("Error connecting to db:", err); return; }
    connection.execute(myquery, [], function(err,urecommendation) {
    	if(err) {}// console.log("Error executing query: ",err); return;}
    	// // console.log(urecommendation);
    	connection.close();
    	locationRecommendation(res,req,username,newsfeed_albums,newsfeed_trips,urecommendation);
    });
});
}

function locationRecommendation(res,req,username,newsfeed_albums,newsfeed_trips,urecommendation){

	oracle.connect(connectData, function(err, connection) {
		if (err) {
			// console.log(err);
		} else {
			connection.execute("SELECT DISTINCT L.NAME as NAME, L.ID as ID FROM LOCATION L INNER JOIN TRIP_LOCATION T ON T.LOC_ID = L.ID " +
				"INNER JOIN PARTICIPATES P ON P.TRIP_ID = T.TRIP_ID " +
				"INNER JOIN FRIENDS F ON F.USERNAME1 = P.USERNAME WHERE F.USERNAME2 = '" + username +"'",
				[],
				function(err, lrecommendation) {
					if (err) {
						// console.log(err);
					} else {
						connection.close();
						render_home(res, req,username,newsfeed_albums, newsfeed_trips,urecommendation,lrecommendation);
					}
				});
		}
	});
}




function render_home(res, req,username,newsfeed_albums, newsfeed_trips,urecommendation,lrecommendation) {
	// // console.log("REQ SESSION : ", req.session);
	var retVal = { results: req.session,
					newsfeed_trips : newsfeed_trips,
					newsfeed_albums : newsfeed_albums,
					ureco : urecommendation,
					lreco : lrecommendation };
	// console.log("LOGIN -> HOME VALS : ", retVal);
	res.render('home.jade', retVal);
}

/////
/* POST home page. */
router.post('/', function(req, res) {

	// console.log('\nin router.post');
	// console.log('\n-- -----------');
	// console.log('req : ', req.session)
	
	// If cache result is present
	if(req.session.name){
		// console.log("\n\n\nCached defined");
		loadTripsNewsFeed(res, req, req.session.name, false);
	}
	else
	{
		reqbody = req.body;
		var sha1=crypto.createHash('sha1');
		password=sha1.update(req.body.password).digest('hex');
		query_db(req, res,reqbody.username, password);
	}
});

router.get('/', function(req, res){
	
	// console.log('\n\n\n\n\n\nreq session in get OF LOGIN : ', req.session);
	if(req.session.password!==undefined)
	{
		// console.log('\n\n\n\n\n\nreq session in get OF LOGIN ');
		var sha1=crypto.createHash('sha1');
		password=sha1.update(req.session.password);
		req.session.password = undefined;

		query_db(req, res,req.session.username, password);
	}
	else if(req.session.name)
	{
		// console.log("\n\n\nCached defined");
		loadTripsNewsFeed(res, req, req.session.name, false);
		
	}
	else
	{
		res.redirect('/');
	}
});

module.exports = router;
