/* 
* @constructor
* @implements {IDetailView}
*/
var DirectoryDetailView = function (facade) {
    var app = facade, init, _self = this, _view,
        Device, Styles, LocalDictionary, PersonDetailTable, Config, UI,
        //UI Components
        titleBar, secondaryNavBar, nameLabel, phoneLabel, attributeTable, backButton,
        //Methods
        updateValues, constructPerson, getAttribute,
        //Controller Event Handlers
        onDimensionChanges, onBackBtnClick;
    
    init = function () {
        Ti.API.debug('DirectoryDetailController constructed');
        
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        PersonDetailTable = app.views.PersonDetailTableView;
        Config = app.config;
        UI = app.UI;
        
        _self.initialized = true;
    };
    
    this.getDetailView = function () {
        if (!_view) {
            _view = Titanium.UI.createView(app.styles.contactDetailView);
            secondaryNavBar = UI.createSecondaryNavBar({
                backButtonHandler: onBackBtnClick,
                title: ' '
            });
            _view.add(secondaryNavBar);

            attributeTable = new PersonDetailTable(app, Styles.directoryDetailAttributeTable);
            _view.add(attributeTable);

            Ti.App.addEventListener('updatestylereference', function (e) {
                Styles = app.styles;
            });

            Titanium.App.addEventListener('dimensionchanges', onDimensionChanges);
        }
        return _view;
    };
    
    this.render = function (attributes) {
        var person = constructPerson(attributes);
        Ti.API.info("updateValues: " + JSON.stringify(person));
        secondaryNavBar.updateTitle(person.fullName);
        attributeTable.update(person);
        _view.show();
    };
    
    this.hide = function () {
        _view.hide();
    };
    
    constructPerson = function (attributes) {
        Ti.API.info('creating person');
        var person = {};
        person.address = {};
        person.email = {};
        person.phone = {};
        person.URL = {};
        Ti.API.info('created person');
        Ti.API.info(person.address);
        
        //A person has the following attributes:
        //Required: name
        //Optional: email (array of email addresses), username, userLoginId, displayName, phone

        person.address.home = getAttribute('homeAddress', attributes);
        person.email.home = getAttribute('homeEmail', attributes);
        person.phone.home = getAttribute('homePhone', attributes);
        person.URL.home = getAttribute('URL', attributes);
        
        person.organization = getAttribute('organization', attributes);
        person.department = getAttribute('department', attributes);
        person.firstName = getAttribute('firstName', attributes);
        person.fullName = getAttribute('fullName', attributes);
        person.jobTitle = getAttribute('jobTitle', attributes);
        person.lastName = getAttribute('lastName', attributes);        
        Ti.API.info(person);

        return person;
    };

    getAttribute = function (tiAttrName, attributes) {
        Ti.API.info("getting attribute " + tiAttrName);
        var portalAttrName = Config.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
        if (portalAttrName) {
            var values = attributes[portalAttrName];
            Ti.API.info(values);
            if (values && values.length > 0) {
                return values[0].replace('$', '\n');
            }
        }
        return null;
    };
    
    onDimensionChanges = function (e) {
        Ti.API.debug("onDimensionChanges() in DirectoryDetailController");
        if (_view) {
            _view.width = app.styles.contactDetailView.width;
            _view.height = app.styles.contactDetailView.height;
        }
        
        if (secondaryNavBar) {
            secondaryNavBar.width = Styles.secondaryBar.width; 
        }
        else {
            Ti.API.error("secondaryNavBar is undefined in DirectoryDetailController");
        }
        if (nameLabel) {
            nameLabel.width = Styles.directoryDetailNameLabel.width; 
        }
        else {
            Ti.API.error("nameLabel is undefined in DirectoryDetailController");
        }
        if (attributeTable) {
            attributeTable.width = Styles.directoryDetailAttributeTable.width;
        }
        else {
            Ti.API.error("attributeTable is undefined in DirectoryDetailController");
        }
    };
    
    onBackBtnClick = function () {
        Ti.API.debug("onBackBtnClick() in DirectoryDetailController");
        _view.hide();
    };

    if (!_self.initialized) {
        Ti.API.debug("initializing DirectoryDetailController");
        init();
    }
};