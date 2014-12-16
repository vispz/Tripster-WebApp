var express = require('express');
var router = express.Router();
var oracle = require('oracle');
var connectData = {
    hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
    port: 1521,
    database: "TRIPSTER", // System ID (SID)
    user: "visp",
    password: "foreignkey99"
}
var tripid;
var admin;
var trip_location;
var yelp = require("yelp").createClient({
  consumer_key: "o9jH5gH6s8sKPjrTTaBj0A", 
  consumer_secret: "dvHVX47tUGjLjsjL6HPTK35WBQI",
  token: "QqgqDDI3Kmd4nmy35nJJuTO4p9zvg_zL",
  token_secret: "C5PrmEjUSaLJxR0qa1P5gq0Kw2U"
});
//Mongo code
var mongo = require('mongod');
var monk = require('monk');
var db = monk('localhost:27017/media');
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


/*get the mytrips page*/
router.get('/',function(req,res){

   tripid = req.query.tripid;
   admin = req.session.name;

    //admin = 'FSpagMon';
    //tripid = 1;
   checkadminstatus(res);

    });

router.post('/', function(req,res) {
    
    getrating(res,req);
    getcomments(res,req);
    getinvite(res,req);
    
});

function checkadminstatus(res){
    var tripadmin;
    var privacysetting;
    var myquery = "SELECT T.ADMIN AS ADMINTRIP, T.PRIVACY AS PRIVACY FROM TRIPS T WHERE T.ID="+tripid;
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                privacysetting = results[0].PRIVACY;
                tripadmin = results[0].ADMINTRIP;
                console.log("tripadmin");
                console.log(tripadmin);
                console.log("admin");
                console.log(admin);
                
                if(tripadmin==admin){
                     
                            gettripdata(res);
                }
                else {
                    
                    checkmemberstatus(res,privacysetting);
                }

                
                
            });
    });
    
    
}
function checkmemberstatus(res,privacysetting) {
    var tripadmin;
    
    var myquery = "SELECT P.USERNAME AS MEMBERS, P.RSVP AS RSVP FROM PARTICIPATES P WHERE (P.RSVP = 'pending' OR P.RSVP='accepted') AND P.TRIP_ID="+tripid;
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                console.log(privacysetting);
                gettripdata(res);
            });

    });

}

function gettripdata(res){

    var myquery = "SELECT AVG(P.RATE) AS AVERAGE , T.NAME AS NAME FROM PARTICIPATES P INNER JOIN TRIPS T ON P.TRIP_ID = T.ID" +
                    " WHERE P.TRIP_ID="+tripid+ " GROUP BY T.NAME";
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                getuserdata(res,results);
            });
    });

}

function getuserdata(res,tripresults){
    var myquery = "SELECT DISTINCT U.FIRSTNAME, U.LASTNAME, U.USERNAME FROM USERS U  INNER JOIN FRIENDS F ON F.USERNAME2 = U.USERNAME" +
                  " WHERE F.USERNAME1='"+admin+"'"+
                  " MINUS"+
                   " SELECT DISTINCT U.FIRSTNAME, U.LASTNAME, U.USERNAME FROM USERS U"+
                   " INNER JOIN PARTICIPATES P ON P.USERNAME=U.USERNAME"+
                    " WHERE P.TRIP_ID ="+tripid;
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                getcommentdata(res,tripresults,results);
            });
    });
}



function getcommentdata(res,tripresults,userresults) {

    var myquery = " SELECT U.FIRSTNAME AS FIRSTNAME, U.LASTNAME, U.PHOTO_URL, P.COMMENTS, T.NAME  FROM USERS U "+ 
    " INNER JOIN PARTICIPATES P ON U.USERNAME=P.USERNAME INNER JOIN TRIPS T ON T.ID=P.TRIP_ID " +" WHERE (P.TRIP_ID=" +tripid+
    " AND (P.COMMENTS IS NOT NULL OR P.COMMENTS <> '' OR P.COMMENTS <> ' '))";
console.log(myquery);
oracle.connect(connectData, function(err, connection) {
    if (err) { console.log("Error connecting to db:", err); return; }
    connection.execute(myquery, [], function(err,results) {
        if(err) {console.log("Error executing query: ",err); return;}
        console.log(results);
        connection.close();
        if (results){
            wrapCommentImage(res,tripresults,userresults,results,0);
        }
        else getmembers(res,tripresults,userresults,results);

    });
});
}

function wrapCommentImage(res,tripresults,userresults,results,index){
        console.log(index);
        
        if (index == results.length) {
            getmembers(res,tripresults,userresults,results);
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
            var checkid = results[index].PHOTO_URL.toString();

            GridStore.exist(db, checkid, function(err, result) { //check if the file that we pushed to gridstore exists
                console.log("are we in gridstore exists????????????");
                if(result) {
                    console.log("exists is 1, that means found in cache!!!!");
                    getcache(res,tripresults,userresults,db,results,index);

                }
                else if(!result) {
                    console.log("aDid not find in cache :( !!!");
                    addToCache(res,tripresults,userresults,db,results,index);

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
}

function getcache(res,tripresults,userresults,db,results,index) {
 //reading the data from mongodb for checkid and storing it in fileData: this is the image in binary

                    var hasImage;
                    console.log("Data is in Cache!");
                    GridStore.read(db, results[index].PHOTO_URL.toString(), function(err, fileData) { //to read the data from the grid store. now this data will be in binary

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
                       
                        db.close(); //i have obtained the cached data and i close the database
                        wrapCommentImage(res,tripresults,userresults,results,index + 1);

                    }); //end of gridstore read   
                

}

function addToCache(res,tripresults,userresults,db,results,index ) {
 console.log("Data is NOT in cache, so cache it ! ");

 var hasImage;
                    hasImage = false;
                    results.image = null;
                    results.hasImage = false; //setting the property that the JSON  doesn't contain the image at the index
                    var fileId = results[index].PHOTO_URL.toString();
                    var urlm = results[index].PHOTO_URL.toString();
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
                                            wrapCommentImage(res,tripresults,userresults,results,index + 1);
                                         
                                        });
                                    });
                                });
                            });
                        });
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                        wrapCommentImage(res,tripresults,userresults,results, index + 1);
                    });
            });

}

function getmembers(res,tripresults,userresults,commentresults){
        var myquery = "SELECT U.FIRSTNAME, U.LASTNAME, U.USERNAME, P.RSVP AS RSVP FROM USERS U INNER JOIN PARTICIPATES P ON P.USERNAME=U.USERNAME WHERE P.TRIP_ID="+tripid;
        console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
        if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
            if(err) {console.log("Error executing query: ",err); return;}
            console.log(results);
            connection.close();
            //gettripspage(res,tripresults,userresults,commentresults,results);
            getTripLocation(res, tripresults, userresults, commentresults, results);
        });
    });
}

function getTripLocation(res, tripresults, userresults, commentresults, memberresults) {
    console.log("Yep, got through to here");
    oracle.connect(connectData, function(err, connection) {
        if (err) {
            console.log(err);
        } else {
            connection.execute("SELECT L.NAME FROM LOCATION L INNER JOIN TRIP_LOCATION T ON T.LOC_ID = L.ID WHERE T.TRIP_ID = " + tripid,
                [],
                function(err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        connection.close();
                        trip_location = results[0].NAME;
                        getYelp(res, trip_location, tripresults, userresults, commentresults, memberresults)  
                    }
                });
        }
    });
}

function getYelp(res, trip_location, tripresults, userresults, commentresults, memberresults) {
    yelp.search({term: "food", location: trip_location, limit: 5, sort: 2}, function(error, data) {
      console.log("error");
      gettripspage(res, tripresults, userresults, commentresults, memberresults, data);
    });
}


function gettripspage(res,tripresults,userresults,commentresults,memberresults, yelpdata) {
    console.log("Before rendering");
    if(Object.keys(tripresults).length>=1 ) {
    var retVal = { result: commentresults, 
                                title: tripresults[0].NAME, 
                                tid: tripid, 
                                friends: userresults, 
                                mem: memberresults, 
                                username: admin, 
                                rate: Math.round(tripresults[0].AVERAGE), 
                                yelp : yelpdata};
    console.log("\n\n\n\n\n\nValues sent : ", retVal);
    console.log("\n\n\n\n\n\nValues Done ");

    res.render('tripspage', retVal);
    } else res.redirect('/login');
}

function getrating(res,req){
    console.log("getrating was called");
if (req.body.rating) {
    var rate = req.body.rating;
    var myquery = "UPDATE PARTICIPATES SET RATE="+rate+" WHERE USERNAME='"+admin+"'"+ " AND TRIP_ID="+tripid;
      console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
        if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                gettripdata(res);
            });
    });
}

}

function getcomments(res,req) {
     console.log("getcomments was called");
if (req.body.comment){
    var comment = req.body.comment;
    var myquery = "UPDATE PARTICIPATES SET COMMENTS='"+comment+"' WHERE USERNAME='"+admin+"' "+ "AND TRIP_ID="+tripid;
      console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
        if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                gettripdata(res);
            });
    });
}
}
function getinvite(res,req) {
    console.log("function goes to send invite!");
    if(req.body.selectfriends){
        console.log("function selects the friends");
        //var members = req.query.mem;
       
        var friendlist=[];
        var friendname = req.body.selectfriends;
        console.log(friendname);
        if (friendname){
        if(friendname.constructor === Array) {
            for (i=0; i<friendname.length; i++)
            {
                if(friendname[i]){
                    var name = friendname[i].split("-");
                    friendlist.push(name[1]);
                    console.log(name[1]);
                }
            }
  
        } else {
            var name = friendname.split("-");
            friendlist.push(name[1]);
            console.log(name[1]);
        }

      /*  for (i=0; i<members.length; i++){
            var index = friendlist.indexOf(search_term);    // <-- Not supported in <IE9
            if (index !== -1) {
                friendlist.splice(index, 1);
            }       
        }*/
        console.log(friendlist);
        insertparticipates(res,req,friendlist,0);

        } else gettripdata(res);
    } 
}
function insertparticipates(res,req,friendlist,index) {
    var len = friendlist.length;
    if (index==len) return;
    oracle.connect(connectData, function(err,connection)
            {
               
                if (err) { console.log("Error connecting to db:", err); return;}
                  
                        var newparticipant= "INSERT INTO PARTICIPATES(USERNAME, TRIP_ID,COMMENTS, RSVP,RATE) VALUES ('"
                        + friendlist[index] + "', " + tripid + ", " +null+ ", 'pending'" +", "+1+")" ;

                        console.log(newparticipant);
                        connection.execute(newparticipant,[],function(err,results)
                            {
                            if(err) {console.log("Error executing participates query: ",err); return;}
                            console.log(results); 
                            connection.close();
                            console.log("inserted 1 PARTICIPANT successfully!");
                            insertparticipates(res,req,friendlist,++index);
                            if(index==friendlist.length)
                                    gettripdata(res);
                             }); //end of connection to participates
                     
                 
                    
            });

    
}


module.exports=router;