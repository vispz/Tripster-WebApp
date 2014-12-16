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

var locidlist=[];
var check=-1;
var admin ;
var tripid;
var maxlocid;
var locid;
var triplocations=[];
var newid=[];
/*get the createTrip page*/
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
	   getdata(res,req);
    }
});

router.post('/', function(req,res) {
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
    console.log(req.body);
    getID(res,req);
    }
});


/*method to get my friends from database*/
function getdata(res,req){
    var displayfriends = "SELECT U.FIRSTNAME, U.LASTNAME, U.USERNAME FROM USERS U INNER JOIN FRIENDS F ON F.USERNAME2 = U.USERNAME WHERE F.USERNAME1='"+admin+"'";
	   oracle.connect(connectData, function(err,connection){
             if (err) { console.log("Error connecting to db:", err); return; }
             connection.execute(displayfriends, [], function(err,results) {
            if(err) {console.log("Error executing query: ",err); return;}
            console.log(results);
            connection.close();
            showfriends(res,results);

        });

        });

}

/*method to display my friends on the select box */
function showfriends(res,results) {
    res.render('createTrip', { result: results});
}


/*method to find the maximum trip id and increment it by one: this is used as the trip id for a new trip*/

function getID(res,req) {
    var maxID = "SELECT MAX(T.ID) AS max FROM TRIPS T";
    console.log("get id");
    var tid;
        oracle.connect(connectData, function(err,connection){
         if (err) { console.log("Error connecting to db:", err); return;}
         connection.execute(maxID, [], function(err,results) {
            if(err) {console.log("Error executing query: ",err);return;}
            console.log(results);
            connection.close();
            tid = results[0].MAX + 1;
            tripid = tid;
             findlocid(res,req);

        });



     });
   

}

function findlocid(res,req) {
    console.log("find locid");
var maxlocid="SELECT MAX(L.ID) AS max FROM LOCATION L";

//finding maximum location
     oracle.connect(connectData, function(err,connection)
    {
        
        if (err) { console.log("Error connecting to db:", err); return;}
         connection.execute(maxlocid, [], function(err,results) {
            if(err) {
                console.log("Error executing max query: ",err);
                return;
                    }
            console.log(results);
            connection.close();
            maxlocid = results[0].MAX + 1;
            locid=maxlocid;
            inserttrips(res,req);
            console.log("found MAX LOC ID successfully!");
            
        }); //end of connection to  max location id

    });
    
}

/*method to insert a new trip into TRIPS table */
function inserttrips(res,req) 
{
    console.log("insert trips");
    var tripname = req.body.inputname;
    var startdate = req.body.inputstart;
    var enddate = req.body.inputend;
    var privacy =  req.body.privacy;
    
   // var maxid = getID(req,res);
    

    var inserttotrip = "INSERT INTO TRIPS(ID, NAME, STARTING, ENDING, PRIVACY, ADMIN) values (" + 
            tripid + ", " + "'"+tripname + "'"+", " + "'" + startdate+ "'" +", " + "'" + enddate + "'" +", " + 
            "'" +privacy+"'" + ", " +"'" +admin + "'" + ")" ;
    
    console.log(inserttotrip);
    if(tripid){
    oracle.connect(connectData, function(err,connection)
    {
        
        if (err) { console.log("Error connecting to db:", err); return;}
           connection.execute(inserttotrip,[], function(err,results) 
            {
             console.log("inserted TRIP successfully!");
             if(err) {console.log("Error executing inserting trip query: ",err); return;}
             console.log(results);
             connection.close();
               //check friends of the admin who are going to the trip
              wrapfindlocations(res,req);
            }); //end of first connection to trips table

    });
    }

  
   

}//end of function


function wrapfindlocations(res,req){
   var locs= req.body.location;
    var loclist = locs.split(","); 
    var index=loclist.length;
    getnewlocations(res,req,0,loclist);
    //insertintotriploc(res,req,0);
    console.log("FINISHED INSERTING LOCATIONS AND TRIP LOCATIONS");
}

function getnewlocations(res,req,index,loclist){
    
     var len = loclist.length;
     if (index==len) return;
     
     var  myquery = "SELECT L.ID AS LOCID FROM LOCATION L WHERE L.NAME = '"+loclist[index]+"'";
     //if the user types in a list of locations execute the code below
     
        //query the database 

            //check for each element in array loclist, if it is present in the database
            //if it is present then do nothing, if it returns null then insert into locations table
    
    // var locvalue = loclist[i].replace(/^\s+|\s+$/g, "");

    var locString = loclist[index];
    console.log(locString);
    console.log(myquery);
    oracle.connect(connectData, function(err,connection)
    {
        connection.execute(myquery,[], function(err,results)
        {

            
            if(err)  {console.log("Error executing query: ",err); return;}
            console.log(results);
            connection.close();
            console.log("Done with the search!");
            if(Object.keys(results).length<1 ) 
            {
                triplocations.push(locid);
                addlocation(res,req,index,locid++,locString,loclist);

                console.log(index);


            } else {
                triplocations.push(results[0].LOCID);
                getnewlocations(res,req,++index,loclist);
            }

            if (index == loclist.length-1)
                insertintotriploc(res,req,0);

           // getnewlocations(res,req,++index,loclist);
        });
     });
    
}
        
       
    //    addnewlocations(res,req,newloc);
        

function addlocation(res,req,index,locationid,locationname,loclist) {

    
    var insertquery = "INSERT INTO LOCATION(ID, NAME) VALUES("+locationid+", '"+locationname+"')";
    console.log(insertquery);
            oracle.connect(connectData, function(err,connection)
            {
                if (err) { console.log("Error connecting to db:", err); return;}
                connection.execute(insertquery,[], function(err,results) 
                {  
                    if(err)  {console.log("Error executing query: ",err); return;}
                    console.log(results);
                    connection.close();
                    console.log("added 1 location successfully!");
                    getnewlocations(res,req,++index,loclist)
                });
            });
}

function insertintotriploc(res,req,index){
    console.log("inserting TRIP locations.....****");
    var len = triplocations.length;
    if (index==len) return;
    var myquery = "INSERT INTO TRIP_LOCATION(TRIP_ID, LOC_ID) VALUES("+tripid+ ", "+triplocations[index]+")";
    oracle.connect(connectData, function(err,connection)
    {
         if (err) { console.log("Error connecting to db:", err); return;}
           connection.execute(myquery,[], function(err,results) 
            {
            
             if(err) {console.log("Error executing inserting trip query: ",err); return;}
             console.log(results);
             connection.close();
             insertintotriploc(res,req,++index);
             console.log("1 TRIP_LOCATION ADDED SUCCESSFULLY!");
             if(index==triplocations.length-1) 
                findfriends(res,req);
            });
    });


}


function gettriplocations(res,req,index,loclist) {
    var len = loclist.length;
    if (index==len) return;
    var  myquery = "SELECT L.ID FROM LOCATION L WHERE L.NAME = '"+loclist[index]+"'";
    var locString = loclist[index];
    console.log(locString);
    console.log(myquery);
    oracle.connect(connectData, function(err,connection)
    {
        connection.execute(myquery,[], function(err,results)
        {

            
            if(err)  {console.log("Error executing query: ",err); return;}
            console.log(results);
            connection.close();
            console.log("Done with the search!");
            addtriplocation(res,req,index,loclist);
        });
    });

}


function addtriplocation(res,req,index,loclist){
    var insertquery = "INSERT INTO TRIP_LOCATION(TRIP_ID, LOC_ID) VALUES("+tripid+", '"+locid+"')";
    console.log(insertquery);
            oracle.connect(connectData, function(err,connection)
            {
                if (err) { console.log("Error connecting to db:", err); return;}
                connection.execute(insertquery,[], function(err,results) 
                {  
                    if(err)  {console.log("Error executing query: ",err); return;}
                    console.log(results);
                    connection.close();
                    console.log("added 1 location successfully!");
                    getnewlocations(res,req,++index,loclist)
                });
            });
}




function inserttriplocations(res,req,locationlist){
    for (i=0 ; i<locationlist.length; i++) {
            var insertquery = "INSERT INTO TRIP_LOCATION(TRIP_ID,LOCATION_ID) VALUES ("+tripid+", "+loclist[i]+")";
            console.log(insertquery);
            oracle.connect(connectData, function(err,connection)
            {
                if (err) { console.log("Error connecting to db:", err); return;}
                connection.execute(insertquery,[], function(err,results)
                {
                    
                    if(err)  {console.log("Error executing query: ",err); return;}
                    console.log(results);
                    connection.close();
                    console.log("1 TRIP LOCATION INSERTED!");
                    findfriends(res,req);
                    
                    
                });
            });
        }
}


/*method to check friends who are going to the trip and inserting username in an array*/
function findfriends(res,req){
    console.log("find friends");
    var friendname = [];
    friendname= req.body.selectfriends;
    
    console.log(friendname);
    var friendlist = [];
    
    
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
        friendlist.push(admin);

    }
    
   
    /* adding the friend usernames to the participates table*/
    insertparticipates(res,req,friendlist,0);

}

/* adding the friends username to the participates table*/
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
                                    redirection(res);
                             }); //end of connection to participates
                     
                 
                    
            });

    
}
function redirection(res) {
    console.log("i redirected the page");
    var url="/mytrips?username="+admin;
    res.redirect(url);
}

/*for inserting multiple insert entries*/
function multiparticipant(participant){
    console.log("multiparticipants");
    if(tripid){
    oracle.connect(connectData, function(err,connection)
            {
               
                if (err) { console.log("Error connecting to db:", err); return;}
                  
                        var newparticipant= "INSERT INTO PARTICIPATES(USERNAME, TRIP_ID,COMMENTS, RSVP,RATE) VALUES ('"
                        + participant + "', " + tripid + ", " +null+ ", 'pending'" +", "+1+")" ;
                        console.log(newparticipant);
                        connection.execute(newparticipant,[],function(err,results)
                            {
                            if(err) {console.log("Error executing participates query: ",err); return;}
                            console.log(results); 
                            connection.close();
                            console.log("inserted 1 PARTICIPANT successfully!");
                            
                             }); //end of connection to participates
                     
                 
                    
            });
        }
}
    


    

module.exports=router;






