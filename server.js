var express = require('express');
var bodyParser = require('body-parser');
var cron = require('cron');
var Firebase = require('firebase');
var chrono = require('chrono-node');

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
	var request = twilioWrapper.parseRequest(req);
  processText(request);
  res.writeHead(200, {
	'Content-Type':'text/xml'
  });
  res.end(request.resp.toString());
});
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var processText = function (request) {

  // Signup
  if (true) { // If user does not exist
    db.createUser(request.number);
  } else if (true) { // If user needs name
    db.setName(request.number, request.text);
  } else if (true) { // If user needs email
    db.setEmail(request.number, request.text);
  } else {

    var firstWord = request.text.split(' ')[0].toLowerCase();
    // Process 
    if (firstWord == "remind") {
      // Create Reminder
      var interval = "tomorrow " + request.text.split(' every ')[1];
      var reminder = {
        phoneNumber: request.number,
        text: request.text,
        interval: 86400000, // 24 hours = daily
        sendTime: interval,
        state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
      };
      db.createReminder(reminder);

    } else if (firstWord == "no") {
      if (true) { // If responding to reminder
        // Create Followup
        var followup = {
          phoneNumber: request.number,
          text: 'brush teeth',
          interval: 300000, // 24 hours = daily
          sendTime: new Date().getTime(),
          state: 2, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
        };
        db.createFollowUp(followup);
        // Increment reminder
        // TODO

      } else { // If responding to followup
        // Increment Followup

      }
    } else if (firstWord == "yes") {
      if (true) { // If responding to reminder
        // Increment reminder

      } else { // If responding to followup
        // Delete followup
      }
    } else { // Invalid
      request.response.message('I didn\'t understand that.');
    }
  }
};

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