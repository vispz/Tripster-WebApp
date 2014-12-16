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

router.get('/',function(req,res){

   admin = req.session.name;
   // console.log("\n\n\n\n\n\n\n\n----------------------------\n\n\nADMIN NAME");
   // console.log("\n\");
	//res.render('mytrips',{ title: 'My Trips'}); //the render is performed on mytrips.jade
	getdata(res);
    });

function getuserreco(res) {
var myquery = "WITH MYTRIPS AS ( "
+"SELECT P.TRIP_ID AS TRIP_ID FROM PARTICIPATES P "
+"INNER JOIN TRIPS T ON T.ID = P.TRIP_ID "
+"WHERE P.USERNAME = '"+admin+"' OR T.ADMIN = '"+admin+"'), "
+"MYFRIENDS AS( "
+"SELECT F.USERNAME2 AS FRIEND FROM FRIENDS F "
+"WHERE F.USERNAME1 = '"+admin+"'"
+")"
+" SELECT P.USERNAME FROM PARTICIPATES P "
+"WHERE ((P.TRIP_ID IN (SELECT M.TRIP_ID FROM MYTRIPS M)) "+
	"AND P.USERNAME NOT IN (SELECT MF.FRIEND FROM MYFRIENDS MF) AND P.USERNAME != '"+admin+"');";
oracle.connect(connectData, function(err, connection) {
	if (err) { console.log("Error connecting to db:", err); return; }
    connection.execute(myquery, [], function(err,results) {
    	if(err) {console.log("Error executing query: ",err); return;}
    	console.log(results);
    	connection.close();
    	
    });
});
}



module.exports=router;
	


