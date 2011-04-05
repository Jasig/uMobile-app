var DirectoryDetailController = function (facade,opts) {
    var app = facade,
        self = Titanium.UI.createView(opts),
        //UI Components
        titleBar,
        nameLabel,
        phoneLabel,
        attributeTable,
        //Methods
        updateValues,
        //Controller Event Handlers
        onWinOpen,
        onWinShow,
        onWinHide,
        onWinClose;
    
    self.construct = function () {
        Ti.API.debug('DirectoryDetailController constructed');
        var titleBackButtonOpts;
        self.initialized = true;
        self.update = updateValues;
        
        titleBackButtonOpts = app.styles.titleBarButton;
        titleBackButtonOpts.title = app.localDictionary.back;
        titleBackButton = Titanium.UI.createButton(titleBackButtonOpts);

        titleBackButton.addEventListener("click",function(e){
            self.hide();
        });
        //Create a title bar with generic title, plus a button to go back to the directory.
        titleBar = new app.views.GenericTitleBar({
            key: 'directory',
            app: app,
            title: app.localDictionary.contactDetail,
            backButton: titleBackButton
        });
        self.add(titleBar);

        nameLabel = Titanium.UI.createLabel(app.styles.directoryDetailNameLabel);
        self.add(nameLabel);
        
        attributeTable = new app.views.PersonDetailTableView(app,app.styles.directoryDetailAttributeTable);
        self.add(attributeTable);
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
        Ti.API.info('created person');
        Ti.API.info(person.address);
        
        //A person has the following attributes:
        //Required: name
        //Optional: email (array of email addresses), username, userLoginId, displayName, phone

        person.address.home = getAttribute('homeAddress', attributes);
        person.email.home = getAttribute('homeEmail', attributes);
        person.phone.home = getAttribute('homePhone', attributes);
        
        person.department = getAttribute('organization', attributes);
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

    if (!self.initialized) {
        Ti.API.debug("initializing DirectoryDetailController");
        self.construct();
    }
    
    return self;
};