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
var WindowManager = function (facade) {
    var app=facade, init, hidePreviousWindow, _self = this, PortalWindow, PortletWindow, LocalDictionary, Device,
    applicationWindows = new Array(), activityStack = [], saveLastWindow,
        onAndroidBack, onShowWindow, onShowPortlet, onNetworkConnectionError, ensureOpenTimer;

    init = function () {
        LocalDictionary = app.localDictionary;
        Ti.App.addEventListener(ApplicationFacade.events['SHOW_WINDOW'], onShowWindow);
        Ti.App.addEventListener(ApplicationFacade.events['SHOW_PORTLET'], onShowPortlet);
        Ti.App.addEventListener(ApplicationFacade.events['NETWORK_ERROR'], onNetworkConnectionError);
    };
    
    this.addWindow = function (windowParams) {
        if (windowParams && windowParams.key) {
            applicationWindows[windowParams.key] = windowParams;
        }
        else {
            Ti.API.error("Incomplete windowParams were passed in to addWindow() in WindowManager" + JSON.stringify(windowParams));
        }
    };
    
    this.openWindow = function (windowKey, portlet) {
        if (!PortalWindow) {
            PortalWindow = app.controllers.portalWindowController;
        }
        if (!PortletWindow) {
            PortletWindow = app.controllers.portletWindowController;
        }
        if (!Device) {
            Device = app.models.deviceProxy;
        }
        
        var callback, 
            homeKey = PortalWindow.key,
            portletKey = PortletWindow.key;
        
        
        if (applicationWindows[windowKey]) {
            //Make sure the requested window exists, and that it isn't the current window.
            var _newWindowEvent = {
                key: windowKey
            };
            if (portlet) {
                _newWindowEvent.portlet = portlet;
            }
            Ti.App.fireEvent(WindowManager.events['WINDOW_OPENING'], _newWindowEvent);


            if (activityStack.length > 0) {
                Ti.API.debug("Passes condition: activityStack.length > 0");
                if ((Device.isIOS() && !applicationWindows[windowKey].isModal) || Device.isAndroid()) {
                    //If the new window is a modal, it would look bad for the previous window to be black
                    //when the modal is in opening/closing transitions
                    applicationWindows[_self.getCurrentWindow()].close();
                }
            }
            
            if ((Device.isIOS() && !_self.getCurrentWindow().isModal) || Device.isAndroid()) {
                applicationWindows[windowKey].open(portlet ? portlet : null );
            }
            activityStack.push(windowKey);
            Ti.App.Properties.setString('lastWindow', windowKey);
            
            if (portlet) {
                Ti.App.Properties.setString('lastPortlet', JSON.stringify(portlet));
            }
            Ti.App.fireEvent(WindowManager.events['WINDOW_OPENED'], {key: windowKey});
            if (_self.getPreviousWindow()) {
                Ti.App.fireEvent(ApplicationFacade.events['LAYOUT_CLEANUP'], {win: _self.getPreviousWindow()});
            }
        }
        else {
            Ti.API.error("Error opening window.");
            Ti.API.error(" applicationWindows[windowKey]" + applicationWindows[windowKey]);
            Ti.API.error("windowKey= " + windowKey + " & this.getCurrentWindow() = " + _self.getCurrentWindow());
        }
    };
    
    this.goBack = function () {
        //Show the previous window, and add it to the top of the activity stack.
        //Use this method at your own risk, doesn't open portlets yet, and is quirky with opening home window.
        if (activityStack.length >= 2) {
            _self.openWindow(activityStack[activityStack.length - 2]);
        }
    };
    
    this.getCurrentWindow = function (offset) {
    	// Returns key (string) of currently opened window, if possible
        return activityStack.length > 0 ? activityStack[activityStack.length - 1] : false;
    };
    
    this.getPreviousWindow = function () {
        return activityStack.length > 1 ? activityStack[activityStack.length - 2] : false;
    };
    
    this.getCurrentPortlet = function () {
        // var _currentPortlet = (activityStack.length > 0 && activityStack[activityStack.length -1].portlet) ? activityStack[activityStack.length - 1].portlet : false;
        var _currentPortlet = activityStack[activityStack.length -1].portlet;
        Ti.API.info("getCurrentPortlet() in WindowManager: " + JSON.stringify(_currentPortlet));
        return _currentPortlet;
    };
    
    this.openPreviousSessionWindow = function () {
        // If a session exists, open the previous window. If not, establish a session and then open previous (or home(default))
        // If the last window was a portlet, get the last portlet and parse/pass it as a parameter.
        // Otherwise, just open the last window
        
        /*var _lastWindow, _lastPortlet;
        _lastWindow = Ti.App.Properties.getString('lastWindow', PortalWindow.key);
        if (Ti.App.Properties.hasProperty('lastPortlet')) {
            _lastPortlet = Ti.App.Properties.getString('lastPortlet');
        }
        
        Ti.API.debug("_lastWindow= " + _lastWindow + " & _lastPortlet=" + _lastPortlet);
        
        if (app.models.sessionProxy.validateSessions()[LoginProxy.sessionTimeContexts.NETWORK]) {
            if (_lastWindow === PortletWindow.key && _lastPortlet) {
                Ti.App.debug("_lastWindow is portlet, and the _lastPortlet property was defined.");
                app.models.windowManager.openWindow(_lastWindow, JSON.parse(_lastPortlet));
            }
            else {
                Ti.API.debug("_lastWindow is not portlet, or the _lastPortlet property was not defined.");
                //We don't want to try opening the portlet window if it was the last window,
                //because we don't have a portlet to pass it. So just open the home window.
                app.models.windowManager.openWindow(_lastWindow === PortletWindow.key ? PortalWindow.key : _lastWindow);
            }
        }
        else {
            app.models.loginProxy.establishNetworkSession();
            _self.openWindow(PortalWindow.key);
        }*/
        
        //Let's forego this feature in version 1.0, too many cross-platform issues when trying to go-live.
        _self.openWindow(PortalWindow);
    };
    
    //Event Handlers
    onAndroidBack = function (e) {
        _self.goBack();
    };
    
    onNetworkConnectionError = function (e) {
        _self.openWindow(PortletWindow.key, {
            title: LocalDictionary.noNetworkTitle,
            fname: 'nonetwork',
            url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/no-network-en_US.html').nativePath
        });
    };
    
    onShowWindow = function (e) {
        Ti.API.debug("showWindow Event. New: " + e.newWindow + ", Old: " + e.oldWindow);
        _self.openWindow(e.newWindow);
    };
    
    onShowPortlet = function (portlet) {
        Ti.API.info("Showing portlet window " + portlet.title);
        _self.openWindow(PortletWindow.key, portlet);
    };
    
    init();
};
//Static object so events can be accessed without instance of WindowManager
WindowManager.events = {
    WINDOW_OPENING  : 'OpeningNewWindow',
    WINDOW_OPENED   : 'NewWindowOpened'
};