var DirectoryPersonVO = function (name,attributes) {
    var person = {};
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
    return person;
};