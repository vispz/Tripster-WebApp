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

function query_dream(res, req) 
{
    console.log("In query dream");
    	oracle.connect(connectData, function(err, connection) 
      {
    		if (err) 
        {
    			console.log(err);
    		} 
        else 
        {
            var cmd = " SELECT D.loc\_id, L.name AS name "+
                      " FROM Dreamlist D "+
                      " INNER JOIN Location L ON D.loc\_id=L.id "+
                      " WHERE username ='"+username+"'";

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
                  console.log('calling friends search');
                  res.render('dreamList', {results : req.session, 
                                     dream_results : dream_results});

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
    query_dream(res, req);
  }
});

module.exports = router;
