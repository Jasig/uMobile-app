var DirectoryPersonVO = function (name, attributes) {
    var _self = this;
    //A person has the following attributes:
    //Required: name
    //Optional: email (array of email addresses), username, userLoginId, displayName, phone
    
    this.name = name || '';
    if (attributes.mail) {
        this.email = [];
        for (var i=0, iLength=attributes.mail.length; i<iLength; i++) {
            this.email.push(attributes.mail[i]);
        }
    }
    if (attributes.username) {
        if(typeof attributes.username == 'string') {
            this.username = attributes.username;
        }
        else if (typeof attributes.username == 'object') {
            this.username = attributes.username[0];
        }
        else {
            Ti.API.debug("User's username didn't match any type." + JSON.stringify(attributes.username) + ', ' + typeof attributes.username);
        }

    }
    if (attributes['user.login.id']) {
        this.userLoginId = attributes['user.login.id'];
    }
    if (attributes.displayName) {
        this.displayName = attributes.displayName;
    }
    if(attributes.phone) {
        this.phone = attributes.phone;
    }
};