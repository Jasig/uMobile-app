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
    this._state;
    this._layoutIndicator = PortalWindowView.indicatorStates['NONE'];

    //Pseudo-private views
    this._win;
    this._contentLayer;
    this._titleBar;
    this._activityIndicator;
    this._guestNotificationView;

    this.init = function () {
        _self.setState(PortalWindowView.states['INITIALIZED']);
    };
    
    this.open = function (_modules, _isGuestLayout, _isPortalReachable, _isFirstOpen) {
        if (typeof _self._win === "undefined") {
            _self._win = Ti.UI.createWindow(app.styles.portalWindow);
        }

        if (_self.getState() === PortalWindowView.states['INITIALIZED']) {
            _self._win.open();
            _self._drawUI(_isGuestLayout, _isPortalReachable);
            
            Ti.App.addEventListener(PortalGridView.events['STATE_CHANGE'], this._onPortalGridViewStateChange);
            Ti.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], this._onDimensionChanges);
            Ti.App.addEventListener(PortalProxy.events['PORTLETS_LOADED'], this._onPortletsLoaded);
        }
        else {
            _self._win.show();
            _self._updateUI(_isGuestLayout, _isPortalReachable);
        }
        if (app.models.deviceProxy.isIOS()) _self._win.visible = true;
        
        // _self._win.addEventListener('android:search', this._onAndroidSearch);

        // _self.showActivityIndicator(app.localDictionary.gettingPortlets);
        // app.views.portalGridView.updateGrid(_modules);
                
        // this._onDimensionChanges();
        _self.setState(PortalWindowView.states.OPENED);
    };
    
    this.close = function () {
        _self._win.hide();
        // _self._win.removeEventListener('android:search', this._onAndroidSearch);
        if (app.models.deviceProxy.isIOS()) _self._win.visible = false;
        
        _self.setState(PortalWindowView.states.HIDDEN);
    };
    
    this._drawUI = function (_isGuestLayout, _isPortalReachable) {
        Ti.API.debug("_drawUI() in PortalWindowView");
        // This method should only be concerned with drawing the UI, not with any other logic. Leave that to the caller.
        if (_self._contentLayer) {
            _self._win.remove(_self._contentLayer);
        }
        
        _self._contentLayer = Ti.UI.createView(app.styles.portalContentLayer);
        
        _self._win.add(_self._contentLayer);
        
        _self._contentLayer.add(app.views.portalGridView.getGridView());
        
        switch (_self._layoutIndicator) {
            case PortalWindowView.indicatorStates['GUEST']:
                _self._addSpecialLayoutIndicator(true, true);
                break;
            case PortalWindowView.indicatorStates['NO_USER']:
                _self._addSpecialLayoutIndicator(false, false);
                break;
            default:
                _self._removeSpecialLayoutIndicator(false, true);
        }

            
        _self._activityIndicator = app.UI.createDisposableActivityIndicator();
        _self._win.add(_self._activityIndicator.view);

        _self._titleBar = app.UI.createDisposableTitleBar({
    	    title: app.localDictionary.homeTitle,
    	    settingsButton: true,
    	    homeButton: false,
    	    infoButton: true
    	});
        _self._win.add(_self._titleBar.view);
    };
    
    this._updateUI = function (_isGuestLayout, _isPortalReachable) {
        Ti.API.debug("_updateUI() in PortalWindowView");
        // this[_isGuestLayout || !_isPortalReachable ? '_addSpecialLayoutIndicator' : '_removeSpecialLayoutIndicator'](_isGuestLayout, _isPortalReachable);
        switch (_self._layoutIndicator) {
            case PortalWindowView.indicatorStates['GUEST']:
                _self._addSpecialLayoutIndicator(true, true);
                break;
            case PortalWindowView.indicatorStates['NO_USER']:
                _self._addSpecialLayoutIndicator(false, false);
                break;
            default:
                _self._removeSpecialLayoutIndicator(false, true);
        }
    };
    
    this.setState = function (newState) {
        this._state = newState;
    };
    
    this.getState = function () {
        return this._state;
    };
    
    this.updateModules = function (_modules, _isPortalReachable, _isGuestLayout) {
        if (typeof app.views.portalGridView !== "undefined") {
            app.views.portalGridView.updateGrid(_modules);
        }
        
        _self.hideActivityIndicator();
    };
    
    this.showActivityIndicator = function (message) {
        // try {
            _self._activityIndicator.setLoadingMessage(message || app.localDictionary.loading);
            _self._activityIndicator.view.show();
        // }
        // catch (e) {
            // Ti.API.error("Activity Indicator isn't defined.");
        // }
    };
    
    this.hideActivityIndicator = function () {
        try {
            _self._activityIndicator.view.hide();
        }
        catch (e) {
            Ti.API.debug("activityIndicator not defined in hideActivityIndicator.");
        }
    };
    
    this.alert = function (title, message) {
        Ti.API.debug("alert() in PortalWindowView");
        _self.hideActivityIndicator();
        if (app.models.deviceProxy.isIOS() || _self._win.visible) {
            try {
                alert(message);
                /*Titanium.UI.createAlertDialog({ title: title,
                    message: message, buttonNames: [app.localDictionary.OK]
                    }).show();*/
            }
            catch (e) {
                Ti.API.error("Couldn't show alert:" + e);
            }            
        }
    };
    this._removeSpecialLayoutIndicator = function (_isGuestLayout, _isPortalReachable) {
        if (typeof _self._guestNotificationView !== "undefined") {
            _self._guestNotificationView.removeEventListener('click', _self._specialLayoutIndicatorClick);
            _self._contentLayer.remove(_self._guestNotificationView);
        }
        
        app.views.portalGridView.resizeGrid(false);
    };
    
    this._specialLayoutIndicatorClick = function (e) {
        app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
    };
    
    this._addSpecialLayoutIndicator = function (_isPortalReachable) {
        var guestNotificationLabel, _timeout;
        if (typeof _self._guestNotificationView !== "undefined") {
            Ti.API.debug("_self._guestNotificationView.show(). _layoutIndicator: " + _self._layoutIndicator);
            
            _self._contentLayer.add(_self._guestNotificationView);
        }
        else {
            Ti.API.debug("create _self._guestNotificationView. _layoutIndicator: " + _self._layoutIndicator);
            if (typeof _self._contentLayer !== "undefined") {
                _self._guestNotificationView = Ti.UI.createView(app.styles.homeGuestNote);
                _self._guestNotificationView.top = _self._win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;

                guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
                guestNotificationLabel.text = _isPortalReachable ? app.localDictionary.viewingGuestLayout : app.localDictionary.portalNotReachable;
                _self._guestNotificationView.add(guestNotificationLabel);

                _self._contentLayer.add(_self._guestNotificationView);

                _self._guestNotificationView.addEventListener('click', _self._specialLayoutIndicatorClick);

            }
            else {
                Ti.API.debug("No contentLayer exists to add layoutIndicator");
            }
        }
        
        app.views.portalGridView.resizeGrid(true);

    };
    
    this._onAndroidSearch = function (e) {
    	Ti.App.fireEvent(PortalWindowView.events['ANDROID_SEARCH_CLICKED'], {eventBody: e});
    };
    
    this._onDimensionChanges = function (e) {
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
    };
    
    this._onPortletsLoaded = function (e) {
        Ti.API.debug("_onPortletsLoaded() in PortalWindowView. State:" + e.state || 'none');
        switch (app.models.userProxy.getLayoutUserName()) {
            case LoginProxy.userTypes['GUEST']:
                _self._addSpecialLayoutIndicator(true);
                _self._layoutIndicator = PortalWindowView.indicatorStates['GUEST'];
                break;
            case LoginProxy.userTypes['NO_USER']:
                _self._addSpecialLayoutIndicator(false);
                _self._layoutIndicator = PortalWindowView.indicatorStates['NO_PORTAL'];
                break;
            default:
                _self._removeSpecialLayoutIndicator(false, true);
                _self._layoutIndicator = PortalWindowView.indicatorStates['NONE'];
        }
    };
    
    this._onPortalGridViewStateChange = function (e) {
        if (app.views.portalGridView && _self._activityIndicator && e.state === PortalGridView.states['COMPLETE']) {
            _self.hideActivityIndicator();
        }
    };
    
    this.init();
};

PortalWindowView.states = {
    INCLUDED        : "Included",
    INITIALIZED     : "Initialized",
    OPENED          : "Opened",
    HIDDEN          : "Hidden",
    CLOSED          : "Closed"
};

PortalWindowView.indicatorStates = {
    NONE        : "None",
    GUEST       : "Guest",
    NO_PORTAL   : "NoPortal"
};

PortalWindowView.events = {
    ANDROID_SEARCH_CLICKED  : 'HomeAndroidSearchButtonClicked',
    NOTIFICATION_CLICKED    : 'PortalDownNotificationClicked'
};