var express = require('express');
var router = express.Router();

var connectData = {
	hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
	port: "1521",
	user:"visp",
	password: "foreignkey99",
	database: "TRIPSTER"};

var contents;
var username;
var oracle = require("oracle");	
var results={};

function query_users(res, req) 
{
    console.log("In query users");

    if(!req.body.user_search)
    {
    console.log("User not selected going to locations");

      query_locations(res,req);
    }
    else
    {
    	oracle.connect(connectData, function(err, connection) 
      {
    		if (err) 
        {
    			console.log(err);
    		} 
        else 
        {
            var cmd = "SELECT username, firstname, lastname, photo_url FROM USERS " + 
            " WHERE (username LIKE '%"+contents+"%' OR firstname LIKE '%"+contents+"%' "+
            " OR lastname LIKE '%"+contents+"%') "+
            " AND username !='"+req.session.name+"'";//" AND ROWNUM<10";
            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, user_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  connection.close();
                  results.user_results = user_results;
                  console.log('calling friends search');
                  query_friends(res,req);
                }
              });
  		    } 
  	   });
    }
}


function query_friends(res, req)
{
       oracle.connect(connectData, function(err, connection) 
       {
        if (err) 
        {
          console.log(err);
        } 
        else 
        {
            var cmd = "SELECT username2 AS  friend\_username FROM friends WHERE username1='"+
            username+"'";
            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, friend_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  for (var i = 0 ; i < results.user_results.length ; i ++)
                  {
                    results.user_results[i].isFriend = false;

                    for(var j = 0 ; j < friend_results.length; j++ )
                      if(  friend_results[j].FRIEND_USERNAME == results.user_results[i].USERNAME )
                      {
                        results.user_results[i].isFriend = true;
                        break;
                      }
                  }
                  connection.close();
                  console.log('calling locations search');
                  query_locations(res, req) 
                }
              });
          } 
       }); 

}

function query_locations(res, req) 
{   
    var pg = 'search.jade';
    console.log("In query locations");
    if(!req.body.location_search)
    { 
        console.log('No need for locations rendering page ' +  pg);
      //query_trips(res,req);
      var retVal = {results : req.session,
                    query_results : results};
      res.render(pg, retVal);
console.log('Rendered');
     
    }
    else
    {
      oracle.connect(connectData, function(err, connection) 
      {
        if (err) 
        {
          console.log(err);
        } 
        else 
        {
            var cmd = "SELECT id, name FROM location " + 
            "WHERE name LIKE '%"+contents+"%'"; // AND ROWNUM<10";
            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, location_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  connection.close();
                  results.location_results = location_results;
                    query_dreamlist(res, req);
                }
              });
          } 
       });
    }
}

function query_dreamlist(res, req)
{
  
      var pg = 'search.jade';
      oracle.connect(connectData, function(err, connection) 
      {
        if (err) 
        {
          console.log(err);
        } 
        else 
        {
            var cmd = "SELECT loc_id FROM dreamlist " + 
            "WHERE username ='"+username+"'"; // AND ROWNUM<10";
            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, dream_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  connection.close();
                  for (var i = 0 ; i < results.location_results.length ; i ++)
                  {
                    results.location_results[i].isDreamlist = false;

                    for(var j = 0 ; j < dream_results.length; j++ )
                      if(  dream_results[j].LOC_ID == results.location_results[i].ID )
                      {
                        results.location_results[i].isDreamlist = true;
                        break;
                      }

                    var retVal = {results : req.session,
                      query_results : results,                    
                      };
                    res.render(pg, retVal);
                 }
                }
              });
          } 
       });
    

}

function query_trips(res, req) 
{
    if(!req.body.trip_search)
    {
      res.send(results);
      // res.render( 'searchResults.jade',{results:results});
    }
    else
    {
      oracle.connect(connectData, function(err, connection) 
      {
        if (err) 
        {
          console.log(err);
        } 
        else 
        {
            var cmd = " WITH TripParticipates AS( " +
                      " SELECT trip\_id " +
                      " FROM Participates P " +
                      " WHERE P.username = '"+username+"') " +
                      " SELECT T.id AS trip\_id, T.name AS trip\_name " +
                      " FROM Trips T " +
                      " WHERE ( T.privacy = 'public' " +
                      " OR T.id IN (SELECT * FROM TripParticipates) " +
                      " OR T.admin = '"+username+"' ) " +
                      " AND T.name LIKE '%"+contents+"%'  AND ROWNUM<5 ";
            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, trip_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  connection.close();
                  results.trip_results = trip_results;
                  // res.send(results);
                  console.log("Im here before res render");

                  var a = {results: results};
                  console.log(a);
                  res.send(results);
                  // res.render( 'searchResults.jade',{results:results});

                }
              });
          } 
       });
    }
}

router.post('/', function(req, res) 
{ 
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
    results ={};
    console.log("\n-----------------------------");
    console.log("\n-----In Seach.js----", req.session);
    // res.render("index");
    var retVal = { results: req.session};
    console.log(retVal);
    // res.render("editprofile.jade", retVal);

    username = req.session.name;
    contents =  req.body.contents;
    console.log("Req query : ", req.body);
	  query_users(res, req);
  }
});



module.exports = router;
