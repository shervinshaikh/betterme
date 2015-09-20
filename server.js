var express = require('express');
var bodyParser = require('body-parser');
var cron = require('cron');
var Firebase = require('firebase');

// FILES
var twilioWrapper = require('./twilio');
var db = require('./firebase');
var parser = require('./parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function (req, res) {
  res.send('You\'ve reached BetterMe.Club');
});
app.post('/getText', function (req, res) {
	var request = twilioWrapper.parseRequest(req);
  db.getUser(request.number, function (user) {
    // Signup
    if (!user || !user.name || !user.email) {
      console.log('New user ' + user);
      signup(user, request);
    } else {
      console.log('Existing user: ' + user);
      processText(request);
    }
    res.writeHead(200, {
      'Content-Type':'text/xml'
    });
    res.end(request.response && request.response.toString());
    console.log("sent response");
  });
});

var port = (process && process.env && process.env.PORT) || 8080;
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('BetterMe.Club listening at http://%s:%s', host, port);
});

var cronJob = cron.job('0 * * * * *', function(){
  dequeueReminders();
});
cronJob.start();

var signup = function (user, request) {
  if (!user) { // If user does not exist
    db.createUser(request.number);
    console.log(request.number + ' started signup');
    request.response.message('Hi what\'s your name?');

  } else if (!user.name) { // If user needs name
    db.setName(request.number, request.text);
    console.log(request.text);
    request.response.message('One exotic name ' + request.text + '! What\'s your email?');

  } else if (!user.email) { // If user needs email
    db.setEmail(request.number, request.text);
    console.log(request.text + ' completed signup');
    request.response.message('You\'re all set ' + user.name + '! What would you like to do? You can say something like \'Remind me to take my pills every morning at 8am\'');
  }
};

var processText = function (request) {
  var text = request.text.toLowerCase();
  var firstWord = text.split(' ')[0];
  // Process
  if (firstWord == 'remind') {
    console.log('new reminder');
    // Store reminder
    db.createReminder({
      phoneNumber: request.number,
      text: parser.getReminderText(text),
      interval: parser.getSendInterval(text),
      sendTime: parser.getSendTime(text),
      state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
    });
    request.response.message('Cool cool, I\'ll remind you to ' + parser.getReminderAction(text));

  } else if (firstWord == 'no' || firstWord == 'not') {
    console.log('no');

    if (text.split('no')[1].indexOf('because') > -1) { // if there is a reason after no
      console.log('because...');
      // Delete followup
      db.removeAllFollowups(request.number);
    }

  } else if (firstWord == 'yes') {
    console.log('yes');
    // Delete followup
    db.removeAllFollowups(request.number);

  } else if (firstWord == 'remove') {
    if (text.indexOf('reminders') > -1) {
      console.log('remove all reminders');
      // Delete followup
      db.removeAllReminders(request.number);
    }

  } else if (firstWord.indexOf('what') > -1) {
    if (text.indexOf('progress') > -1) {
      console.log('show progress');
      // Delete followup
      db.showProgress(request.number, function (completed) {
        var plural = "";
        if (completed > 1) {
          plural = "s";
        }
        twilioWrapper.sendText("You've completed " + completed + " challenge" + plural + " towards a better you!", request.number);
      });
    }

  } else if (text == 'better help') {
    console.log('help');
    request.response.message('You can ask me to remind you to do something and reply \'yes\' or \'no\'. I\'ll stop reminding you when you reply \'yes\' or give me a reason like \'No, because ...\'. You can also say \'Remove all reminders\'');

  } else { // Invalid
    console.log('invalid');
    request.response.message('Sorry friend didn\'t catch that. Type \'better help\' to see how to use BetterMe');
  }
};

var dequeueReminders = function() {
  var time = new Date();

  // REMINDERS
  db.incrementCurrentReminders(function (reminder) {
    twilioWrapper.sendText(reminder.text, reminder.phoneNumber);
    db.createFollowUp(reminder);
  });
  // FOLLOW UPS
  db.incrementCurrentFollowups(function (reminder) {
    twilioWrapper.sendText(reminder.text, reminder.phoneNumber);
  });
};



