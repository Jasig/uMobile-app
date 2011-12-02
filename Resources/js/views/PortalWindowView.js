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
exports.states = {
    INCLUDED        : "Included",
    INITIALIZED     : "Initialized",
    OPENED          : "Opened",
    HIDDEN          : "Hidden",
    CLOSED          : "Closed"
};

exports.indicatorStates = {
    NONE        : "None",
    GUEST       : "Guest",
    NO_PORTAL   : "NoPortal"
};

exports.events = {
    ANDROID_SEARCH_CLICKED  : 'HomeAndroidSearchButtonClicked',
    NOTIFICATION_CLICKED    : 'PortalDownNotificationClicked'
};
 
var _state, 
_layoutIndicator = exports.indicatorStates['NONE'],
_win, _contentLayer, _titleBar, _activityIndicator, _guestNotificationView, portalGridView;

exports.initialize = function () {
    portalGridView = require('/js/views/PortalGridView');
    exports.saveState(exports.states['INITIALIZED']);
};

exports.open = function (_modules, _isGuestLayout, _isPortalReachable, _isFirstOpen) {
    if (!_win) _win = Ti.UI.createWindow(app.styles.portalWindow);

    if (exports.retrieveState() === exports.states['INITIALIZED']) {
        _win.open();
        _drawUI(_isGuestLayout, _isPortalReachable);
        
        Ti.App.addEventListener(portalGridView.events['STATE_CHANGE'], _onPortalGridViewStateChange);
        Ti.App.addEventListener(app.events['DIMENSION_CHANGES'], _onDimensionChanges);
        Ti.App.addEventListener(app.models.portalProxy.events['PORTLETS_LOADED'], _onPortletsLoaded);
    }
    else {
        _win.show();
        _updateUI(_isGuestLayout, _isPortalReachable);
    }
    if (app.models.deviceProxy.isIOS()) _win.visible = true;
    
    // _win.addEventListener('android:search', _onAndroidSearch);

    // exports.showActivityIndicator(app.localDictionary.gettingPortlets);
    // portalGridView.updateGrid(_modules);
            
    exports.saveState(exports.states.OPENED);
};

exports.close = function () {
    _win.hide();
    // _win.removeEventListener('android:search', _onAndroidSearch);
    // if (app.models.deviceProxy.isIOS()) _win.visible = false;
    
    exports.saveState(exports.states.HIDDEN);
};

exports.rotateView = function (orientation) {
    if (_contentLayer) {
        _contentLayer.width = app.styles.portalContentLayer.width;
        _contentLayer.height = app.styles.portalContentLayer.height;            
    }
    if (_guestNotificationView) _guestNotificationView.top = _win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;
    if (portalGridView) portalGridView.rotate(orientation);
    if (_activityIndicator) _activityIndicator.rotate();
    if (_titleBar) _titleBar.rotate();
};

function _drawUI (_isGuestLayout, _isPortalReachable) {
    // This method should only be concerned with drawing the UI, not with any other logic. Leave that to the caller.
    if (_contentLayer) {
        _win.remove(_contentLayer);
    }
    _contentLayer = Ti.UI.createView(app.styles.portalContentLayer);
    _win.add(_contentLayer);
    _contentLayer.add(portalGridView.retrieveGridView());
    
    switch (_layoutIndicator) {
        case exports.indicatorStates['GUEST']:
            _addSpecialLayoutIndicator(true, true);
            break;
        case exports.indicatorStates['NO_USER']:
            _addSpecialLayoutIndicator(false, false);
            break;
        default:
            _removeSpecialLayoutIndicator(false, true);
    }

    _activityIndicator = require('/js/views/UI/ActivityIndicator');
    _win.add(_activityIndicator.view);

    _titleBar = require('/js/views/UI/TitleBar');
    _titleBar.addSettingsButton();
    _titleBar.addInfoButton();
    _titleBar.updateTitle(app.localDictionary.homeTitle);
    _win.add(_titleBar.view);
};

function _updateUI (_isGuestLayout, _isPortalReachable) {
    // this[_isGuestLayout || !_isPortalReachable ? '_addSpecialLayoutIndicator' : '_removeSpecialLayoutIndicator'](_isGuestLayout, _isPortalReachable);
    switch (_layoutIndicator) {
        case exports.indicatorStates['GUEST']:
            _addSpecialLayoutIndicator(true, true);
            break;
        case exports.indicatorStates['NO_USER']:
            _addSpecialLayoutIndicator(false, false);
            break;
        default:
            _removeSpecialLayoutIndicator(false, true);
    }
};

exports.saveState = function (newState) {
    _state = newState;
};

exports.retrieveState = function () {
    return _state;
};

exports.updateModules = function (_modules, _isPortalReachable, _isGuestLayout) {
    if (portalGridView) {
        portalGridView.updateGrid(_modules);
    }
    
    exports.hideActivityIndicator();
};

exports.showActivityIndicator = function (message) {
    // try {
        _activityIndicator.saveLoadingMessage(message || app.localDictionary.loading);
        _activityIndicator.view.show();
    // }
    // catch (e) {
        // Ti.API.error("Activity Indicator isn't defined.");
    // }
};

exports.hideActivityIndicator = function () {
    Ti.API.debug("hideActivityIndicator() in PortalWindowView");
    try {
        _activityIndicator.view.hide();
    }
    catch (e) {
        Ti.API.debug("activityIndicator not defined in hideActivityIndicator.");
    }
};

exports.alert = function (title, message) {
    Ti.API.debug("alert() in PortalWindowView");
    exports.hideActivityIndicator();
    if (app.models.deviceProxy.isIOS() || _win.visible) {
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

function _removeSpecialLayoutIndicator (_isGuestLayout, _isPortalReachable) {
    if (_guestNotificationView) {
        _guestNotificationView.removeEventListener('click', _specialLayoutIndicatorClick);
        _contentLayer.remove(_guestNotificationView);
    }
    
    portalGridView.resizeGrid(false);
};

function _specialLayoutIndicatorClick (e) {
    Ti.API.info('_specialLayoutIndicatorClick() in PortalWindowView');
    app.models.windowManager.openWindow(app.config.SETTINGS_KEY);
};

function _addSpecialLayoutIndicator (_isPortalReachable) {
    var guestNotificationLabel, _timeout;
    if (_guestNotificationView) {
        _contentLayer.add(_guestNotificationView);
    }
    else {
        if (_contentLayer) {
            _guestNotificationView = Ti.UI.createView(app.styles.homeGuestNote);
            _guestNotificationView.top = _win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;

            guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
            guestNotificationLabel.text = _isPortalReachable ? app.localDictionary.viewingGuestLayout : app.localDictionary.portalNotReachable;
            _guestNotificationView.add(guestNotificationLabel);

            _contentLayer.add(_guestNotificationView);

            _guestNotificationView.addEventListener('click', _specialLayoutIndicatorClick);

        }
        else {
            Ti.API.debug("No contentLayer exists to add layoutIndicator");
        }
    }
    
    portalGridView.resizeGrid(true);

};

function _onAndroidSearch (e) {
	Ti.App.fireEvent(exports.events['ANDROID_SEARCH_CLICKED'], {eventBody: e});
};

function _onDimensionChanges (e) {
    // We want to make sure the content layer (the view holding the icons) 
    // is the appropriate size when the device rotates
    // Let's update the Styles reference again for good measure
    if (_contentLayer) {
        _contentLayer.width = app.styles.portalContentLayer.width;
        _contentLayer.height = app.styles.portalContentLayer.height;            
    }
    
    if (_guestNotificationView) {
        _guestNotificationView.top = _win.height - app.styles.titleBar.height - app.styles.homeGuestNote.height;
    }
};

function _onPortletsLoaded (e) {
    switch (app.models.userProxy.retrieveLayoutUserName()) {
        case app.models.loginProxy.userTypes['GUEST']:
            _addSpecialLayoutIndicator(true);
            _layoutIndicator = exports.indicatorStates['GUEST'];
            break;
        case app.models.loginProxy.userTypes['NO_USER']:
            _addSpecialLayoutIndicator(false);
            _layoutIndicator = exports.indicatorStates['NO_PORTAL'];
            break;
        default:
            _removeSpecialLayoutIndicator(false, true);
            _layoutIndicator = exports.indicatorStates['NONE'];
    }
};

function _onPortalGridViewStateChange (e) {
    if (portalGridView && _activityIndicator && e.state && e.state === portalGridView.states['COMPLETE']) {
        exports.hideActivityIndicator(portalGridView.states['COMPLETE']);
    }
};

exports.initialize();

