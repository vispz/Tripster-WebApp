var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	
	// Delete session variables when 
	// entering login page.
	if(req.session.name)
		req.session.destroy()
	
	console.log('In INDEX JS')
  	res.render('index.jade');
});


module.exports = router;
