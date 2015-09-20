var twilio = require('twilio');
// Your accountSid and authToken from twilio.com/user/account
var accountSid = 'AC80a0d744f7b5ba4d84161cc049ec6178';
var authToken = "551d8b9ecff6d1fa3f86328d328c9c2b";
var client = twilio(accountSid, authToken);
 
module.exports = {
  sendText: function (text, number) {
	client.messages.create({
	    body: text,
	    to: "+1" + number,
	    from: "+15106835361" // BetterMe Twilio Number
	}, function(err, message) {
	    process.stdout.write(message.sid);
	});
  },
  parseRequest: function (req) {
	var resp = new twilio.TwimlResponse();

	return {
		response: resp,
		text: req.body.Body,
		number: req.body.From
	};
  }
};

