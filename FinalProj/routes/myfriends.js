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

function query_friends(res, req) 
{
    console.log("In query friends");
    	oracle.connect(connectData, function(err, connection) 
      {
    		if (err) 
        {
    			console.log(err);
    		} 
        else 
        {
            var cmd = " SELECT  U.username, U.firstname, U.lastname, U.photo\_url "+
                      " FROM FRIENDS F "+
                      " INNER JOIN USERS U ON F.username2=U.username "+
                      " WHERE F.username1='"+username+"' ";

            console.log(cmd);
            connection.execute(cmd,
              [],
              function(err, friends_results) 
              {
                if (err) 
                {
                  console.log(err);
                } 
                else 
                {
                  connection.close();
                  console.log('calling friends search');
                  res.render('myfriends', {results : req.session, 
                                     friends : friends_results});

                }
              });
  		    } 
  	   });
    
}

router.get('/', function(req, res) 
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
    username = req.session.name;
    query_friends(res, req);
  }
});

module.exports = router;
