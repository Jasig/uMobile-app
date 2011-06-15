var DirectoryDetailController = function (facade) {
    var app = facade,
        Device, Styles, LocalDictionary, PersonDetailTable, Config,
        self = Titanium.UI.createView(app.styles.contactDetailView), init,
        //UI Components
        titleBar, backBar, nameLabel, phoneLabel, attributeTable, backButton,
        //Methods
        updateValues,
        //Controller Event Handlers
        onDimensionChanges;
    
    init = function () {
        Ti.API.debug('DirectoryDetailController constructed');
        var backButtonOpts, backBarOpts;
        
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        PersonDetailTable = app.views.PersonDetailTableView;
        Config = app.config;
        
        self.initialized = true;
        self.update = updateValues;
        
        backButtonOpts = Styles.secondaryBarButton.clone();
        backButtonOpts.title = LocalDictionary.back;
        backButton = Titanium.UI.createButton(backButtonOpts);

        backButton.addEventListener("click",function(e){
            Ti.API.debug("self.hide() in DirectoryDetailController");
                self.hide();
        });
        
        backBarOpts = Styles.secondaryBar.clone();
        backBarOpts.top = 0;
        backBar = Titanium.UI.createView(backBarOpts);
        backBar.add(backButton);
        self.add(backBar);
        

        nameLabel = Titanium.UI.createLabel(Styles.directoryDetailNameLabel);
        backBar.add(nameLabel);
        
        attributeTable = new PersonDetailTable(app, Styles.directoryDetailAttributeTable);
        self.add(attributeTable);
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
        
        Titanium.App.addEventListener('dimensionchanges', onDimensionChanges);
    };
    
    updateValues = function (attributes) {
        var person = constructPerson(attributes);
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
        self.width = app.styles.contactDetailView.width;
        self.height = app.styles.contactDetailView.height;
        
        if (backBar) {
            backBar.width = Styles.secondaryBar.width; 
        }
        else {
            Ti.API.error("backBar is undefined in DirectoryDetailController");
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

    if (!self.initialized) {
        Ti.API.debug("initializing DirectoryDetailController");
        init();
    }
    
    return self;
};