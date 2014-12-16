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
    //var tripid = res.query.tripid;
   tripid = req.query.tripid;
   //admin = req.session.name;
   admin = 'FSpagMon';
    console.log(tripid);
    console.log(req.query.tripid);
    gettripdata(res);
    });

router.post('/', function(req,res) {
    console.log(req.body);
    getrating(res,req);
    getcomments(res,req);
    
});

function gettripdata(res){

    var myquery = "SELECT AVG(P.RATE) AS AVERAGE , T.NAME AS NAME FROM PARTICIPATES P INNER JOIN TRIPS T ON P.TRIP_ID = T.ID" +
                    " WHERE TRIP_ID="+tripid+ " GROUP BY T.NAME";
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                getcommentdata(res,results);
            });
    });

}

function getcommentdata(res,tripresults) {

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
        getmembers(res,tripresults,results);

    });
});
}

function gettripspage(res,tripresults,commentresults,memberresults) {
    res.render('tripspage', { result: commentresults, title: tripresults[0].NAME, tid: tripid, mem: memberresults, username: admin, rate: Math.round(tripresults[0].AVERAGE)});
    
}

function getmembers(res,tripresults,commentresults){
        var myquery = "SELECT U.FIRSTNAME, U.LASTNAME, U.USERNAME FROM USERS U INNER JOIN PARTICIPATES P ON P.USERNAME=U.USERNAME WHERE P.TRIP_ID="+tripid;
        console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
        if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
            if(err) {console.log("Error executing query: ",err); return;}
            console.log(results);
            connection.close();
            gettripspage(res,tripresults,commentresults,results);
        });
    });
}

function getrating(res,req){
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
            });
    });
}

}

function getcomments(res,req) {
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

module.exports=router;