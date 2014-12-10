var express = require('express');
var router = express.Router();

var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};

var oracle = require("oracle");	
var temp1 = {};
var temp2 = {};
// var temp = {
// 	"A" : "hello",
// 	"B" : "world"
// };
// for(var _obj in temp) 
// 	finalResult[_obj]= temp[_obj];
// function query_db(res, username){
// 	oracle.connect(connectData, function(err, connection) {
// 		if (err) {
// 			console.log(err);
// 		}
// 		else{

// 		}
// }

function query_db(res, contents) {
	oracle.connect(connectData, function(err, connection) {
		if (err) {
			console.log(err);
		} else {
			var cmd = "SELECT U.USERNAME FROM USERS U " + 
			"WHERE U.USERNAME like '%"+contents+"%'";
			console.log(cmd);
			connection.execute(cmd,
				[],
				function(err, results) {
					if (err) {
						console.log(err);
					} else {
						// console.log(results);
						// console.log("username length : ", results.length);
						// connection.close();
						
						// if(results.length!=0){
						// 	for(var _obj in results)
						// 		finalResult[_obj]= results[_obj];
						// 	// output_search(res, contents, results);
						// }
						// console.log(finalResult);
						// output_search(res, contents, finalResult);
						temp1 = results;
					}
				});

			var cmd2 = "SELECT L.NAME FROM LOCATION L " + 
			"WHERE L.NAME like '%"+contents+"%'";
			console.log(cmd2);
			connection.execute(cmd2,
				[],
				function(err2, results2) {
					if (err2) {
						console.log(err2);
					} else {
						// console.log(results);
						// console.log("username length : ", results.length);
						 	connection.close();
						
						// if(results.length!=0){
						// 	for(var _obj in results)
						// 		finalResult[_obj]= results[_obj];
						// 	// output_search(res, contents, results);
						// }
						// console.log(finalResult);
						// output_search(res, contents, finalResult);
							temp2 = results2;
							for(var _obj in temp1)
								{temp2.push(temp1[_obj]);}	
							console.log(temp2);
							output_search(res, contents, temp2);

					}
				});
		}
		// console.log(temp1);
		// console.log(temp2);
	});
	// console.log(finalResult);
	// output_search(res, contents, results2);
	
}

function output_search(res, contents, finalResult) {
	
	res.send(finalResult);
}


router.get('/', function(req, res) {
	  query_db(res, req.query.contents);
});



module.exports = router;
