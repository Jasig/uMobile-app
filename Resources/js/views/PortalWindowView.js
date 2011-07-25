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
    var app = facade, init, _self = this, Styles, UI, LocalDictionary, Device, WindowManager, Portal, SettingsWindow, PortalWindow, GridView, Login,
    portlets, _isGuestLayout = false, _isPortalReachable = true,  _state,
    win, contentLayer, gridView,
    titleBar, activityIndicator, guestNotificationView,
    createWindow, createContentLayer, createGridView, drawChrome, addSpecialLayoutIndicator,
    onPortalGridViewStateChange, onDimensionChanges, onAndroidSearch, onWindowFocus;
    
    init = function () {
        Styles = app.styles;
        UI = app.UI;
        Login = app.models.loginProxy;
        Portal = app.models.portalProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
        SettingsWindow = app.controllers.settingsWindowController;
        PortalWindow = app.controllers.portalWindowController;
        
        _self.states = {
            INITIALIZED: "Initialized",
            OPENED: "Opened",
            CLOSED: "Closed"
        };
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
        Ti.App.addEventListener('PortalGridViewStateChange', onPortalGridViewStateChange);
        Ti.App.addEventListener('dimensionchanges', onDimensionChanges);
        
        _self.setState(_self.states.INITIALIZED);
    };
    
    this.open = function (modules, options) {
        portlets = modules;
        
        if (!win || Device.isIOS()) {
            Ti.API.debug("Create and open the portal window");
            //We want to create a new window and redraw the whole UI each time on iOS
            win = Ti.UI.createWindow(Styles.portalWindow);
            win.open();
            if (Device.isAndroid()) {
            	try {
            		win.removeEventListener('focus', onWindowFocus);
            	}
            	catch (e) {
            		Ti.API.debug("Couldn't remove focus from PortalWindowView");
            	}
                // If the user gets to this window via the back button, we want to make sure we adaps
                // to any recent device orientation changes
                win.addEventListener('focus', onWindowFocus);
                win.addEventListener('android:search', onAndroidSearch);
            }
            
            if (!GridView) {
                Ti.include('js/views/PortalGridView.js');
                GridView = new PortalGridView(app);
            }

            contentLayer = Ti.UI.createView(Styles.portalContentLayer);
            win.add(contentLayer);
            
            _isGuestLayout = options.isGuestLayout || false;
            if (_isGuestLayout) {
                addSpecialLayoutIndicator();
            }
            
            if (!activityIndicator || Device.isIOS()) {
                activityIndicator = UI.createActivityIndicator();
            }
            else {
                try {
                    win.remove(activityIndicator);
                }
                catch (err) {
                    Ti.API.debug("No activityIndicator to remove from win in this.open() in PortalWindowView");
                }            
            }

            win.add(activityIndicator);

            contentLayer.add(GridView.getGridView({isGuestLayout: _isGuestLayout, winHeight: win.height }));
            _self.showActivityIndicator();
            GridView.updateGrid(portlets);

            titleBar = UI.createTitleBar({
        	    title: LocalDictionary.homeTitle,
        	    settingsButton: true,
        	    homeButton: false,
        	    infoButton: true
        	});
            win.add(titleBar);
        }
        else if (win && !win.visible) {
            Ti.API.debug("Just show the portal window");
            win.show();
        }
        
        
    	
        if (options.firstLoad) {
            _self.showActivityIndicator(LocalDictionary.gettingPortlets);
        }
        else {
            Ti.API.debug("This isn't the first time we're loading");
        }
        
        onDimensionChanges();
        _self.setState(_self.states.OPENED);
    };
    
    this.close = function () {
        if (win && Device.isIOS()) {
            win.close();
        }
        else if (win) {
        	//Infer that the OS is Android
            try {
                win.removeEventListener('android:search', onAndroidSearch);
            }
            catch (e) {
                Ti.API.error("Could not remove event listener 'focus' from home window");
            }
            win.hide();
        }
        _self.setState(_self.states.CLOSED);
    };
    
    this.setState = function (newState) {
        _state = newState;
    };
    
    this.getState = function () {
        return _state;
    };
    
    this.updateModules = function (modules, options) {
        Ti.API.debug("updateModules() in PortalWindowView. options.isPortalReachable: " + options.isPortalReachable);
        _isGuestLayout = options.isGuestLayout || false; //Defaults to false unless told otherwise
        _isPortalReachable = options.isPortalReachable !== undefined ? options.isPortalReachable : _isPortalReachable;

        portlets = modules;
        if (WindowManager.getCurrentWindow() === PortalWindow.key) {
            if (GridView) {
                GridView.updateGrid(portlets);
                // _self.showActivityIndicator(); //This should be quick enough that an indicator is not necessary
            }
        }
        Ti.API.debug("Is portal reachable in updateModules? " + _isPortalReachable);
        if (_isGuestLayout || !_isPortalReachable) {
            addSpecialLayoutIndicator();
        }
        else {
            Ti.API.debug("No need to add specialLayoutIndicator in PortalWindowView > updateModules(). _isGuestLayout: " + _isGuestLayout + " & _isPortalReachable: " + _isPortalReachable );
        }
        _self.hideActivityIndicator();
    };
    
    this.showActivityIndicator = function (message) {
        if (activityIndicator) {
            if (message) {
                activityIndicator.setLoadingMessage(message);
            }
            else {
                activityIndicator.setLoadingMessage(LocalDictionary.loading);
            }
            activityIndicator.show();
        }
        else {
            Ti.API.error("Activity Indicator isn't defined.");
        }
    };
    
    this.hideActivityIndicator = function () {
        Ti.API.debug("hideActivityIndicator() in PortalWindowView");
        if (activityIndicator) {
            activityIndicator.hide();
        }
        else {
            Ti.API.debug("activityIndicator not defined.");
        }
    };
    
    this.alert = function (title, message) {
        _self.hideActivityIndicator();
        Titanium.UI.createAlertDialog({ title: title,
            message: message, buttonNames: [LocalDictionary.OK]
            }).show();
    };
    
    addSpecialLayoutIndicator = function () {
        var guestNotificationLabel;
        
        guestNotificationView = Ti.UI.createView(Styles.homeGuestNote);
        guestNotificationView.top = win.height - Styles.titleBar.height - Styles.homeGuestNote.height;
        
        guestNotificationLabel = Ti.UI.createLabel(Styles.homeGuestNoteLabel);
        guestNotificationLabel.text = _isPortalReachable ? LocalDictionary.viewingGuestLayout : LocalDictionary.portalNotReachable;
        guestNotificationView.add(guestNotificationLabel);
        
        contentLayer.add(guestNotificationView);
        if (!_isPortalReachable) {
            guestNotificationView.addEventListener('click', function (e) {
                Ti.API.info("Clicked portal notification, establishing network session");
                Ti.App.fireEvent('PortalDownNotificationClicked');
            });            
        }
        else {
            guestNotificationView.addEventListener('click', function (e) {
                Ti.API.info("Clicked guest notification, opening settings");
                WindowManager.openWindow(SettingsWindow.key);
            });
        }
    };
    
    onAndroidSearch = function (e) {
    	Ti.App.fireEvent('HomeAndroidSearchButtonClicked', {eventBody: e});
    };
    
    onDimensionChanges = function (e) {
        Ti.API.debug('onDimensionChanges() in PortalWindowView');
        // We want to make sure the content layer (the view holding the icons) 
        // is the appropriate size when the device rotates
        // Let's update the Styles reference again for good measure
        Styles = app.styles;
        if (contentLayer) {
            contentLayer.width = Styles.portalContentLayer.width;
            contentLayer.height = Styles.portalContentLayer.height;
        }
        if (guestNotificationView) {
            guestNotificationView.top = win.height - Styles.titleBar.height - Styles.homeGuestNote.height;
        }
        else {
            Ti.API.debug("No guest notification view");
        }
    };
    
    onWindowFocus = function (e) {
    	if (WindowManager.getCurrentWindow() !== PortalWindow.key) {
    		WindowManager.openWindow(PortalWindow.key);
    	}
    };
    
    onPortalGridViewStateChange = function (e) {
        Ti.API.debug("onPortalGridViewStateChange() in PortalWindowView. State is: " + e.state);
        if (GridView && activityIndicator && e.state === GridView.states.COMPLETE && portlets.length > 0) {
            _self.hideActivityIndicator();
        }
    };
    
    
    
    init();
};