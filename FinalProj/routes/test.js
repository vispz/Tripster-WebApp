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
var request = require('request');
var http = require('http');



var tripid;
var admin;

//Mongo code
var mongo = require('mongod');
var monk = require('monk');
var db = monk('localhost:27017/caching');
var url = 'mongodb://localhost:27017/caching';
var assert = require('assert');
/* getting mongo db data*/

/* GET Userlist page. */
router.get('/', function(req, res) {
    console.log("in get method");

   MongoClient.connect('mongodb://127.0.0.1:27017/caching', function(err, db) {
    var fileId = 'vishnu'; // this is the cache??
  // Create a new instance of the gridstore
  var gridStore = new GridStore(db, fileId, 'w');

  // Open the file
  gridStore.open(function(err, gridStore) {
//this is just one binary that we are creating and for just 1 image
//new
      http.get('http://i.forbesimg.com/media/lists/companies/google_416x416.jpg', function (response) {  //this is the http request and we get a response and the body
        //of the response
            response.setEncoding('binary'); //new
            var image2 = ''; //new
            console.log('reading data in chunks first');
                response.on('data', function(chunk){
                      image2 += chunk;
                    console.log('reading data');
                  });
                
                response.on('end', function() {
                  console.log('done reading data');
            console.log("requesting HTTTP DONE!");
            image = new Buffer(image2, 'binary'); //we take this body in binary form 
            console.log("CONVERTING FILE TO BINARY, DONE!");
            // Write some data to the file
            gridStore.write(image, function(err, gridStore) {  // the opened gridstore file is written with the binary image
              assert.equal(null, err);
              console.log("WRITING THE IMAGE DONE!");
              // Close (Flushes the data to MongoDB)
              gridStore.close(function(err, result) {       //the gridstore file is closed()
                assert.equal(null, err);

                // Verify that the file exists
                GridStore.exist(db, fileId, function(err, result) {  //check if the file that we pushed to gridstore exists
                  assert.equal(null, err);
                  assert.equal(true, result);
                  
                  // Read back all the written content and verify the correctness
                  GridStore.read(db, fileId, function(err, fileData) {          //to read the data from the grid store. now this data will be in binary
                   
                    console.log("reading image in base 64 done");
// read all the data in base64 format string 
                  console.log('Done');
                  var srcimage = "data:image/jpeg;base64,"+fileData.toString('base64'); 
                   console.log(srcimage);
                   res.render('test', {result: srcimage});

                    db.close();
                    
                  });                 
                });
              });
            });

        });
  });


});
    /*var db = req.db;
    var collection = db.get('usercollection');
    collection.find({},{},function(e,docs){
        res.render('test', {
            "testlist" : docs
        });
    });*/
});
});

/*
function insertDocuments (db) {

    var collection = db.collection('trips');
        console.log("after collection");
  
    collection.insert(
        [{"ID" : "1015", "NAME": "Budapest" } ], function(err,result){
        
        console.log("Inserted 1 document into the user collection");
        console.log(result);
    });
 }

*/
module.exports = router;
