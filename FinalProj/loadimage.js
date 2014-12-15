/**
 * Simple Node.js caching application for CIS 550
 * 
 * zives
 */

/**
 * Module dependencies.
 */

/* Each image file URL is fetched online from http request and the returned value is converted into a binary file.
 * After the image has been received in binary it can be gridstored in a .txt file stored in the database and 
 * it can be written into that gridstore txt file. Then gridstore can be read from gridstore database with a file id
*/
var Db = require('mongodb').Db, //database
 var MongoClient = require('mongodb').MongoClient,  //mongo client
 var Server = require('mongodb').Server,
 var ReplSetServers = require('mongodb').ReplSetServers,
 var ObjectID = require('mongodb').ObjectID,
 var Binary = require('mongodb').Binary,
 var GridStore = require('mongodb').GridStore,
 var Grid = require('mongodb').Grid,
 var Code = require('mongodb').Code,
 var BSON = require('mongodb').pure().BSON,
 var assert = require('assert');

var request = require('request');

MongoClient.connect('mongodb://127.0.0.1:27017/caching', function(err, db) {
	var fileId = 'ourexamplefiletowrite.txt'; // this is the cache??
  // Create a new instance of the gridstore
  var gridStore = new GridStore(db, 'ourexamplefiletowrite.txt', 'w');

  // Open the file
  gridStore.open(function(err, gridStore) {
//this is just one binary that we are creating and for just 1 image
	  request('http://i.forbesimg.com/media/lists/companies/google_416x416.jpg', function (error, response, body) {  //this is the http request and we get a response and the body
	  	//of the response

		    image = new Buffer(body, 'binary'); //we take this body in binary form 

		    // Write some data to the file
		    gridStore.write(image, function(err, gridStore) {  // the opened gridstore file is written with the binary image
		      assert.equal(null, err);

		      // Close (Flushes the data to MongoDB)
		      gridStore.close(function(err, result) {		//the gridstore file is closed()
		        assert.equal(null, err);

		        // Verify that the file exists
		        GridStore.exist(db, 'ourexamplefiletowrite.txt', function(err, result) {  //check if the file that we pushed to gridstore exists
		          assert.equal(null, err);
		          assert.equal(true, result);
		          
		          // Read back all the written content and verify the correctness
		          GridStore.read(db, fileId, function(err, fileData) {			//to read the data from the grid store. now this data will be in binary
		            assert.equal(image.toString('base64'), fileData.toString('base64'));
// read all the data in base64 format string 
		          console.log('Done');

		            db.close();
		          });		          
		        });
		      });
		    });

		});
  });
});
