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
    
    updateValues = function (person) {        
        Ti.API.info("updateValues: " + JSON.stringify(person));
        nameLabel.text = person.name;
        attributeTable.update(person);
    };

    if (!self.initialized) {
        Ti.API.debug("initializing DirectoryDetailController");
        self.construct();
    }
    
    return self;
};