var express = require('express');
var router = express.Router();

var bing = require('node-bing-api')({ accKey: "8HsTwQvj7cwfSVSm1kDBM1fPT/SfApOU29epmNEwaek" });
var bingSearch;
var bing_results ={};


// router.get('/', function(req, res){
// 	var bingSearch = req.query.bingSearch;
// 	// console.log("Req query : ", req.query);

// 	bing.search(bingSearch, function(error, response, body){
// 		console.log(body);
// 		console.log(body.d.results);
// 		// res.render('bing',{search: body.d.results, title: bingSearch});
// 		res.send(body.d.results);

// 	},
// 	{
// 		top: 10,  // Number of results (max 50)
//     	skip: 3   // Skip first 3 results
// 	});

// });

function searchWeb(req, res){
	if(!req.query.bing_web_search){
		console.log("Bing Web Search not selected going to Bing Image Search");
		searchImage(req, res);
	}
	else{
		bing.search(req.query.bingSearch, function(error, response, body){
			console.log(body.d.results);
			bing_results.web_search = body.d.results;
			searchImage(req, res);
			
		},
		{
			top: 10, //Number of results (max 50)
			skip: 3   //Skip first 3 results
		});
	
	}
}

function searchImage(req, res){
	if(!req.query.bing_image_search){
		console.log("Bing image Search not selected going to Bing Web Search");
		res.send(bing_results);
	}
	else{
		bing.images(req.query.bingSearch, function(error, response, body){
			bing_results.image_search = body.d.results;
			console.log(body.d.results);
			res.send(bing_results);
		},
		{
			top: 10, //Number of results (max 50)
			skip: 3   //Skip first 3 results
		});
	}
}

// router.get('/', function(req,res){
// 	console.log("got here");
// 	res.render('bing', {search: "hehe", title: "haha"});
// });


router.get('/', function(req, res) 
{
    results ={};
    console.log("\n-----------------------------");
    console.log("\n-----In Seach.js----", req.session);
    console.log("Req query : ", req.query);
	searchWeb(req, res);
});
module.exports = router;