/* 
* @constructor
*/
var DirectoryPersonVO = function (facade) {
    var _self = this, app=facade, Config, init,
    getAttribute;
    
    init = function () {
        Config = app.config;
    };
    
    this.constructVO = function (attributes) {
        var _person = {};
        
        Ti.API.info('creating person');
        _person.address = {};
        _person.email = {};
        _person.phone = {};
        _person.URL = {};
        Ti.API.info('created person');
        
        //A person has the following attributes:
        //Required: name
        //Optional: email (array of email addresses), username, userLoginId, displayName, phone

        _person.address.home = getAttribute('homeAddress', attributes);
        _person.email.home = getAttribute('homeEmail', attributes);
        _person.phone.home = getAttribute('homePhone', attributes);
        _person.URL.home = getAttribute('URL', attributes);
        
        _person.organization = getAttribute('organization', attributes);
        _person.department = getAttribute('department', attributes);
        _person.firstName = getAttribute('firstName', attributes);
        _person.fullName = getAttribute('fullName', attributes);
        _person.jobTitle = getAttribute('jobTitle', attributes);
        _person.lastName = getAttribute('lastName', attributes);        
        
        return _person;
    };

    getAttribute = function (tiAttrName, attributes) {
        Ti.API.info("getting attribute " + tiAttrName);
        var portalAttrName = Config.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
        if (portalAttrName) {
            var values = attributes[portalAttrName];
            if (values && values.length > 0) {
                return values[0].replace('$', '\n');
            }
        }
        return null;
    };
    
    init();
};