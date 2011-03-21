var DirectoryPersonVO = function (name,attributes) {
    var person = {};
    
    //A person has the following attributes:
    //Required: name
    //Optional: email (array of email addresses), username, userLoginId, displayName, phone
    
    person.name = name || '';
    if (attributes.mail) {
        person.email = [];
        for (var i=0, iLength=attributes.mail.length; i<iLength; i++) {
            person.email.push(attributes.mail[i]);
        }
    }
    if (attributes.username) {
        person.username = attributes.username;
    }
    if (attributes['user.login.id']) {
        person.userLoginId = attributes['user.login.id'];
    }
    if (attributes.displayName) {
        person.displayName = attributes.displayName;
    }
    if(attributes.phone) {
        person.phone = attributes.phone;
    }
    return person;
};