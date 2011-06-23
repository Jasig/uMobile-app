var UI = function (facade) {
    var _self = this, app=facade, init, Device, Styles, WindowManager, SettingsWindow, PortalWindow, LocalDictionary;
    
    init = function () {
        Device = app.models.deviceProxy;
        Styles = app.styles;
        WindowManager = app.models.windowManager;
        LocalDictionary = app.localDictionary;
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
    };
    
    this.createSearchBar = function (opts) {
        var searchBar, searchBarObject = {}, searchBarInput;
        
        if (Device.isIOS()) {
            searchBar = Titanium.UI.createSearchBar(Styles.searchBar);
            searchBarObject.container = searchBar;
            searchBarObject.input = searchBar;
        }
        else {
            searchBar = Titanium.UI.createView(Styles.searchBar);
            searchBarInput = Titanium.UI.createTextField(Styles.searchBarInput);
            searchBar.add(searchBarInput);
            searchBarObject.container = searchBar;
            searchBarObject.input = searchBarInput;
        }
        
        if (opts.cancel) {
            searchBarObject.input.addEventListener('cancel', opts.cancel);
        }
        if (opts.submit) {
            searchBarObject.input.addEventListener('return', opts.submit);
        }
        if (opts.change) {
            searchBarObject.input.addEventListener('change', opts.change);
        }
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            if (searchBar) { searchBar.width = Styles.searchBar.width; }
            if (searchBarInput) { searchBarInput.width = Styles.searchBarInput.width; }
        });
        
        return searchBarObject;
    };
    
    this.createTitleBar = function (opts) {
        // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
        //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
        var initTitleBar, title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, 
            titleBar = Titanium.UI.createView(Styles.titleBar),
            labelStyle = Styles.titleBarLabel,
            onSettingsClick, onSettingsPressDown, onSettingsPressUp, onHomeClick, onHomePressUp, onHomePressDown;
        
        if (!SettingsWindow) {
            SettingsWindow = app.controllers.settingsWindowController;
        }
        if (!PortalWindow) {
            PortalWindow = app.controllers.portalWindowController;
        }

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
                homeButtonContainer = Titanium.UI.createView(Styles.titleBarHomeContainer);
                titleBar.add(homeButtonContainer);

                homeButton = Titanium.UI.createImageView(Styles.titleBarHomeButton);
                homeButtonContainer.add(homeButton);

                homeButtonContainer.addEventListener('singletap', onHomeClick);
                homeButtonContainer.addEventListener('touchstart', onHomePressDown);
                homeButtonContainer.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onHomePressUp);

            }
            if (opts.settingsButton) {
                settingsButtonContainer = Titanium.UI.createView(Styles.titleBarSettingsContainer);
                titleBar.add(settingsButtonContainer);

                //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
                settingsButton = Titanium.UI.createImageView(Styles.titleBarSettingsButton);
            	settingsButtonContainer.add(settingsButton);

                settingsButtonContainer.addEventListener('singletap', onSettingsClick);
                settingsButtonContainer.addEventListener('touchstart', onSettingsPressDown);
                settingsButtonContainer.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onSettingsPressUp);
            }
            
            Titanium.App.addEventListener('dimensionchanges', function (e) {
                Ti.API.info("dimensionchanges in UI");
            	if (titleBar) { titleBar.width = Styles.titleBar.width; }
                if (settingsButtonContainer) { settingsButtonContainer.left = Styles.titleBarSettingsContainer.left; }
                if (homeButtonContainer) { homeButtonContainer.left = Styles.titleBarHomeContainer.left; }
            });
        };
        
        onHomeClick = function (e) {
            Ti.API.debug("Home button clicked in GenericTitleBar");
            WindowManager.openWindow(PortalWindow.key);
        };

        onHomePressDown = function (e) {
            var timeUp;

            homeButtonContainer.backgroundColor = Styles.titleBarHomeContainer.backgroundColorPressed;
            if (Device.isAndroid()) {
                //Because Android doesn't consistently register touchcancel or touchend, especially
                //when the window changes in the middle of a press
                timeUp = setTimeout(function(){
                    homeButtonContainer.backgroundColor = Styles.titleBarHomeContainer.backgroundColor;
                    clearTimeout(timeUp);
                }, 1000);
            }
        };

        onHomePressUp = function (e) {
            homeButtonContainer.backgroundColor = Styles.titleBarHomeContainer.backgroundColor;
        };
        onSettingsClick = function (e) {
            WindowManager.openWindow(SettingsWindow.key);
        };

        onSettingsPressDown = function (e) {
            var timeUp;
            settingsButtonContainer.backgroundColor = Styles.titleBarSettingsContainer.backgroundColorPressed;
            if (Device.isAndroid()) {
                //Because Android doesn't consistently register touchcancel or touchend, especially
                //when the window changes in the middle of a press
                timeUp = setTimeout(function(){
                    settingsButtonContainer.backgroundColor = Styles.titleBarHomeContainer.backgroundColor;
                    clearTimeout(timeUp);
                }, 1000);            
            }
        };

        onSettingsPressUp = function (e) {
            settingsButtonContainer.backgroundColor = Styles.titleBarSettingsContainer.backgroundColor;
        };

        initTitleBar();

        return titleBar;
    };
    
    this.createSecondaryNavBar = function (opts) {
        var _secondaryNavBar, _backBtnOptions, _navBackButton, _titleLabel;
        // A partial view used in some views to place a nav bar just below the titleBar
        _secondaryNavBar = Titanium.UI.createView(Styles.secondaryNavBar);

        if(opts.backButtonHandler) {
            _backBtnOptions = Styles.secondaryBarButton.clone();
            _backBtnOptions.title = LocalDictionary.back;

            _navBackButton = Titanium.UI.createButton(_backBtnOptions);
            _navBackButton.addEventListener('click', opts.backButtonHandler);
            _secondaryNavBar.add(_navBackButton);
        }
        
        if (opts.title) {
            _titleLabel = Titanium.UI.createLabel(Styles.secondaryNavBarLabel);
            _secondaryNavBar.add(_titleLabel);
            _secondaryNavBar.updateTitle = function (newTitle) {
                _titleLabel.text = newTitle;
            };
        }
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            _titleLabel.width = Styles.secondaryNavBarLabel.width;
            _secondaryNavBar.width = Styles.secondaryNavBar.width;
        });
        
        return _secondaryNavBar;
    };
    
    this.createActivityIndicator = function () {
        var messageLabel,
            indicator = Ti.UI.createView(Styles.globalActivityIndicator),
            dialog = Ti.UI.createView(Styles.activityIndicatorDialog);

        indicator.add(dialog);
        
        messageLabel = Ti.UI.createLabel(Styles.activityIndicatorMessage);
        messageLabel.text = LocalDictionary.loading;
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
            indicator.top = Styles.globalActivityIndicator.top;
            indicator.height = Styles.globalActivityIndicator.height;
            indicator.width = Styles.globalActivityIndicator.width;
            dialog.width = Styles.activityIndicatorDialog.width;
        };
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            indicator.resetDimensions();
        });
        
        return indicator;
    };
    
    this.onOrientationChange = function (e) {
        Ti.API.info('orientationchange' + JSON.stringify(e) + " & current is " + app.models.deviceProxy.getCurrentOrientation());
        Device.setCurrentOrientation(e.orientation);
        app.styles = new Styles(app);
        Ti.App.fireEvent('updatestylereference');
        Ti.App.fireEvent('dimensionchanges', {orientation: e.orientation});
    };
    
    init();
};