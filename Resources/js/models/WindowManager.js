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
applicationWindows = app.config.WINDOW_CONTROLLERS,
activityStack = [],
currentController,
homeKey = 'home',
portletKey = 'portlet';

Ti.App.addEventListener(app.events['SHOW_WINDOW'], onShowWindow);
Ti.App.addEventListener(app.events['SHOW_PORTLET'], onShowPortlet);
Ti.App.addEventListener(app.events['NETWORK_ERROR'], onNetworkConnectionError);

exports.openWindow = function (windowKey, portlet) {
    var callback;
    
    if (applicationWindows[windowKey] && exports.getCurrentWindow() !== windowKey) {
        //Make sure the requested window exists, and that it isn't the current window.
        var _newWindowEvent = {
            key: windowKey
        };
        if (portlet) {
            _newWindowEvent.portlet = portlet;
        }
        Ti.App.fireEvent(exports.events['WINDOW_OPENING'], _newWindowEvent);


        if (activityStack.length > 0) {
            Ti.API.debug("Passes condition: activityStack.length > 0");
            if ((app.models.deviceProxy.isIOS() && !applicationWindows[windowKey].isModal) || app.models.deviceProxy.isAndroid()) {
                //If the new window is a modal, it would look bad for the previous window to be black
                //when the modal is in opening/closing transitions
                currentController.close.close();
                currentController = null;
            }
        }
        
        if ((app.models.deviceProxy.isIOS() && !exports.getCurrentWindow().isModal) || app.models.deviceProxy.isAndroid()) {
            currentController = require('/js/controllers/'+applicationWindows[windowKey]);
            currentController.open(portlet ? portlet : null);
        }
        activityStack.push(windowKey);
        Ti.App.Properties.setString('lastWindow', windowKey);
        
        if (portlet) {
            Ti.App.Properties.setString('lastPortlet', JSON.stringify(portlet));
        }
        Ti.App.fireEvent(exports.events['WINDOW_OPENED'], {key: windowKey});
    }
    else {
        Ti.API.error("Error opening window.");
        Ti.API.error(" applicationWindows[windowKey]" + applicationWindows[windowKey]);
        Ti.API.error("windowKey= " + windowKey + " & exports.getCurrentWindow() = " + exports.getCurrentWindow());
    }
};

exports.goBack = function () {
    //Show the previous window, and add it to the top of the activity stack.
    //Use this method at your own risk, doesn't open portlets yet, and is quirky with opening home window.
    if (activityStack.length >= 2) {
        exports.openWindow(activityStack[activityStack.length - 2]);
    }
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
    Ti.API.info("getCurrentPortlet() in WindowManager: " + JSON.stringify(_currentPortlet));
    return _currentPortlet;
};



//Event Handlers
function onAndroidBack (e) {
    exports.goBack();
};

function onNetworkConnectionError (e) {
    exports.openWindow(portletKey, {
        title: app.localDictionary.noNetworkTitle,
        fname: 'nonetwork',
        url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/no-network-en_US.html').nativePath
    });
};

function onShowWindow (e) {
    exports.openWindow(e.newWindow);
};

function onShowPortlet (portlet) {
    exports.openWindow(portletKey, portlet);
};

