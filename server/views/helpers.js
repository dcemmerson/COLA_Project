
var register = function(Handlebars) {
    var helpers = {
	toHumanDate: function(date) {
	    const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' })
		  .format(date);
            return date.getUTCDate() + ' ' + monthShort + ' ' + date.getFullYear();
	},
    };

    if (Handlebars && typeof Handlebars.registerHelper === "function") {
	for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
	}
    } else {
	return helpers;
    }

};

module.exports.register = register;
module.exports.helpers = register(null); 
