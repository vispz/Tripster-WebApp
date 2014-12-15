var express = require('express');
var router = express.Router();
var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};

var oracle = require("oracle");
var username = 'lsn';
var album_id;
var photo_id = "51";

var mongo = require('mongod');
var monk = require('monk');
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

//For post request - add comments, ratings to media
var media_ref;
var comment;
var rating;

router.get('/', function(req, res) {
	
	album_id = req.query.albumid;
	getMedia(res, req);
});

router.post('/', function(req, res) {
	//res.send(req.body);
	album_id = req.body.albumid;
	media_ref = req.body.photoid;
	comment = req.body.comments;
	rating = req.body.ratings;
	add_comments(res);

	// if (req.body.comments != "") {
	// 	add_comments(res, req.body.comments, req.body.photoid)
	// } else if (req.body.ratings != "") {
	// 	add_rating(res, req.body.ratings, req.body.photoid)
	// } else {
	// 	res.render('viewmedia')
	// }
});

function add_comments(res) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			var cmd = "INSERT INTO RATE_MEDIA(USERNAME, MEDIA_ID, RATING, COMMENTS) VALUES(" + "'" + username + "'" + ", " + media_ref + ", " + rating + ", " + "'" + comment + "'" + ")";
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						res.redirect('/media?albumid=' + album_id);
					}
				});
		}
	});
}

// Original!!!!
// function query_db(res, req) {
// 	oracle.connect(connectData, function(err, connection) {
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
// 			connection.execute("SELECT M.ID, M.URL, A.NAME, R.COMMENTS, R.RATING FROM MEDIA M, ALBUMS A, RATE_MEDIA R WHERE M.ALBUM_ID = A.ID AND A.ID = " + album_id + " AND R.MEDIA_ID = M.ID ORDER BY M.ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						output_media(res, results);
// 					}
// 				});
// 		}
// 	});
// }

// // How to do 2 queries in one function
// function query_db(res, req) {
// 	oracle.connect(connectData, function(err, connection) {
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			//connection.execute("SELECT URL FROM MEDIA WHERE LOC_ID = 32 AND TYPE = 'photo'",
// 			connection.execute("SELECT M.ID, M.URL, A.NAME, R.COMMENTS, R.RATING FROM MEDIA M, ALBUMS A, RATE_MEDIA R WHERE M.ALBUM_ID = A.ID AND A.ID = " + album_id + " AND R.MEDIA_ID = M.ID ORDER BY M.ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						var query1 = results;
// 						output_media(res, results);
// 					}
// 				});

// 			connection.execute("SELECT MEDIA_ID, COMMENTS FROM RATE_MEDIA ORDER BY MEDIA_ID",
// 				[],
// 				function(err, results) {
// 					if (err) {
// 						console.log(err);
// 					} else {
// 						connection.close();
// 						var query2 = results;

// 						output_media(res, results);
// 					}
// 				});
// 		}
// 	});
// }


function getMedia(res, req) {

	var cmd = "WITH REQ_MEDIA AS( SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL  FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ") SELECT Q.CAPTION, Q.URL, Q.ALBUM_ID, Q.NAME, Q.MEDIA_ID, AVG(R.RATING) AS AVG_RATING FROM REQ_MEDIA Q LEFT JOIN RATE_MEDIA R ON Q.MEDIA_ID = R.MEDIA_ID GROUP BY Q.MEDIA_ID, Q.CAPTION, Q.URL, Q.ALBUM_ID, Q.NAME"
	//var cmd = "SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ")";
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute(cmd,[],function(err, results) {
					if (err) {
						console.log(err);
					} else {
						console.log(results);
						connection.close();
                        wrapmedia(res,req,results,0);
		           
   					//assigning object ID as the media ID
	               }						
                });
								
            }

        });					
	}
   				


function wrapmedia(res, req, results, index) {
        
        console.log("enter wrap media");
        console.log(index);
        
        if (index == results.length) {
            getMediaResults(res, req, results);
            return;
        }

        //connects to mongo client and database running at port 27017
        MongoClient.connect('mongodb://127.0.0.1:27017/media', function(err, db) {

            if (!err) {
                console.log("We are connected");
            } else {
                return;
            }
            //placing the media id in check id and asking gridstore if the id exists  
            var checkid = results[index].MEDIA_ID.toString();

            GridStore.exist(db, checkid, function(err, result) { //check if the file that we pushed to gridstore exists
                console.log("are we in gridstore exists????????????");
                if(result) {
                    console.log("exists is 1, that means found in cache!!!!");
                    getcache(res,req,db,results,index);

                }
                else if(!result) {
                    console.log("aDid not find in cache :( !!!");
                    addToCache(res,req,db,results,index);

                }
                else if(err) {
                    console.log("Error occured");
                    return;
                }
                else {
                    console.log(result);
                    console.log(exists);
                    console.log(err);

                }
            
                console.log("gridstore exists function closes!");
            });
            
        
       });
    } //end of function


function getcache(res,req,db,results,index) {
 //reading the data from mongodb for checkid and storing it in fileData: this is the image in binary

                    var hasImage;
                    console.log("Data is in Cache!");
                    GridStore.read(db, results[index].MEDIA_ID.toString(), function(err, fileData) { //to read the data from the grid store. now this data will be in binary

                        //var buf = new Buffer(fileData, 'base64'); // Ta-da
                        console.log("reading image in base 64 done");
                        // read all the data in base64 format string 
                        console.log('Done');

                        hasImage = true;
                        results[index].image ="data:image/jpeg;base64,"+fileData.toString('base64'); //setting the image in the JSON
                        results[index].hasImage = true; //setting the property that the JSON contains the image at the index
                        //res.write(fileData, 'binary');
                        //res.end(fileData,'binary');
                        //console.log(fileData);
                        //console.log('Really done');
                        console.log(results[index].image);
                        db.close(); //i have obtained the cached data and i close the database
                        wrapmedia(res, req, results, index + 1);

                    }); //end of gridstore read   
                

}

function addToCache(res,req,db,results,index ) {
 console.log("Data is NOT in cache, so cache it ! ");

 var hasImage;
                    hasImage = false;
                    results.image = null;
                    results.hasImage = false; //setting the property that the JSON  doesn't contain the image at the index
                    var fileId = results[index].MEDIA_ID.toString();
                    var urlm = results[index].URL;
                    console.log("FILEID : ", fileId);
                    console.log("URLM : ", urlm);
                    var gridStore = new GridStore(db, fileId, 'w');
                    gridStore.chunkSize = 1024 * 256;
                    // Open the file
                    gridStore.open(function(err, gridStore) {
                        console.log("gridstore open!");
                        http.get(urlm, function(response) {
                            //this is the http request and we get a response and the body
                            response.setEncoding('binary');
                            var image2 = '';
                            console.log(urlm);
                            console.log('reading data in chunks first');
                                response.on('data', function(chunk){
                                      image2 += chunk;
                                    console.log('reading data');
                                  });
                                
                                response.on('end', function() {

                            console.log("requesting HTTTP DONE!");
                            var image = new Buffer(image2, 'binary'); //we take this body in binary form 
                            console.log("CONVERTING FILE TO BINARY, DONE!");
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

                                            console.log("reading image in base 64 done");
                                            // read all the data in base64 format string 
                                            console.log('Done');
                                            console.log(typeof(fileData));
                                            db.close();
                                            wrapmedia(res, req, results, index + 1);
                                         
                                        });
                                    });
                                });
                            });
                        });
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                        wrapmedia(res, req, results, index + 1);
                    });
            });

}

function getMediaResults(res, req, media_results) {
	var cmd = "WITH REQ_MEDIA AS( SELECT M.ID AS MEDIA_ID, M.ALBUM_ID, A.NAME, M.CAPTION, M.URL FROM MEDIA M INNER JOIN ALBUMS A ON A.ID = M.ALBUM_ID WHERE A.ID = " + album_id + ") SELECT R.MEDIA_ID, U.USERNAME, R.COMMENTS, U.FIRSTNAME, U.LASTNAME FROM RATE_MEDIA R INNER JOIN REQ_MEDIA Q ON R.MEDIA_ID = Q.MEDIA_ID INNER JOIN USERS U ON U.USERNAME = R.USERNAME";
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						connection.close();
						var media_results_info = results;
						for (var i = 0; i < media_results.length; i ++) {
							media_results[i].comments = [];
						}

						for (var i = 0; i < media_results.length; i ++) {
							for(var j = 0; j <media_results_info.length; j++) {
								if(media_results[i].MEDIA_ID==media_results_info[j].MEDIA_ID) {
									media_results[i].comments.push(media_results_info[j]);
								}
							}
						}
						output_media(res, media_results);


					}
				});
		}
	});
}


function output_media(res, results) {
	if (are_results_empty(results)) {
		res.redirect('/addmedia?albumid=' + album_id);
	} else {
		res.render('viewmedia', {result: results});
	}
}

function are_results_empty(results) {
	return !Object.keys(results).length;
}

module.exports = router;