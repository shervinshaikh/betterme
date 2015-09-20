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

  console.log('BetterMe listening at http://%s:%s', host, port);
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
      var intervalStr = request.text.split(' every ')[1];
      var interval = chrono.parseDate(intervalStr);
      if (interval < new Date()) {
        interval = chrono.parseDate("tomorrow " + intervalStr);
      }
      var reminder = {
        phoneNumber: request.number,
        text: request.text,
        interval: 86400000, // 24 hours = daily
        sendTime: interval,
        state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
      };
      db.createReminder(reminder);

    } else if (firstWord == "no") {
      if (request.text.split('no')[1].length > 0) { // if thre is a reason
        // Delete followup
        removeFollowup(request.number);
      }
    } else if (firstWord == "yes") {
      // Delete followup
        removeFollowup(request.number);
    } else { // Invalid
      request.response.message('I didn\'t understand that.');
    }
  }
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