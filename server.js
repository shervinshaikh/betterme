var express = require('express');
var bodyParser = require('body-parser');
var cron = require('cron');
var Firebase = require('firebase');

// FILES
var twilioWrapper = require("./twilio");
var db = require('./firebase');

// FIREBASE
var fbRef = new Firebase('https://betterme-data.firebaseio.com/');
var remindersRef = fbRef.child('Reminders');
var followUpsRef = fbRef.child('FollowUp');

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

// CREATE USER
// var num = '+1234561234';
// db.createUser(num);
// db.setName(num, 'Shashank');
// db.setEmail(num, 'Shashank@gmail.com');

// REMINDER
// var reminder = {
//   phoneNumber: '9494194999',
//   text: 'do yoga',
//   interval: 86400000, // 24 hours = daily
//   sendTime: new Date().getTime(),
//   state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
// }
// db.createReminder(reminder);

// FOLLOW UP
// var followup = {
//   phoneNumber: '9494194999',
//   text: 'brush teeth',
//   interval: 300000, // 24 hours = daily
//   sendTime: new Date().getTime(),
//   state: 2, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
// }
// db.createFollowUp(followup);


var sendRemindersAtTime = function(time){
  var end = new Date(time);
  end.setSeconds(end.getSeconds()+60);

  remindersRef
  .orderByChild('sendTime')
  // .startAt(time)
  // .endAt(end)
  .on('child_added', function(snap){
    var reminder = snap.val();

    console.log(reminder);

    // send reminder on Twilio

    // create follow up

    // Fix?
    // snap.ref().remove();
  });
};

// var now = new Date();
// sendRemindersAtTime(now);

var cronJob = cron.job("0 * * * * *", function(){
  console.log('cron');
  var now = new Date();
  // sendRemindersAtTime(now);
  console.log(now);
});