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
 * PortalWindowController.js reacts to events from PortalProxy.js 
 * and manages the main home grid view at PortalWindowView.js
 */


var firstTimeOpened=true, portalWindowView, notificationsProxy, app, deviceProxy, userProxy, config, localDictionary,
portalProxy = require('/js/models/PortalProxy'),
_newNetworkDowntime = true; //This var is to prevent multiple notifications of network downtime. Set to false as soon as downtime is encountered

exports.open = function () {
    // This will determine if a network session exists, and what 
    // window was open last time the app closed, and will manage the process
    // of establishing a session and opening the window.
    Ti.API.debug('exports.open() in PortalWindowController');
    portalWindowView = portalWindowView || require('/js/views/PortalWindowView');
    
    notificationsProxy = notificationsProxy || require('/js/models/NotificationsProxy');
    deviceProxy = deviceProxy || require('/js/models/DeviceProxy');
    userProxy = userProxy || require('/js/models/UserProxy');
    config = config || require('/js/config');
    localDictionary = localDictionary || require('/js/localization')[Ti.App.Properties.getString('locale')];
    app = app || require('/js/Constants');
    
    Ti.App.addEventListener(app.portalEvents['GETTING_PORTLETS'], onGettingPortlets);
    Ti.App.addEventListener(app.portalEvents['NETWORK_ERROR'], onPortalProxyNetworkError);
    if (firstTimeOpened) Ti.App.addEventListener(app.portalEvents['PORTLETS_LOADED'], _onPortletsLoaded);
    Ti.App.addEventListener(app.loginEvents['NETWORK_SESSION_SUCCESS'], onNetworkSessionSuccess);
    Ti.App.addEventListener(portalWindowView.events['NOTIFICATION_CLICKED'], onPortalDownNotificationClicked);
    Ti.App.addEventListener(app.loginEvents['NETWORK_SESSION_FAILURE'], onNetworkSessionFailure);
    Ti.App.addEventListener(portalWindowView.events['ANDROID_SEARCH_CLICKED'], onAndroidSearchClick);
    Ti.App.addEventListener(notificationsProxy.notificationEvents['UPDATED'], onNotificationsUpdated);
    
    //Open the portal window
    //portlets, isGuestLayout, isPortalReachable, isFirstOpen
    portalWindowView.open(portalProxy.getPortlets(), userProxy.isGuestUser(), portalProxy.getIsPortalReachable(), firstTimeOpened);
    if (config.NOTIFICATIONS_ENABLED) notificationsProxy.updateNotifications();
    firstTimeOpened = false;
};

exports.close = function () {
    Ti.API.debug('exports.close() in PortalWindowController');
    Ti.App.removeEventListener(app.portalEvents['GETTING_PORTLETS'], onGettingPortlets);
    Ti.App.removeEventListener(app.portalEvents['NETWORK_ERROR'], onPortalProxyNetworkError);
    
    Ti.App.removeEventListener(app.loginEvents['NETWORK_SESSION_SUCCESS'], onNetworkSessionSuccess);
    Ti.App.removeEventListener(portalWindowView.events['NOTIFICATION_CLICKED'], onPortalDownNotificationClicked);
    Ti.App.removeEventListener(app.loginEvents['NETWORK_SESSION_FAILURE'], onNetworkSessionFailure);
    Ti.App.removeEventListener(portalWindowView.events['ANDROID_SEARCH_CLICKED'], onAndroidSearchClick);
    Ti.App.removeEventListener(notificationsProxy.notificationEvents['UPDATED'], onNotificationsUpdated);
};

exports.rotate = function (orientation) {
    portalWindowView.rotateView(orientation);
};

function _onPortletsLoaded (e) {
    var _portlets = portalProxy.getPortlets();
    Ti.API.debug('_onPortletsLoaded() in PortalWindowController.');
    portalWindowView.updateLayout(portalProxy.getIsPortalReachable(), userProxy.isGuestUser(), _portlets);
    portalWindowView.hideActivityIndicator();
};

function onNotificationsUpdated (e) {
    var _notifications = notificationsProxy.retrieveNotifications();
    portalWindowView.updateNotificationsView(_notifications);
};

function onAndroidSearchClick (e) {
	var _searchPortlet = portalProxy.getPortletByFName('search');
	if (_searchPortlet) Ti.App.fireEvent(app.events['SHOW_PORTLET'], _searchPortlet);
};

function onNetworkSessionSuccess (e) {
    Ti.API.debug('onNetworkSessionSuccess() in PortalWindowController');
    _newNetworkDowntime = true;
};

function onNetworkSessionFailure (e) {
    Ti.API.debug('onNetworkSessionFailure() in PortalWindowController');
    if (!e.user || e.user == app.userTypes['NO_USER']) {
        if (deviceProxy.checkNetwork()) {
            if (_newNetworkDowntime) {
                portalWindowView.alert(localDictionary.error, localDictionary.failedToLoadPortlets);
                _newNetworkDowntime = false;
            }
            portalWindowView.updateLayout(portalProxy.getIsPortalReachable(), userProxy.isGuestUser(), portalProxy.getPortlets());
            portalWindowView.hideActivityIndicator();
        }
        else {
            Ti.App.fireEvent(app.events['NETWORK_ERROR']);
        }
        
    }
};

//PortalProxy events
function onGettingPortlets (e) {
    Ti.API.debug('onGettingPortlets() in PortalWindowController.');
    // Display a loading indicator until we can finish downloading the user
    // layout and creating the initial view
    portalWindowView.showActivityIndicator(localDictionary.gettingPortlets);
};

function onPortalProxyNetworkError (e) {
    Ti.API.debug('onPortalProxyNetworkError() in PortalWindowController. e: '+JSON.stringify(e));
    //This event responds to any type of error in retrieving portlets from the sever.
    if (_newNetworkDowntime) {
        portalWindowView.hideActivityIndicator();
        portalWindowView.alert(localDictionary.error, e.message);
        _newNetworkDonwtime = false;
    }
};

function onPortalDownNotificationClicked (e) {
    _newNetworkDowntime = true;
    Ti.App.fireEvent(app.loginEvents['ESTABLISH_NETWORK_SESSION']);
};