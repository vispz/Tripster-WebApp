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
var db = monk('localhost:27017/caching');


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
                if(admin===undefined) {
                    alert("The admin has set the trip settings to private\nRedirecting to home page");
                    res.redirect('/login');
                }
                if(tripadmin==admin){
                     
                            gettripdata(res);
                }
                else {
                    console.log(checkmemberstatus);
                    console.log(admin);
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
                

                if(privacysetting =="sharedByTripMembers"){
                    console.log("inside sharedbytripmembers");
                    var member = false;
                    for(i=0; i<results.length; i++){

                        if (results[i].MEMBERS==admin){
                            member = true;
                            gettripdata(res);
                        }
                    }
                    if (member==false){
                       
                        res.redirect('/login');
                    }

                }
                else if(privacysetting =="private"){
                    console.log("inside private");
                    var member = false;
                    var memberindex;
                    for(i=0; i<results.length; i++){
                        if (results[i].MEMBERS==admin){
                            console.log("member set to true");
                            member = true;
                            memberindex=i;
                            break;
                        }
                    }
                    if(member==true){
                        
                        if(results[memberindex].RSVP=="accepted"){
                             gettripdata(res);
                             console.log("going to get trip data");
                        }
                        else {
                      
                        res.redirect('/login');
                        }
                    } else {
                        
                        res.redirect('/login');
                    }
                    
                }
                
                else if (privacysetting=="public"){
                    console.log("inside public");
                    gettripdata(res);
                }
                else {
                    console.log("inside redirection");
                    res.redirect('/login');
                }
            });
    });

}

function gettripdata(res){

    var myquery = "SELECT AVG(P.RATE) AS AVERAGE , T.NAME AS NAME FROM PARTICIPATES P INNER JOIN TRIPS T ON P.TRIP_ID = T.ID" +
                    " WHERE TRIP_ID="+tripid+ " GROUP BY NAME";
    console.log(myquery);
    oracle.connect(connectData, function(err, connection) {
            if (err) { console.log("Error connecting to db:", err); return; }
            connection.execute(myquery, [], function(err,results) {
                if(err) {console.log("Error executing query: ",err); return;}
                console.log(results);
                connection.close();
                console.log(1);
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
        getmembers(res,tripresults,userresults,results);

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
                        getYelp(res, tripresults, userresults, commentresults, memberresults);
                    }
                });
        }
    });
}

function getYelp(res, tripresults, userresults, commentresults, memberresults) {
    yelp.search({term: "food", location: trip_location, limit: 5, sort: 2}, function(error, data) {
      console.log(error);
      gettripspage(res, tripresults, userresults, commentresults, memberresults, data);
    });
}


function gettripspage(res,tripresults,userresults,commentresults,memberresults, yelpdata) {
    if (Object.keys(tripresults).length>0){
    res.render('tripspage', { result: commentresults, title: tripresults[0].NAME, tid: tripid, friends: userresults, mem: memberresults, username: admin, rate: Math.round(tripresults[0].AVERAGE), yelp: yelpdata});
    } else {
        res.redirect('/login');
    }
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