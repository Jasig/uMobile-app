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
var app = { models: {} };
function onOrientationChange (e) {
    if (!app.models.deviceProxy.retrieveCurrentOrientation() || app.models.deviceProxy.retrieveCurrentOrientation() !== e.orientation) {
        app.models.deviceProxy.saveCurrentOrientation(e.orientation);
        // Ti.App.fireEvent(app.events['DIMENSION_CHANGES'], {orientation: e.orientation});
        app.styles = require('/js/style');
        app.models.windowManager.rotateWindow(e.orientation);
    }
    else {
        Ti.API.debug("Same orientation as before");
    }
}

//Libraries
Titanium.include('js/libs/underscore-min.js');
Titanium.include('js/gibberishAES.js');

app.events = {
    SESSION_ACTIVITY            : 'SessionActivity',
    NETWORK_ERROR               : 'networkConnectionError',
    SHOW_WINDOW                 : 'showWindow',
    SHOW_PORTLET                : 'showPortlet',
    //Layout-related events
    LAYOUT_CLEANUP              : 'layoutcleanup',
    DIMENSION_CHANGES           : 'dimensionchanges',
    ANDROID_ORIENTATION_CHANGE  : 'androidorientationchange',
    //Platform level events
    OPEN_EXTERNAL_URL           : 'OpenExternalURL'
};

app['config'] = require('/js/config'); //Global config object
app['localDictionary'] = require('/js/localization')[Titanium.App.Properties.getString('locale')]; // Dictionary contains all UI strings for the application for easy localization.
app.models['deviceProxy'] = require('/js/models/DeviceProxy');
app.models['resourceProxy'] = require('/js/models/ResourceProxy'); //Manages retrieval of local files between different OS's
app['styles'] = require('/js/style'); //Stylesheet-like dictionary used throughout application.
app.models['portalProxy'] = require('/js/models/PortalProxy'); //Manages the home screen view which displays a grid of icons representing portlets.
app.models['userProxy'] = require('/js/models/UserProxy');
app.models['sessionProxy'] = require('/js/models/SessionProxy'); //Manages 1 or more timers (depending on OS) to know when a session has expired on the server.
app.models['loginProxy'] = require('/js/models/LoginProxy'); //Works primarily with the settingsWindowController to manage the login process (Local or CAS) and broadcast success/fail events.
app.models['windowManager'] = require('/js/models/WindowManager'); //Manages opening/closing of windows, state of current window, as well as going back in the activity stack.
    
app.models.windowManager.openWindow(app.config.HOME_KEY);

if (app.models.deviceProxy.isIOS()) {
    Titanium.Gesture.addEventListener('orientationchange', onOrientationChange);
}
else {
    //Android doesn't register global orientation events, only in the context of a specific activity.
    //So we'll listen for it in each activity and broadcast a global event instead.
    Ti.App.addEventListener(app.events['ANDROID_ORIENTATION_CHANGE'], onOrientationChange);
}

Ti.App.addEventListener(app.events['OPEN_EXTERNAL_URL'], function (e) {
	if (e.url) {
		Ti.Platform.openURL(e.url);    		
	}
	else {
		Ti.API.error("No url was attached to the event: " + JSON.stringify(e));
	}
});