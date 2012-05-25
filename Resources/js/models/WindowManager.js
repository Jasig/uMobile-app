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
exports.events = {
    WINDOW_OPENING  : 'OpeningNewWindow',
    WINDOW_OPENED   : 'NewWindowOpened'
};


var hidePreviousWindow, 
config = require('/js/config'),
app = require('/js/Constants'),
localDictionary = require('/js/localization')[Titanium.App.Properties.getString('locale')],
deviceProxy = require('/js/models/DeviceProxy'),
applicationWindows = config.WINDOW_CONTROLLERS,
activityStack = [],
currentController,
homeController;

Ti.App.addEventListener(app.events['SHOW_WINDOW'], onShowWindow);
Ti.App.addEventListener(app.events['SHOW_PORTLET'], onShowPortlet);
Ti.App.addEventListener(app.events['NETWORK_ERROR'], onNetworkConnectionError);

exports.rotateWindow = function (orientation) {
    if (currentController && currentController.rotate) {
        currentController.rotate(orientation);
    }
};

function openWindow (windowKey, portlet, parameters) {
    var callback;
    
    //Make sure the requested window exists, and that it isn't the current window.
    if (!applicationWindows[windowKey] || exports.getCurrentWindow() === windowKey) return Ti.API.error("Error opening window. windowKey: "+windowKey);
        
    var _newWindowEvent = {
        key: windowKey
    };
    if (portlet) _newWindowEvent.portlet = portlet;
    Ti.App.fireEvent(exports.events['WINDOW_OPENING'], _newWindowEvent);

    if (activityStack.length > 0) {
        Ti.API.debug('Going to close current window');
        currentController.close();
    }
    
    //If it's the first window, we assume it's home, and so define the currentController AND homeController
    //Or if it's the home key, assign homeController to currentController
    //Otherwise, just require() the appropriate controller.
    if (activityStack.length === 0) {
        Ti.API.debug('activityStack.length === 0');
        currentController = homeController = require('/js/controllers/' + applicationWindows[windowKey]);
        currentController.open();
        Ti.API.debug('Opened home window.');
        activityStack.push(windowKey);
    }
    else if (windowKey === config.HOME_KEY){
        Ti.API.debug('windowKey === config.HOME_KEY');
        currentController = homeController;
        currentController.open();
        Ti.API.debug('opened home');
        activityStack.push(windowKey);
    }
    else {
        Ti.API.debug('Did not match home window criteria.');
        currentController = require('/js/controllers/' + applicationWindows[windowKey]);
        //Parameters may be passed in from another portlet broadcasting a message to open another portlet.
        currentController.open(portlet || parameters || null);
        activityStack.push(windowKey);
    }
    
    Ti.App.Properties.setString('lastWindow', windowKey);
    
    if (portlet) Ti.App.Properties.setString('lastPortlet', JSON.stringify(portlet));
    Ti.App.fireEvent(exports.events['WINDOW_OPENED'], {key: windowKey});
    return true;
};

exports.goBack = function () {
    //Show the previous window, and add it to the top of the activity stack.
    //Use this method at your own risk, doesn't open portlets yet, and is quirky with opening home window.
    if (activityStack.length >= 2) {
        openWindow(activityStack[activityStack.length - 2]);
    }
};

exports.setCurrentWindow = function (windowKey) {
    if (!applicationWindows[windowKey]) return Ti.API.error('windowKey not found in applicationWindows');
    activityStack.push(windowKey);
    return true;
};

exports.getCurrentWindow = function (offset) {
	// Returns key (string) of currently opened window, if possible
    return activityStack.length > 0 ? activityStack[activityStack.length - 1] : false;
};

exports.getPreviousWindow = function () {
    return activityStack.length > 1 ? activityStack[activityStack.length - 2] : false;
};

exports.getCurrentPortlet = function () {
    // var _currentPortlet = (activityStack.length > 0 && activityStack[activityStack.length -1].portlet) ? activityStack[activityStack.length - 1].portlet : false;
    var _currentPortlet = activityStack[activityStack.length -1].portlet;
    return _currentPortlet;
};



//Event Handlers
function onAndroidBack (e) {
    exports.goBack();
};

function onNetworkConnectionError (e) {
    openWindow(config.PORTLET_KEY, {
        title: localDictionary.noNetworkTitle,
        fname: 'nonetwork',
        url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/no-network-en_US.html').nativePath
    });
};

function onShowWindow (e) {
    if (e.parameters) {
        openWindow(e.newWindow, null, e.parameters);
    }
    else {
        openWindow(e.newWindow);
    }
};

function onShowPortlet (e) {
    if (e.parameters) {
        openWindow(config.PORTLET_KEY, e.portlet, e.parameters);
    }
    else {
        openWindow(config.PORTLET_KEY, e);
    }
    
};

