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
/*get the mytrips page*/
router.get('/',function(req,res){

    if(!req.session.name)
    {   
        res.render('index.jade',
                        {
                            success : 0,
                            error : "Please log in first"
                        });
    }
    else
    {
    admin = req.session.name;
   // console.log("\n\n\n\n\n\n\n\n----------------------------\n\n\nADMIN NAME");
   // console.log("\n\");
	//res.render('mytrips',{ title: 'My Trips'}); //the render is performed on mytrips.jade
	getdata(res, req);
    }
    });

function getdata(res, req) {

oracle.connect(connectData, function(err, connection) {
    var myquery = "SELECT T.NAME AS NAME , P.TRIP_ID AS ID FROM PARTICIPATES P  "+
"INNER JOIN TRIPS T ON P.TRIP_ID=T.ID WHERE P.USERNAME='"+admin+"'" ;
    if (err) { console.log("Error connecting to db:", err); return; }
    connection.execute(myquery, [], function(err,results) {
    	if(err) {console.log("Error executing query: ",err); return;}
    	console.log(results);
    	connection.close();
    	getMyTrips(res,results, req);
    });
});
}

function getMyTrips(res,results, req) {
	res.render('mytrips', { result: results, tid: tripid, results : req.session});
}

module.exports=router;