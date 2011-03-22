var DirectoryDetailController = function (facade) {
    var app = facade,
        self = Titanium.UI.createView({visible:false}),
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
        Ti.API.debug("Initializing DirectoryDetailController");
        self.backgroundColor = app.UPM.GLOBAL_STYLES.detailTopBackgroundColor;
        self.initialized = true;
        self.update = updateValues;
        
        titleBackButton = Titanium.UI.createButton({
            title: app.localDictionary.back,
            className: 'titleBarButton'
        });

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

        nameLabel = Titanium.UI.createLabel({
            top: app.UPM.TITLEBAR_HEIGHT,
            left: 10,
            height: 85,
            color: app.UPM.GLOBAL_STYLES.detailTopTitleColor,
            font: {
                fontSize: 24,
                fontWeight: 'bold'
            }
        });
        self.add(nameLabel);
        
        attributeTable = new app.views.PersonDetailTableView({
            app: app,
            top: 125
        });
        self.add(attributeTable);
    };
    
    updateValues = function (person) {        
        Ti.API.info("updateValues: " + JSON.stringify(person));
        nameLabel.text = person.name;
        attributeTable.update(person);
    };

    if (!self.initialized) {
        self.construct();
    }
    
    return self;
};