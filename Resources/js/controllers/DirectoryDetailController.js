(function(){
    var win =Ti.UI.currentWindow,
        app = win.app,
        self = {},
        contact = win.contact, //Should be a DirectoryPersonVO object
        //UI Components
        titleBar,
        nameLabel,
        phoneLabel,
        //Methods
        updateValues,
        //Controller Event Handlers
        onWinOpen,
        onWinShow,
        onWinHide,
        onWinClose;
    
    self.init = function () {
        Ti.API.debug("Initializing DirectoryDetailController");
        win.backgroundColor = app.UPM.GLOBAL_STYLES.windowBackgroundColor;
        win.initialized = true;
        win.addEventListener('focus',onWinShow);
        win.addEventListener('hide',onWinHide);
        win.addEventListener('close',onWinClose);
        
        win.update = updateValues;
        
        titleBackButton = Titanium.UI.createButton({
            title: win.app.localDictionary.back
        });

        titleBackButton.addEventListener("click",function(e){
            win.hide();
        });
        //Create a title bar with generic title, plus a button to go back to the directory.
        titleBar = new app.views.GenericTitleBar({
            key: win.key,
            app: app,
            title: app.localDictionary.contactDetail,
            backButton: titleBackButton
        });
        win.add(titleBar);

        nameLabel = Titanium.UI.createLabel({
            top: app.UPM.TITLEBAR_HEIGHT + 10,
            height: 24,
            font: {
                fontSize: 24,
                fontWeight: 'bold'
            }
        });
        win.add(nameLabel);

        phoneLabel = Titanium.UI.createLabel({
            height: 24,
            top: 100,
            font: {
                fontSize: 24
            }
        });
        win.add(phoneLabel);
        updateValues(win.contact);

    };
    
    updateValues = function (person) {
        Ti.API.info("Updating values..." + JSON.stringify(person));
        if(person.phone){
            phoneLabel.text = person.phone;
            phoneLabel.show();
        }
        else {
            phoneLabel.hide();
        }
        nameLabel.text = person.name;
    };

    onWinShow = function (e) {
        //TODO: remove if not needed
        Ti.API.info("onWinShow in DirectoryDetailController");
    };
    onWinHide = function (e) {
        phoneLabel.text = '';
    };
    onWinClose = function (e) {
        //TODO: remove if not needed
    };

    if (!win.initialized) {
        self.init();
    }
})();