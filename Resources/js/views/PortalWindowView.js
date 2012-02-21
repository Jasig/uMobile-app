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
 
var _state, styles, deviceProxy, localDictionary, app, config,
_layoutState = exports.indicatorStates['NONE'],
win, contentLayer, titleBar, activityIndicator, notificationsView, isNotificationsViewInitialized, portletCollectionView;

exports.open = function (_modules, _isGuestLayout, _isPortalReachable, _isFirstOpen) {
    Ti.API.debug('exports.open() in PortalWindowView');
    app = app || require('/js/Constants');
    config = config || require('/js/config');
    styles = styles ? styles.updateStyles() : require('/js/style');
    deviceProxy = deviceProxy || require('/js/models/DeviceProxy');
    localDictionary = localDictionary || require('/js/localization')[Ti.App.Properties.getString('locale')];
    if (config.LAYOUT_VIEW === app.layoutTypes['GRID_LAYOUT']) portletCollectionView = require('/js/views/PortalGridView');
    if (config.LAYOUT_VIEW === app.layoutTypes['FOLDER_LAYOUT']) portletCollectionView = require('/js/views/PortalFolderView');
    portletCollectionView.open();
    notificationsView = require('/js/views/PortalNotificationsView');
    
    if (!win) win = Ti.UI.createWindow(styles.portalWindow);
    win[getState() === exports.states['INITIALIZED'] ? 'open' : 'show']();
    if (deviceProxy.isIOS()) win.visible = true;
    if (deviceProxy.isAndroid()) {
        win.addEventListener('android:search', _onAndroidSearch);
        win.addEventListener('focus', function (e) {
            Ti.API.debug('home window has gained focus.');
            require('/js/models/WindowManager').setCurrentWindow(config.HOME_KEY);
        });
    }
    
    //Let's create the UI elements.
    _drawUI(_isGuestLayout, _isPortalReachable);
    
    // The layout should never be ready at this point, let's wait until we receive an event
    // telling us that it's ready.
    // portletCollectionView.updateModules(_modules);
    
    //This view is done opening, so let's update the state
    setState(exports.states.OPENED);
};

exports.close = function () {
    Ti.API.debug('exports.close() in PortalWindowView');
    win.hide();
    win.removeEventListener('android:search', _onAndroidSearch);
    setState(exports.states.HIDDEN);
    portletCollectionView.close();
};

exports.rotateView = function (orientation) {
    portletCollectionView && portletCollectionView.rotate(orientation, notificationsView.currentState() === notificationsView.states['HIDDEN'] ? false : true);
};

function _drawUI (_isGuestLayout, _isPortalReachable) {
    Ti.API.debug('_drawUI() in PortalWindowView. _isGuestLayout: '+_isGuestLayout+', _isPortalReachable: '+_isPortalReachable);
    // This method should only be concerned with drawing the UI, not with any other logic. Leave that to the caller.
    
    if (getState() !== exports.states['INITIALIZED']) {
        exports.updateLayout(_isPortalReachable, _isGuestLayout);
        exports.rotateView();
        return;
    }
    
    Ti.App.addEventListener(portletCollectionView.events['STATE_CHANGE'], _onPortalGridViewStateChange);
    Ti.App.addEventListener(notificationsView.events['EMERGENCY_NOTIFICATION'], _onEmergencyNotification);
    
    if (contentLayer) win.remove(contentLayer);
    contentLayer = Ti.UI.createView(styles.portalContentLayer);
    win.add(contentLayer);
    contentLayer.add(portletCollectionView.getView());

    _controlNotificationsBar();

    activityIndicator = require('/js/views/UI/ActivityIndicator').createActivityIndicator();
    win.add(activityIndicator.view);

    titleBar = require('/js/views/UI/TitleBar').createTitleBar();
    win.add(titleBar.view);
    titleBar.addSettingsButton();
    titleBar.addInfoButton();
    titleBar.updateTitle(localDictionary.homeTitle);
};

function setState (newState) {
    Ti.API.debug('setState() in PortalWindowView');
    _state = newState;
}

function getState () {
    Ti.API.debug('getState() in PortalWindowView');
    return _state;
}

exports.updateLayout = function (_isPortalReachable, _isGuestLayout, _modules) {
    Ti.API.debug('exports.updateLayout() in PortalWindowView');
    Ti.API.debug('_isPortalReachable: '+_isPortalReachable+', _isGuestLayout: '+_isGuestLayout);
    if (portletCollectionView && _modules) portletCollectionView.updateModules(_modules);
    _layoutState = 
        _isPortalReachable === false ? exports.indicatorStates['NO_PORTAL'] : 
        _isGuestLayout ? exports.indicatorStates['GUEST'] : 
        exports.indicatorStates['NONE'];
    if (_isGuestLayout) _layoutState = exports.indicatorStates['GUEST'];
    
    _controlNotificationsBar(_isGuestLayout, _isPortalReachable);
    exports.hideActivityIndicator();
};

exports.showActivityIndicator = function (message) {
    Ti.API.debug('exports.showActivityIndicator() in PortalWindowView');
    activityIndicator.setLoadingMessage(message || localDictionary.loading);
    activityIndicator.view.show();
};

exports.hideActivityIndicator = function () {
    Ti.API.debug('exports.hideActivityIndicator() in PortalWindowView');
    if (activityIndicator) activityIndicator.view.hide();
};

exports.alert = function (title, message) {
    Ti.API.debug('exports.alert() in PortalWindowView');
    exports.hideActivityIndicator();
    // if (deviceProxy.isIOS() || win.visible) {
        try {
            // alert(message);
            Titanium.UI.createAlertDialog({ title: title,
                message: message, buttonNames: [localDictionary.OK]
                }).show();
        }
        catch (e) {
            Ti.API.error("Couldn't show alert:" + e);
        }            
    // }
};

exports.updateNotificationsView = function (notifications) {
    Ti.API.debug('exports.updateNotificationsView() in PortalWindowView');
    //Update the layout indicator with number of notifications, or emergency notification.
    if (isNotificationsViewInitialized) notificationsView.showNotificationSummary(notifications);
};

function _onEmergencyNotification (e) {
    Ti.API.debug('_onEmergencyNotification() in PortalWindowView');
    exports.alert(localDictionary.emergencyNotification, e.message);
}

function _specialLayoutIndicatorClick (e) {
    Ti.API.debug('_specialLayoutIndicatorClick() in PortalWindowView');
    var _emergencyNote;
    switch (notificationsView.currentState()) {
        case notificationsView.states['GUEST_USER']:
            Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.SETTINGS_KEY});
            break;
        case notificationsView.states['PORTAL_UNREACHABLE']:
            Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.SETTINGS_KEY});
            break;
        case notificationsView.states['NOTIFICATIONS_SUMMARY']:
            // notificationsView.showNotificationsList();
            if (notificationsView.emergencyNote) {
                _emergencyNote = notificationsView.emergencyNote(); 
                exports.alert(localDictionary.emergencyNotification, _emergencyNote.message);
            }
            break;
        case notificationsView.states['NOTIFICATIONS_EXPANDED']:
            notificationsView.hideNotificationsList();
            break;
        default:
            Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.SETTINGS_KEY});
    }
};

function _controlNotificationsBar () {
    Ti.API.debug('_controlNotificationsBar() in PortalWindowView. _layoutState: '+_layoutState);
    if (_layoutState === exports.indicatorStates['GUEST'] ||
        _layoutState === exports.indicatorStates['NO_PORTAL'] ||
        config.NOTIFICATIONS_ENABLED) {
        _addNotificationsBar();
    }
    else {
        _removeNotificationsBar();
    }
}

function _removeNotificationsBar () {
    Ti.API.debug('_removeNotificationsBar() in PortalWindowView');
    notificationsView.hide();
    contentLayer.bottom = styles.portalContentLayer.bottom;
};

function _addNotificationsBar () {
    Ti.API.debug('_addNotificationsBar() in PortalWindowView');
    var guestNotificationLabel, _timeout, _method;
    if (!isNotificationsViewInitialized) {
        notificationsView.createView();
        notificationsView.view().addEventListener('click', _specialLayoutIndicatorClick);
        
        isNotificationsViewInitialized = true;
        
        win.add(notificationsView.view());
    }
    contentLayer.bottom = styles.portalContentLayer.bottomWithNote;
    notificationsView.show();
    
    _method = _layoutState === exports.indicatorStates['NO_PORTAL'] ? 'showPortalUnreachableNote' : _layoutState === exports.indicatorStates['GUEST'] ? 'showGuestNote' : 'showNotificationSummary';
    notificationsView[_method]();
};

function _onAndroidSearch (e) {
	Ti.App.fireEvent(exports.events['ANDROID_SEARCH_CLICKED'], {eventBody: e});
};

function _onDimensionChanges (e) {
    Ti.API.debug('_onDimensionChanges() in PortalWindowView');
    // We want to make sure the content layer (the view holding the icons) 
    // is the appropriate size when the device rotates
    // Let's update the Styles reference again for good measure
    if (contentLayer) {
        contentLayer.width = styles.portalContentLayer.width;
        contentLayer.height = styles.portalContentLayer.height;
    }
    
    if (isNotificationsViewInitialized) {
        notificationsView.view().top = styles.homeGuestNote.top;
    }
};



function _onPortalGridViewStateChange (e) {
    if (portletCollectionView && activityIndicator && e.state && e.state === portletCollectionView.states['COMPLETE']) {
        exports.hideActivityIndicator(portletCollectionView.states['COMPLETE']);
    }
};

setState(exports.states['INITIALIZED']);