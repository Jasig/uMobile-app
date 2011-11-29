/*
 * Licensed to Jasig under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Jasig licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var UI = function (facade) {
    var _self = this, app=facade, init, Device, Styles, SettingsWindow, PortalWindow, PortletWindow, LocalDictionary;
    
    init = function () {
        Device = app.models.deviceProxy;
        Config = app.config;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        Ti.App.addEventListener(app.events['STYLESHEET_UPDATED'], function (e) {
            Styles = app.styles;
        });
    };
    

    
    this.createTitleBar = function (opts) {
        // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
        //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
        var initTitleBar, title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, infoButton, infoButtonContainer,
            titleBar = Titanium.UI.createView(Styles.titleBar),
            labelStyle = Styles.titleBarLabel,
            onSettingsClick, onSettingsPressDown, onSettingsPressUp, onHomeClick, onHomePressUp, onHomePressDown, onInfoClick, onInfoPressUp, onInfoPressDown;
        
        if (!SettingsWindow) {
            SettingsWindow = app.controllers.settingsWindowController;
        }
        if (!PortalWindow) {
            PortalWindow = app.controllers.portalWindowController;
        }
        if (!PortletWindow) {
            PortletWindow = app.controllers.portletWindowController;
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
            if (opts.infoButton && !opts.homeButton) {
                infoButtonContainer = Titanium.UI.createView(Styles.titleBarInfoContainer);
                titleBar.add(infoButtonContainer);
                
                infoButton = Titanium.UI.createImageView(Styles.titleBarInfoButton);
                infoButtonContainer.add(infoButton);
                
                infoButtonContainer.addEventListener('singletap', onInfoClick);
                infoButtonContainer.addEventListener('touchstart', onInfoPressDown);
                infoButtonContainer.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onInfoPressUp);
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
            
            Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function titleBarRotate (e) {
            	if (titleBar) { titleBar.width = Styles.titleBar.width; }
                if (settingsButtonContainer) { settingsButtonContainer.left = Styles.titleBarSettingsContainer.left; }
                if (homeButtonContainer) { homeButtonContainer.left = Styles.titleBarHomeContainer.left; }
            });
        };
        
        onHomeClick = function (e) {
            app.models.windowManager.openWindow(PortalWindow.key);
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

        onInfoPressUp = function (e) {
            infoButtonContainer.backgroundColor = Styles.titleBarInfoContainer.backgroundColor;
        };
        
        onInfoClick = function (e) {
            app.models.windowManager.openWindow(PortletWindow.key, {
                fname: 'info',
                externalModule: true,
                title: LocalDictionary.info,
                url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/info.html').nativePath
            });
        };

        onInfoPressDown = function (e) {
            var timeUp;

            infoButtonContainer.backgroundColor = Styles.titleBarInfoContainer.backgroundColorPressed;
            if (Device.isAndroid()) {
                //Because Android doesn't consistently register touchcancel or touchend, especially
                //when the window changes in the middle of a press
                timeUp = setTimeout(function(){
                    infoButtonContainer.backgroundColor = Styles.titleBarInfoContainer.backgroundColor;
                    clearTimeout(timeUp);
                }, 1000);
            }
        };

        onHomePressUp = function (e) {
            homeButtonContainer.backgroundColor = Styles.titleBarHomeContainer.backgroundColor;
        };
        
        onSettingsClick = function (e) {
            app.models.windowManager.openWindow(SettingsWindow.key);
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
    
    this.createDisposableSecondaryNavBar = function (opts) {
        var _secondaryNavBar, _backBtnOptions, _navBackButton, _titleLabel, secondaryNavRotate;
        // Possible parameters: backBtnText:String, btnFloatLeft:Bool, title:String, backButtonHandler:Function
        // A partial view used in some views to place a nav bar just below the titleBar
        _secondaryNavBar = {view: Titanium.UI.createView(Styles.secondaryNavBar)};
        if (!opts) { opts = {}; }
        if(opts.backButtonHandler) {
            _backBtnOptions = _.clone(Styles.secondaryNavBarButton);
            _backBtnOptions.title = opts.backBtnText || LocalDictionary.back;

            _navBackButton = Titanium.UI.createButton(_backBtnOptions);
            _navBackButton.addEventListener('click', opts.backButtonHandler);
            _secondaryNavBar.view.add(_navBackButton);
            if (opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.leftFloat;
            }
        }
        
        _titleLabel = Titanium.UI.createLabel(Styles.secondaryNavBarLabel);
        _titleLabel.text = opts.title ? opts.title : ' ';
        if (opts.btnFloatLeft) {
            _titleLabel.left = Styles.secondaryNavBarLabel.buttonLeftFloat;
        }
        _secondaryNavBar.view.add(_titleLabel);
        
        _secondaryNavBar.updateTitle = function (newTitle) {
            _titleLabel.text = newTitle;
        };
        
        _secondaryNavBar.destroy = function () {
            Ti.API.info("Destroy secondary nav bar");
            _navBackButton.removeEventListener('click', opts.backButtonHandler);
            Titanium.App.removeEventListener(app.events['DIMENSION_CHANGES'], secondaryNavRotate);
        };
        
        secondaryNavRotate = function (e) {
            var _visibility = _secondaryNavBar.view.visible;
            Ti.API.debug("visibility of secondaryNavBar: " + _visibility);
            _titleLabel.width = Styles.secondaryNavBarLabel.width;
            if (_navBackButton && !opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.left;
            }
            _secondaryNavBar.view.width = Styles.secondaryNavBar.width;
            _secondaryNavBar.view.visible = _visibility || true;
        };
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], secondaryNavRotate);
        
        return _secondaryNavBar;
    };
    
    this.createSecondaryNavBar = function (opts) {
        var _secondaryNavBar, _backBtnOptions, _navBackButton, _titleLabel;
        // Possible parameters: backBtnText:String, btnFloatLeft:Bool, title:String, backButtonHandler:Function
        // A partial view used in some views to place a nav bar just below the titleBar
        _secondaryNavBar = Titanium.UI.createView(Styles.secondaryNavBar);
        if (!opts) { opts = {}; }
        if(opts.backButtonHandler) {
            _backBtnOptions = _.clone(Styles.secondaryNavBarButton);
            _backBtnOptions.title = opts.backBtnText || LocalDictionary.back;

            _navBackButton = Titanium.UI.createButton(_backBtnOptions);
            _navBackButton.addEventListener('click', opts.backButtonHandler);
            _secondaryNavBar.add(_navBackButton);
            if (opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.leftFloat;
            }
        }
        
        _titleLabel = Titanium.UI.createLabel(Styles.secondaryNavBarLabel);
        _titleLabel.text = opts.title ? opts.title : ' ';
        if (opts.btnFloatLeft) {
            _titleLabel.left = Styles.secondaryNavBarLabel.buttonLeftFloat;
        }
        _secondaryNavBar.add(_titleLabel);
        _secondaryNavBar.updateTitle = function (newTitle) {
            _titleLabel.text = newTitle;
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            var _visibility = _secondaryNavBar.visible;
            Ti.API.debug("visibility of secondaryNavBar: " + _visibility);
            _titleLabel.width = Styles.secondaryNavBarLabel.width;
            if (_navBackButton && !opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.left;
            }
            _secondaryNavBar.width = Styles.secondaryNavBar.width;
            _secondaryNavBar.visible = _visibility || true;
        });
        
        return _secondaryNavBar;
    };
    
    this.createDisposableActivityIndicator = function () {
        var messageLabel, resetActivityIndicator,
            indicator = {view: Ti.UI.createView(Styles.globalActivityIndicator)},
            dialog = Ti.UI.createView(Styles.activityIndicatorDialog);

        indicator.view.add(dialog);
        
        messageLabel = Ti.UI.createLabel(Styles.activityIndicatorMessage);
        messageLabel.text = LocalDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.setLoadingMessage = function (m) {
            if (typeof m == 'string') {
                messageLabel.text = m;
            }
            else {
                Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.destroy = function () {
            Ti.API.debug("Destroy activity indicator");
            Ti.App.removeEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);
        };
        
        indicator.resetDimensions = function () {
            indicator.view.top = Styles.globalActivityIndicator.top;
            indicator.view.height = Styles.globalActivityIndicator.height;
            indicator.view.width = Styles.globalActivityIndicator.width;
            dialog.width = Styles.activityIndicatorDialog.width;
        };
        resetActivityIndicator = function (e) {
            indicator.resetDimensions();
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);
        
        return indicator;
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
            if (typeof m == 'string') {
                messageLabel.text = m;
            }
            else {
                Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.resetDimensions = function () {
            indicator.top = Styles.globalActivityIndicator.top;
            indicator.height = Styles.globalActivityIndicator.height;
            indicator.width = Styles.globalActivityIndicator.width;
            dialog.width = Styles.activityIndicatorDialog.width;
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            indicator.resetDimensions();
        });
        
        return indicator;
    };
    
    this.onOrientationChange = function (e) {
        Device.setCurrentOrientation(e.orientation);
        app.styles = new Styles(app);
        Ti.App.fireEvent(app.events['STYLESHEET_UPDATED']);
        Ti.App.fireEvent(app.events['DIMENSION_CHANGES'], {orientation: e.orientation});
    };
    
    init();
};