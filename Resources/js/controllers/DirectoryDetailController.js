var DirectoryDetailController = function (facade) {
    var app = facade,
        self = Titanium.UI.createView(app.styles.contactDetailView),
        //UI Components
        titleBar,
        nameLabel,
        phoneLabel,
        attributeTable,
        backButton,
        //Methods
        updateValues,
        //Controller Event Handlers
        onWinOpen,
        onWinShow,
        onWinHide,
        onWinClose,
        onBackButtonPress,
        onBackButtonUp;
    
    self.construct = function () {
        Ti.API.debug('DirectoryDetailController constructed');
        var backButtonOpts, backBarOpts, backBar;
        self.initialized = true;
        self.update = updateValues;
        
        backButtonOpts = app.styles.secondaryBarButton;
        backButtonOpts.title = app.localDictionary.back;
        backButton = Titanium.UI.createButton(backButtonOpts);

        backButton.addEventListener("click",function(e){
            self.hide();
        });
        
        backButton.addEventListener('touchstart', onBackButtonPress);
        backButton.addEventListener('touchend', onBackButtonUp);
        
        backBarOpts = app.styles.secondaryBar;
        backBarOpts.top = 0;
        backBar = Titanium.UI.createView(app.styles.secondaryBar);
        backBar.add(backButton);
        self.add(backBar);
        

        nameLabel = Titanium.UI.createLabel(app.styles.directoryDetailNameLabel);
        backBar.add(nameLabel);
        
        attributeTable = new app.views.PersonDetailTableView(app, app.styles.directoryDetailAttributeTable);
        self.add(attributeTable);
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            if (backBar) { backBar.width = app.styles.secondaryBar.width; }
        });
    };
    
    updateValues = function (attributes) {
        person = constructPerson(attributes);
        Ti.API.info("updateValues: " + JSON.stringify(person));
        nameLabel.text = person.fullName;
        attributeTable.update(person);
    };
    
    var constructPerson = function (attributes) {
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

    var getAttribute = function (tiAttrName, attributes) {
        Ti.API.info("getting attribute " + tiAttrName);
        var portalAttrName = app.UPM.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
        if (portalAttrName) {
            var values = attributes[portalAttrName];
            Ti.API.info(values);
            if (values && values.length > 0) {
                return values[0].replace('$', '\n');
            }
        }
        return null;
    };

    onBackButtonPress = function (e) {
        backButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradientPress;
    };
    
    onBackButtonUp = function (e) {
        backButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradient;
    };

    if (!self.initialized) {
        Ti.API.debug("initializing DirectoryDetailController");
        self.construct();
    }
    
    return self;
};