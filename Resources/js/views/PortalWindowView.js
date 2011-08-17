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

/**
 * PortalWindowView.js contains the main home view, controlled
 * by PortalWindowController.js
 */

/**
* @constructor
* @implements {IWindowView}
*/
var PortalWindowView = function (facade) {
    var app = facade, _self = this;

    //Pseudo-private variables 
    this._isGuestLayout = false;
    this._state;
    this._portlets;
    this._isPortalReachable = true;

    //Pseudo-private views
    this._win;
    this._contentLayer;
    this._titleBar;
    this._activityIndicator;
    this._guestNotificationView;

    this.init = function () {
        Ti.App.addEventListener(PortalGridView.events['STATE_CHANGE'], this._onPortalGridViewStateChange);
        Ti.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], this._onDimensionChanges);

        _self.setState(PortalWindowView.states['INITIALIZED']);
    };
    
    this.open = function (_modules, _isGuestLayout, _isPortalReachable, _isFirstOpen) {
        //portlets, _isGuestLayout, _isPortalReachable, _isFirstOpen
        this._portlets = _modules;
        
        // if (!_self._win || app.models.deviceProxy.isIOS()) {
            Ti.API.debug("Create and open the portal window");
            //We want to create a new window and redraw the whole UI each time on iOS
            _self._win = Ti.UI.createWindow(app.styles.portalWindow);
            _self._win.open();
            if (app.models.deviceProxy.isAndroid()) {
            	try {
            		_self._win.removeEventListener('focus', this._onWindowFocus);
            	}
            	catch (e) {
            		Ti.API.debug("Couldn't remove focus from PortalWindowView");
            	}
                // If the user gets to this window via the back button, we want to make sure we adaps
                // to any recent device orientation changes
                _self._win.addEventListener('focus', this._onWindowFocus);
                _self._win.addEventListener('android:search', this._onAndroidSearch);
            }

            _self._contentLayer = Ti.UI.createView(app.styles.portalContentLayer);
            _self._win.add(_self._contentLayer);
            
            this._isGuestLayout = _isGuestLayout || false;
            if (this._isGuestLayout) {
                Ti.API.debug("Adding guest layout indicator in open() in PortalWindowView. _isGuestLayout: " + _isGuestLayout + " & this._isGuestLayout: " + this._isGuestLayout);
                this._addSpecialLayoutIndicator();
            }
            else {
                this._removeSpecialLayoutIndicator();
            }
            
            if (!_self._activityIndicator || app.models.deviceProxy.isIOS()) {
                _self._activityIndicator = app.UI.createActivityIndicator();
            }
            else {
                try {
                    _self._win.remove(_self._activityIndicator);
                }
                catch (err) {
                    Ti.API.debug("No activityIndicator to remove from win in this.open() in PortalWindowView");
                }            
            }

            _self._win.add(_self._activityIndicator);

            _self._contentLayer.add(app.views.portalGridView.getGridView({isGuestLayout: this._isGuestLayout, winHeight: _self._win.height }));
            _self.showActivityIndicator();
            app.views.portalGridView.updateGrid(this._portlets);

            _self._titleBar = app.UI.createTitleBar({
        	    title: app.localDictionary.homeTitle,
        	    settingsButton: true,
        	    homeButton: false,
        	    infoButton: true
        	});
            _self._win.add(_self._titleBar);
        /*}
        else if (_self._win && !_self._win.visible) {
            Ti.API.debug("Just show the portal window");
            app.views.portalGridView.updateGrid();
            _self._win.show();
        }*/
        
        if (_isFirstOpen) {
            _self.showActivityIndicator(app.localDictionary.gettingPortlets);
        }
        else {
            Ti.API.debug("This isn't the first time we're loading");
        }
        
        this._onDimensionChanges();
        _self.setState(PortalWindowView.states.OPENED);
    };
    
    this.close = function () {
        // if (_self._win && app.models.deviceProxy.isIOS()) {
            _self._win.close();
        /*}
        else if (_self._win) {
        	//Infer that the OS is Android
            try {
                _self._win.removeEventListener('android:search', this._onAndroidSearch);
            }
            catch (e) {
                Ti.API.error("Could not remove event listener 'focus' from home window");
            }
            _self._win.hide();
        }*/
        _self.setState(PortalWindowView.states.CLOSED);
    };
    
    this.setState = function (newState) {
        this._state = newState;
    };
    
    this.getState = function () {
        return this._state;
    };
    
    this.updateModules = function (modules, options) {
        Ti.API.debug("updateModules() in PortalWindowView. _isPortalReachable: " + options.isPortalReachable);
        this._isGuestLayout = options.isGuestLayout || false; //Defaults to false unless told otherwise
        _self._isPortalReachable = options.isPortalReachable !== undefined ? options.isPortalReachable : _self._isPortalReachable;

        this._portlets = modules;
        if (app.models.windowManager.getCurrentWindow() === app.controllers.portalWindowController.key) {
            if (app.views.portalGridView) {
                app.views.portalGridView.updateGrid(_self._portlets);
                // _self.showActivityIndicator(); //This should be quick enough that an indicator is not necessary
            }
        }
        Ti.API.debug("Is portal reachable in updateModules? " + _self._isPortalReachable);
        if (this._isGuestLayout || !_self._isPortalReachable) {
            this._addSpecialLayoutIndicator();
        }
        else {
            Ti.API.debug("No need to add specialLayoutIndicator in PortalWindowView > updateModules(). this._isGuestLayout: " + this._isGuestLayout + " & _self._isPortalReachable: " + _self._isPortalReachable );
        }
        _self.hideActivityIndicator();
    };
    
    this.showActivityIndicator = function (message) {
        try {
            _self._activityIndicator.setLoadingMessage(message || app.localDictionary.loading);
            _self._activityIndicator.show();
        }
        catch (e) {
            Ti.API.error("Activity Indicator isn't defined.");
        }
    };
    
    this.hideActivityIndicator = function () {
        Ti.API.debug("hideActivityIndicator() in PortalWindowView");
        try {
            _self._activityIndicator.hide();
        }
        catch (e) {
            Ti.API.debug("activityIndicator not defined in hideActivityIndicator.");
        }
    };
    
    this.alert = function (title, message) {
        _self.hideActivityIndicator();
        Titanium.UI.createAlertDialog({ title: title,
            message: message, buttonNames: [app.localDictionary.OK]
            }).show();
    };
    this._removeSpecialLayoutIndicator = function () {
        try {
            _self._guestNotificationView.hide();
            _self._contentLayer.remove(_self._guestNotificationView);
            delete _self._guestNotificationView;
        }
        catch (e) {
            Ti.API.error("Couldn't remove guest layout indicator");
        }
    };
    
    this._addSpecialLayoutIndicator = function () {
        var guestNotificationLabel, _timeout;
        
        // We add the layout indicator after 250 seconds so that any soft 
        // keyboards have an opportunity to close before the height is calculated
        _timeout = setTimeout(function () {
            _self._guestNotificationView = Ti.UI.createView(app.styles.homeGuestNote);
            _self._guestNotificationView.top = _self._win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;

            guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
            guestNotificationLabel.text = _self._isPortalReachable ? app.localDictionary.viewingGuestLayout : app.localDictionary.portalNotReachable;
            _self._guestNotificationView.add(guestNotificationLabel);

            _self._contentLayer.add(_self._guestNotificationView);
            if (!_self._isPortalReachable) {
                _self._guestNotificationView.addEventListener('click', function (e) {
                    Ti.API.info("Clicked portal notification, establishing network session");
                    Ti.App.fireEvent(PortalWindowView.events['NOTIFICATION_CLICKED']);
                });            
            }
            else {
                _self._guestNotificationView.addEventListener('click', function (e) {
                    Ti.API.info("Clicked guest notification, opening settings");
                    app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
                });
            }
            clearTimeout(_timeout);
        }, 500);
    };
    
    this._onAndroidSearch = function (e) {
    	Ti.App.fireEvent(PortalWindowView.events['ANDROID_SEARCH_CLICKED'], {eventBody: e});
    };
    
    this._onDimensionChanges = function (e) {
        Ti.API.debug('onDimensionChanges() in PortalWindowView');
        // We want to make sure the content layer (the view holding the icons) 
        // is the appropriate size when the device rotates
        // Let's update the Styles reference again for good measure
        
        if (_self._contentLayer) {
            _self._contentLayer.width = app.styles.portalContentLayer.width;
            _self._contentLayer.height = app.styles.portalContentLayer.height;
        }
        if (_self._guestNotificationView) {
            _self._guestNotificationView.top = _self._win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;
        }
        else {
            Ti.API.debug("No guest notification view");
        }
    };
    
    this._onWindowFocus = function (e) {
        //Jeff Cross Commented this out, wasn't sure the purpose, but it was causing the window manager to reopen the home screen several times.
    	/*if (app.models.windowManager.getCurrentWindow() !== app.controllers.portalWindowController.key) {
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
    	}*/
    };
    
    this._onPortalGridViewStateChange = function (e) {
        Ti.API.debug("onPortalGridViewStateChange() in PortalWindowView. State is: " + e.state);
        if (app.views.portalGridView && _self._activityIndicator && e.state === PortalGridView.states['COMPLETE'] && _self._portlets.length > 0) {
            _self.hideActivityIndicator();
        }
    };
    
    this.init();
};

PortalWindowView.states = {
    INCLUDED    : "Included",
    INITIALIZED : "Initialized",
    OPENED      : "Opened",
    CLOSED      : "Closed"
};

PortalWindowView.events = {
    ANDROID_SEARCH_CLICKED  : 'HomeAndroidSearchButtonClicked',
    NOTIFICATION_CLICKED    : 'PortalDownNotificationClicked'
};