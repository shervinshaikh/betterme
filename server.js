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
  // console.log(request);
  preprocessText(request, res);
});
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('BetterMe listening at http://%s:%s', host, port);
});

var preprocessText = function (request, res) {
  db.getUser(request.number, function (user) {
    // Signup
    console.log("User: ");
    console.log(user);
    if (user === null) { // If user does not exist
      db.createUser(request.number);
      console.log(request.number);
      request.response.message('Hi just reply with your name to signup');
    } else if (user.name === undefined) { // If user needs name
      db.setName(request.number, request.text);
      console.log(request.text);
      request.response.message('Great! What\'s your email?');
    } else if (user.email === undefined) { // If user needs email
      db.setEmail(request.number, request.text);
      console.log(request.text);
      request.response.message('Excellent you\'re all signed up. What would you like to do? You can say "Remind me to _____ every _____"');
    } else {
      processText(request);
    }
      res.writeHead(200, {
        'Content-Type':'text/xml'
      });
      res.end(request.response && request.response.toString());
  });
};

var processText = function (request) {
  // } else {
    var firstWord = request.text.split(' ')[0].toLowerCase();
    // Process 
    if (firstWord == "remind") {
      // Create Reminder
      var intervalStr = request.text.split(' every ')[1];
      console.log("Interval String: " + intervalStr);
      var interval = chrono.parseDate(intervalStr);
      if (interval < new Date()) {
        interval.setDate(interval.getDate() + 1);
      }
      console.log("Interval: " + interval);
      var reminder = {
        phoneNumber: request.number,
        text: request.text,
        interval: 86400000, // 24 hours = daily
        sendTime: interval.getTime(),
        state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
      };
      db.createReminder(reminder);
      request.response.message('Okay I\'ll remind you!');
    } else if (firstWord == "no") {
      if (request.text.split('no')[1].length > 0) { // if thre is a reason
        // Delete followup
        db.removeFollowup(request.number);
      }
    } else if (firstWord == "yes") {
      // Delete followup
        db.removeFollowup(request.number);
    } else { // Invalid
      request.response.message('I didn\'t understand that.');
    }
  // }
};

var sendRemindersAtTime = function(time){
  var end = new Date(time);
  end.setSeconds(end.getSeconds()+59);

  // TODO: wrap and place into firebase.js
  // REMINDERS
  remindersRef
  .orderByChild('sendTime')
  .startAt(time.getTime())
  .endAt(end.getTime())
  .on('child_added', function(snap){
    var reminder = snap.val();
    console.log('');
    console.log(reminder.phoneNumber);
    console.log(reminder.text);
    console.log('reminder');

    // Increment Reminder
    snap.ref().child('sendTime').update(reminder.sendTime + reminder.interval);

    // TWILIO - Send reminder


    // Create follow up
    reminder.state += 1;
    // TODO: change to some dynamic value depnding on state
    var extraMinutes = 1 * 60000; // min to ms conversion
    reminder.sendTime += extraMinutes;
    // reminder.sendTime += reminder.interval;
    // reminder.interval = 5 * 60000; // 5 min
    db.createFollowUp(reminder);
  });

  // FOLLOW UPS
  followUpsRef
  .orderByChild('sendTime')
  .startAt(time.getTime())
  .endAt(end.getTime())
  .on('child_added', function(snap){
    var reminder = snap.val();
    console.log('');
    console.log(reminder.phoneNumber);
    console.log(reminder.text);

    // TWILIO - Send follow up


    // INCREMENT follow up
    reminder.state += 1;
    if(reminder.state < 4){

      // TODO: change to some dynamic value depnding on state
      var extraMinutes = 1 * 60000;
      reminder.sendTime += extraMinutes;
      // reminder.sendTime += reminder.interval;
      snap.ref().update(reminder);
    } else {
      // Remove follow up if exceed number above
      snap.ref().remove();
    }
  });
};

var cronJob = cron.job("0 * * * * *", function(){
  var now = new Date();
  sendRemindersAtTime(now);
  console.log(now);
});
cronJob.start();