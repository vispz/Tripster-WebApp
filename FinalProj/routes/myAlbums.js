var express = require('express');
var router = express.Router();

var connectData = {
  hostname: "cis550.c9yomnhycrjl.us-west-2.rds.amazonaws.com",
  port: "1521",
  user:"visp",
  password: "foreignkey99",
  database: "TRIPSTER"};

var username;
var oracle = require("oracle"); 


function query_albums(res, req) 
{
      console.log("In query users");
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
    query_albums(res, req);
  }
});



module.exports = router;
