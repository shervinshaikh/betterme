var twilioWrapper = require("./twilio");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/getText', function (req, res) {
	var resp = twilioWrapper.receive(req);
  res.writeHead(200, {
	'Content-Type':'text/xml'
  });
  res.end(resp);
});
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});