var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	console.log('In INDEX JS')
  res.render('index.jade');
});

module.exports = router;
