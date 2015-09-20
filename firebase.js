var Firebase = require('firebase');
var fbRef = new Firebase('https://betterme-data.firebaseio.com/');

var usersRef = fbRef.child('Users');
var remindersRef = fbRef.child('Reminders');
var followUpsRef = fbRef.child('FollowUp');

module.exports = {
  // true/false if succeeded
  createUser: function(phoneNumber){
    var user = {
      phoneNumber: phoneNumber.toString(),
      name: null,
      email: null
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
  // var user = {
  //   phoneNumber: '9494194999',
  //   name: 'Shervin Shaikh',
  //   email: 'shervin@gmail.com',
  // }
  getUser: function(phoneNumber){
    // TODO
    // usersRef.on('value', function(snap){
    //   return snap.val();
    // });
    // return 'hello';
  },
  // var reminder = {
  //   phoneNumber: '9494194999',
  //   text: 'take birth control',
  //   interval: 86400000,
  //   sendTime: new Date().getTime(),
  //   state: 0, // 0 - reminder, 1 - first follow up, 2 - second follup up, etc
  // }
  createReminder: function(reminder){
    remindersRef.push(reminder);
  },
  createFollowUp: function(reminder){
    followUpsRef.push(reminder);
  },
  getRemindersAtTime: function(time){
    // remindersRef.on('child_added', function(snap){
    //   var reminder = snap.val();

    //   // TODO!
    //   snap.ref().remove();
    // });
  },
  removeFollowup: function (phoneNumber) {
    followUpsRef.orderByChild("phoneNumber").equalTo(phoneNumber).on("child_added", function(snapshot) {
      snap.ref().remove();
    });
  },
  getFollowUpsAtTime: function(time){
  //   followUpsRef.on('child_added', function(snap){
  //     var reminder = snap.val();

  //     // TODO!
  //     snap.ref().remove();
  //   });
  }
};

function isDataSaved(e){
  if(e){
    console.warn('Data could not be saved');
  } else {
    // console.log('Data saved succesfully');
  }
}


// Create function that is not accesible outsite
var doSomethingInternal = function () {
  // do some
};