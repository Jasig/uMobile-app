var UI = function (facade) {
    var self = {}, app=facade, init, device;
    
    init = function () {
        device = app.models.deviceProxy;
    };
    
    self.createSearchBar = function () {
        var searchBar, searchBarObject = {}, searchBarInput;
        
        if (device.isIOS()) {
            searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
            searchBarObject.container = searchBar;
            searchBarObject.input = searchBar;
        }
        else {
            searchBar = Titanium.UI.createView(app.styles.searchBar);
            searchBarInput = Titanium.UI.createTextField(app.styles.searchBarInput);
            searchBar.add(searchBarInput);
            searchBarObject.container = searchBar;
            searchBarObject.input = searchBarInput;
        }
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            if (searchBar) { searchBar.width = app.styles.searchBar.width; }
            if (searchBarInput) { searchBarInput.width = app.styles.searchBarInput.width; }
        });
        
        return searchBarObject;
    };
    
    self.createTitleBar = function (opts) {
        // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
        //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
        var initTitleBar, title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, 
            titleBar = Titanium.UI.createView(app.styles.titleBar),
            labelStyle = app.styles.titleBarLabel,
            onSettingsClick, onSettingsPressDown, onSettingsPressUp, onHomeClick, onHomePressUp, onHomePressDown;

        initTitleBar = function () {
            if (opts.title) {
                //Places the title in the center of the titlebar...
                labelStyle.text = opts.title;
                title = Titanium.UI.createLabel(labelStyle);
                titleBar.add(title);
            }
            titleBar.updateTitle = function (t) {
                title.text = t;
            };
            if (opts.backButton) {
                //This adds a button at the left of the title bar, presumably to go back to a previous view. Not limited to that, as there are no event listeners added here.
                //Expects a view object.
                //There should only be either a home button or backbutton, not both.
                backButton = opts.backButton;
                titleBar.add(backButton);
            }
            if (opts.homeButton && !opts.backButton) {
                //Expects homeButton to be a boolean indicating whether or not to show the home button
                //There shouldn't be a home button and back button, as then the bar just gets too cluttered. Back button wins in a fight.
                homeButtonContainer = Titanium.UI.createView(app.styles.titleBarHomeContainer);
                titleBar.add(homeButtonContainer);

                homeButton = Titanium.UI.createImageView(app.styles.titleBarHomeButton);
                homeButtonContainer.add(homeButton);

                homeButtonContainer.addEventListener('singletap', onHomeClick);
                homeButtonContainer.addEventListener('touchstart', onHomePressDown);
                homeButtonContainer.addEventListener(device.isAndroid() ? 'touchcancel' : 'touchend', onHomePressUp);

            }
            if (opts.settingsButton) {
                settingsButtonContainer = Titanium.UI.createView(app.styles.titleBarSettingsContainer);
                titleBar.add(settingsButtonContainer);

                //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
                settingsButton = Titanium.UI.createImageView(app.styles.titleBarSettingsButton);
            	settingsButtonContainer.add(settingsButton);

                settingsButtonContainer.addEventListener('singletap', onSettingsClick);
                settingsButtonContainer.addEventListener('touchstart', onSettingsPressDown);
                settingsButtonContainer.addEventListener(device.isAndroid() ? 'touchcancel' : 'touchend', onSettingsPressUp);
            }
            
            Titanium.App.addEventListener('dimensionchanges', function (e) {
            	if (titleBar) { titleBar.width = app.styles.titleBar.width; }
                if (settingsButtonContainer) { settingsButtonContainer.left = app.styles.titleBarSettingsContainer.left; }
                if (homeButtonContainer) { homeButtonContainer.left = app.styles.titleBarHomeContainer.left; }
            });
        };
        
        onHomeClick = function (e) {
            Ti.API.debug("Home button clicked in GenericTitleBar");
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
        };

        onHomePressDown = function (e) {
            var timeUp;

            homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColorPressed;
            if (device.isAndroid()) {
                //Because Android doesn't consistently register touchcancel or touchend, especially
                //when the window changes in the middle of a press
                timeUp = setTimeout(function(){
                    homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
                    clearTimeout(timeUp);
                }, 1000);
            }
        };

        onHomePressUp = function (e) {
            homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
        };
        onSettingsClick = function (e) {
            app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
        };

        onSettingsPressDown = function (e) {
            var timeUp;
            settingsButtonContainer.backgroundColor = app.styles.titleBarSettingsContainer.backgroundColorPressed;
            if (device.isAndroid()) {
                //Because Android doesn't consistently register touchcancel or touchend, especially
                //when the window changes in the middle of a press
                timeUp = setTimeout(function(){
                    settingsButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
                    clearTimeout(timeUp);
                }, 1000);            
            }
        };

        onSettingsPressUp = function (e) {
            settingsButtonContainer.backgroundColor = app.styles.titleBarSettingsContainer.backgroundColor;
        };

        initTitleBar();

        return titleBar;
    };
    
    self.createSecondaryNavBar = function (opts) {
        var secondaryNavBar;
        // A partial view used in some controllers to place a nav bar just below the titleBar
        if(opts.style) {
            Ti.API.debug("opts.style defined in SecondaryNavBar");
            secondaryNavBar = Titanium.UI.createView(style);
        }
        else {
            Ti.API.debug("opts.style not defined in SecondaryNavBar, will create with style: " + app.styles.secondaryNavBar);
            secondaryNavBar = Titanium.UI.createView(app.styles.secondaryNavBar);
        }

        if(opts.backButton) {
            secondaryNavBar.add(opts.backButton);
        }
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            secondaryNavBar.width = app.styles.secondaryNavBar.width;
        });
        
        return secondaryNavBar;
    };
    
    self.createActivityIndicator = function () {
        var messageLabel,
            indicator = Ti.UI.createView(app.styles.globalActivityIndicator),
            dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);

        indicator.add(dialog);
        
        messageLabel = Ti.UI.createLabel(app.styles.activityIndicatorMessage);
        messageLabel.text = app.localDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.setLoadingMessage = function (m) {
            Ti.API.info("loadingMessage() in GlobalActivityIndicator");
            if (typeof m == 'string') {
                Ti.API.debug("Setting activity indicator text to: " + m);
                messageLabel.text = m;
            }
            else {
                Ti.API.debug("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.resetDimensions = function () {
            indicator.top = app.styles.globalActivityIndicator.top;
            indicator.height = app.styles.globalActivityIndicator.height;
            indicator.width = app.styles.globalActivityIndicator.width;
        };
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            indicator.resetDimensions();
        });
        
        return indicator;
    };
    
    init();
    
    return self;
};