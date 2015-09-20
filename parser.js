var chrono = require('chrono-node');

var getSendTime = function(text) {
    var str = text.toLowerCase().split(' every')[1];
    var t = chrono.parseDate(str);

    t = t || new Date(); // If not able to parse

    // If no numbers
    var matches = str.match(/\d+/g);
    if (matches === null) {
        if (str.indexOf("morning") > -1) {
            t.setHours(8);
        } else if (str.indexOf("noon") > -1) {
            t.setHours(12);
        } else if (str.indexOf("evening") > -1) {
            t.setHours(19);
        } else if (str.indexOf("midnight") > -1) {
            t.setHours(0);
        }
    }

    // If in the past, increment one day
    if (t < new Date()) {
        t = new Date(t.getTime() + getSendInterval(text));
    }

    return t.getTime();
};
var getSendInterval = function(text) {
    var i = text.toLowerCase().split(' every')[1];
    if (i.indexOf("month") > -1) {
        return 1000 * 60 * 60 * 24 * 30;
    } else if (i.indexOf("week") > -1 ||
        i.indexOf("monday") > -1 ||
        i.indexOf("tuesday") > -1 ||
        i.indexOf("wednesday") > -1 ||
        i.indexOf("thursday") > -1 ||
        i.indexOf("friday") > -1 ||
        i.indexOf("saturday") > -1 ||
        i.indexOf("sunday") > -1) {

        return 1000 * 60 * 60 * 24 * 7;
    } else if (i.indexOf("day") > -1) {
        return 1000 * 60 * 60 * 24;
    } else if (i.indexOf("hour") > -1) {
        return 1000 * 60 * 60;
    } else { // Default is day
        return 1000 * 60 * 60 * 24;
    }
};
var getReminderText = function(text) {
    var remindStr = text.toLowerCase().split(' every')[0];
    remindStr = remindStr
    				.split('remind me to ')[1]
    				.replace(/ my /g, ' your ');
    return remindStr;
};

module.exports = {
    getSendTime: getSendTime,
    getSendInterval: getSendInterval,
    getReminderText: getReminderText
};