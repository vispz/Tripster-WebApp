var express = require('express');
var router = express.Router();

var yelp = require("yelp").createClient({
  consumer_key: "o9jH5gH6s8sKPjrTTaBj0A", 
  consumer_secret: "dvHVX47tUGjLjsjL6HPTK35WBQI",
  token: "QqgqDDI3Kmd4nmy35nJJuTO4p9zvg_zL",
  token_secret: "C5PrmEjUSaLJxR0qa1P5gq0Kw2U"
});

var location = "Philadephia"

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
	yelp.search({term: "food", location: location, limit: 5, sort: 2}, function(error, data) {
	  console.log(error);
	  res.render('yelp', {yelp : data});
	});
	}
});

module.exports = router; 
