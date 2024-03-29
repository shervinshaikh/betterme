var Firebase = require('firebase');
var fbRef = new Firebase('https://betterme-data.firebaseio.com/');

var usersRef = fbRef.child('Users');
var remindersRef = fbRef.child('Reminders');
var followUpsRef = fbRef.child('FollowUp');

module.exports = {
  // true/false if succeeded
  createUser: function(phoneNumber){
    var user = {
      phoneNumber: phoneNumber,
      name: null,
      email: null,
      completed: 0
      // currentState: 'registered' // or 0? do we need this?
    };
    usersRef.child(phoneNumber).set(user, isDataSaved);
  },
  setName: function(phoneNumber, name){
    usersRef.child(phoneNumber).update({
      name: name
    }, isDataSaved);
  },
  setEmail: function(phoneNumber, email){
    usersRef.child(phoneNumber).update({
      email: email
    }, isDataSaved);
  },
  getUser: function(phoneNumber, callback){
    usersRef.child(phoneNumber).once("value", function(snap) {
      callback(snap.val());
    });
  },
  showProgress: function (phoneNumber, callback) {
    usersRef.child(phoneNumber).child("completed").once("value", function(snap) {
      callback(snap.val() || 0);
    });
  },
  createReminder: function(reminder){
    remindersRef.push(reminder);
  },
  removeAllReminders: function (phoneNumber) {
    remindersRef
      .orderByChild("phoneNumber")
      .equalTo(phoneNumber)
      .once("child_added", function(snap) {
      var reminder = snap.val();
      console.log(reminder);
      if (reminder.phoneNumber == phoneNumber) {
        snap.ref().remove();
      }

    });
  },
  createFollowUp: function(reminder){
    followUpsRef.child(reminder.phoneNumber).set(reminder);
  },
  removeAllFollowups: function (phoneNumber) {
    followUpsRef.child(phoneNumber).once("value", function(snap) {
      snap.ref().remove();
      usersRef.child(phoneNumber).child("completed").transaction(function(value) {
        return (value || 0) + 1;
      });
    });
  },
  incrementCurrentReminders: function(callback) {
    var time = new Date();
    remindersRef
      .orderByChild('sendTime')
      .endAt(time.getTime())
      .on('child_added', function (snap) {
        var reminder = snap.val();

        console.log('');
        console.log(reminder.phoneNumber);
        console.log(reminder.text);
        console.log('reminder');

        // Increment Reminder
        remindersRef.child(snap.key()).update({
          sendTime: reminder.sendTime + reminder.interval
        });

        // Create follow up
        reminder.state += 1;
        // TODO: change to some dynamic value depnding on state
        var extraMinutes = 1 * 60000; // min to ms conversion
        reminder.sendTime += extraMinutes;
        // reminder.sendTime += reminder.interval;
        // reminder.interval = 5 * 60000; // 5 min

        callback(reminder);
      });
  },
  incrementCurrentFollowups: function(callback) {
    var time = new Date();
    followUpsRef
      .orderByChild('sendTime')
      .endAt(time.getTime())
      .on('child_added',  function(snap){
        var reminder = snap.val();

        callback(reminder);

        console.log('');
        console.log(reminder.phoneNumber);
        console.log(reminder.text);

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
  }
};

function isDataSaved(e){
  if(e){
    console.warn('Data could not be saved');
  } else {
    // console.log('Data saved succesfully');
  }
}