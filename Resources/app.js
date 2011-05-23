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

var app, loadingWindow, windowManager, startup;
(function () {
    //Show a loading screen
    var messageLabel, indicator, dialog;
    loadingWindow = Titanium.UI.createWindow({
        fullscreen: true,
        backgroundImage: '/images/DefaultBlur.png',
        navBarHidden: true,
        orientationModes: [Ti.UI.PORTRAIT]
    });
    loadingWindow.open();
    
    indicator = Ti.UI.createView({
        top: 0,
	    width: Ti.Platform.displayCaps.platformWidth,
	    height: Ti.Platform.displayCaps.platformHeight,
	    color: '#fff',
	    zIndex: 1000
    });
    dialog = Ti.UI.createView({
        width: Math.round(Ti.Platform.displayCaps.platformWidth * 0.75),
	    height: 75,
	    borderRadius: 10,
	    borderWidth: 1,
	    borderColor: "#fff",
	    backgroundImage: 'img/bgActivityIndicatorDialog.png'
    });

    indicator.add(dialog);

    messageLabel = Ti.UI.createLabel({
        textAlign: 'center',
        fontSize: 18,
        color: "#fff",
        font: {
            fontWeight: 'bold'
        }
    });
    messageLabel.text = "Loading";
    dialog.add(messageLabel);

    loadingWindow.add(indicator);
    indicator.show();
})();


startup = function (e) {
    // library includes

    Titanium.include('js/ApplicationFacade.js');

    Titanium.include('js/config.js');
    Titanium.include('js/localization.js');
    Titanium.include('js/style.js');
    Titanium.include('js/UI.js');
    Titanium.include('js/gibberishAES.js');

    Titanium.include('js/models/DeviceProxy.js');
    Titanium.include('js/models/DirectoryProxy.js');
    Titanium.include('js/models/ResourceProxy.js');
    Titanium.include('js/models/LoginProxy.js');
    Titanium.include('js/models/MapProxy.js');
    Titanium.include('js/models/PortalProxy.js');
    Titanium.include('js/models/SessionProxy.js');
    Titanium.include('js/models/WindowManager.js');

    Titanium.include('js/views/MapDetailTop.js');
    Titanium.include('js/views/SharedWebView.js');
    Titanium.include('js/views/PersonDetailTableView.js');

    Titanium.include('js/controllers/DirectoryWindowController.js');
    Titanium.include('js/controllers/DirectoryDetailController.js');
    Titanium.include('js/controllers/MapDetailViewController.js');
    Titanium.include('js/controllers/MapWindowController.js');
    Titanium.include('js/controllers/PortalWindowController.js');
    Titanium.include('js/controllers/PortletWindowController.js');
    Titanium.include('js/controllers/SettingsWindowController.js');
    
    app = new ApplicationFacade();

    //Adds  members to the facade singleton, so they can be accessed.
    //Only necessary members are added here, secondary members are added from controllers when opened, for performance.
    //from any model, view, controller throughout the application
    //The facade is always called "app" in each controller, and depending on the type of member,
    //It can be accessed as app.memberName, app.views.viewName, app.models.modelName, or app.controllers.controllerName

    app.registerMember('localDictionary', localDictionary[Titanium.App.Properties.getString('locale')]); // Dictionary contains all UI strings for the application for easy localization.
    app.registerMember('UPM', new Config(app)); //Global config object
    app.registerModel('deviceProxy', new DeviceProxy(app));
    app.registerMember('UI', new UI(app));
    app.registerModel('resourceProxy', new ResourceProxy(app)); //Manages retrieval of local files between different OS's
    app.registerMember('styles', new Styles(app)); //Stylesheet-like dictionary used throughout application.
    app.registerMember('GibberishAES', GibberishAES); //Used to encrypt user credentials to store in sqlite db, and decrypt for automatic login.
    

    app.registerModel('windowManager', new WindowManager(app)); //Manages opening/closing of windows, state of current window, as well as going back in the activity stack.
    app.registerModel('mapProxy', new MapService(app)); //Manages retrieval, storage, and search of map points. Gets all data from map portlet on uPortal, but stores locally.
    app.registerModel('portalProxy', new PortalProxy(app)); //Manages the home screen view which displays a grid of icons representing portlets.
    app.registerModel('sessionProxy', new SessionProxy(app)); //Manages 1 or more timers (depending on OS) to know when a session has expired on the server.
    app.registerModel('loginProxy', new LoginProxy(app)); //Works primarily with the settingsWindowController to manage the login process (Local or CAS) and broadcast success/fail events.
    app.registerModel('directoryProxy', new DirectoryProxy(app)); //Manages real-time searching the uPortal service for directory entries, used primarily by DirectoryWindowController.    
    
    app.registerView('PersonDetailTableView', PersonDetailTableView); // Used in Directory Window controller to show search results.
    app.registerView('MapDetailTop', MapDetailTop);
    app.registerView('SharedWebView', new SharedWebView(app));

    //Window controllers
    app.registerController('DirectoryDetailController', DirectoryDetailController); // Subcontext in DirectoryWindowController to show 
    app.registerController('portalWindowController', new PortalWindowController(app));
    app.registerController('directoryWindowController', new DirectoryWindowController(app)); // Controls the native Directory portlet window
    app.registerController('mapWindowController', new MapWindowController(app)); // Controls the native Map portlet window
    app.registerController('MapDetailViewController', MapDetailViewController); // Subcontext in MapWindowController to show details of a location on the map
    app.registerController('portletWindowController', new PortletWindowController(app)); // Controls the webview for all portlets that aren't native (essentially an iframe for the portal)
    app.registerController('settingsWindowController', new SettingsWindowController(app)); // Controls the settings window (currently manages username/password)

    // Add window controllers to the window manager,
    // which manages the stack of window activities, and manages opening and closing
    // of windows so that controllers don't have to be concerned with details,
    // they just tell the window manager what to open, and it handles the rest.
    windowManager = app.models.windowManager;

    windowManager.addWindow(app.controllers.portalWindowController); //Home controller
    windowManager.addWindow(app.controllers.portletWindowController);
    windowManager.addWindow(app.controllers.directoryWindowController);
    windowManager.addWindow(app.controllers.mapWindowController);
    windowManager.addWindow(app.controllers.settingsWindowController);

    // This will determine if a network session exists, and what 
    // window was open last time the app closed, and will manage the process
    // of establishing a session and opening the window.
    app.models.deviceProxy.checkNetwork();
    app.models.loginProxy.establishNetworkSession();
    Ti.App.addEventListener('PortalProxyPortletsLoaded', function callback(e){
        Ti.App.removeEventListener('PortalProxyPortletsLoaded', callback);
        loadingWindow.close();
        app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
    });
    
    Titanium.Gesture.addEventListener('orientationchange', function callback(e){
        app.styles = new Styles(app);
        Ti.App.fireEvent('dimensionchanges', {orientation: e.orientation});
    });
};
startup();