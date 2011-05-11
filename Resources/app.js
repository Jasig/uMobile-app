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

// library includes
Titanium.include('config.js');
Titanium.include('js/ApplicationFacade.js');
Titanium.include('style.js');
Titanium.include('localization.js');
Titanium.include('js/gibberish-aes.js');

Titanium.include('js/models/MapProxy.js');
Titanium.include('js/models/DeviceProxy.js');
Titanium.include('js/models/DirectoryProxy.js');
Titanium.include('js/models/LoginProxy.js');
Titanium.include('js/models/PortalProxy.js');
Titanium.include('js/models/ResourceProxy.js');
Titanium.include('js/models/SessionProxy.js');
Titanium.include('js/models/WindowManager.js');

Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/GlobalActivityIndicator.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/PersonDetailTableView.js');
Titanium.include('js/views/SecondaryNavBar.js');
Titanium.include('js/views/SharedWebView.js');

Titanium.include('js/controllers/DirectoryDetailController.js');
Titanium.include('js/controllers/DirectoryWindowController.js');
Titanium.include('js/controllers/MapDetailViewController.js');
Titanium.include('js/controllers/MapWindowController.js');
Titanium.include('js/controllers/PortalWindowController.js');
Titanium.include('js/controllers/PortletWindowController.js');
Titanium.include('js/controllers/SettingsWindowController.js');

Titanium.include('js/controllers/commands/StartupCommand.js');

(function (){
    var app, windowManager, init, setUpWindows, setUpFacade, alertDialog;
    
    init = function () {
        Ti.API.debug("Hello. You're on an: " + Ti.Platform.osname);
        Ti.API.debug("Your resolution is: " + Ti.Platform.displayCaps.density);
        Ti.API.debug("With a DPI of: " + Ti.Platform.displayCaps.dpi);
        Ti.API.debug("Last Portlet is: " + Ti.App.Properties.getString('lastPortlet', 'none'));
        Ti.API.debug("Last Window is: " + Ti.App.Properties.getString('lastWindow', 'none'));
        
        Ti.App.addEventListener('resume', function () {
            alert("App resumed");
        });

        setUpFacade();
        windowManager = app.models.windowManager;
        
        //Let the user know that they need a network connection to use this app.
        if (!Ti.Network.online) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.error,
                message: app.localDictionary.networkConnectionRequired,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
            Ti.API.debug("Network is offline");
        }
        
        setUpWindows();
        StartupCommand(app);
    };
    
    setUpFacade = function () {
        //This method adds all members to the facade singleton, so they can be accessed 
        //from any model, view, controller throughout the application
        //The facade is always called "app" in each controller, and depending on the type of member,
        //It can be accessed as app.memberName, app.views.viewName, app.models.modelName, or app.controllers.controllerName
        app = new ApplicationFacade();
        
        app.registerMember('UPM', new Config(app)); //Global config object
        app.registerModel('resourceProxy', new ResourceProxy(app)); //Manages retrieval of local files between different OS's
        app.registerMember('styles', new Styles(app)); //Stylesheet-like dictionary used throughout application.
        app.registerMember('GibberishAES', GibberishAES); //Used to encrypt user credentials to store in sqlite db, and decrypt for automatic login.
        app.registerMember('localDictionary', localDictionary[Titanium.App.Properties.getString('locale')]); // Dictionary contains all UI strings for the application for easy localization.
        
        app.registerModel('windowManager', new WindowManager(app)); //Manages opening/closing of windows, state of current window, as well as going back in the activity stack.
        app.registerModel('sessionProxy', new SessionProxy(app)); //Manages 1 or more timers (depending on OS) to know when a session has expired on the server.
        app.registerModel('loginProxy', new LoginProxy(app)); //Works primarily with the settingsWindowController to manage the login process (Local or CAS) and broadcast success/fail events.
        app.registerModel('mapProxy', new MapService(app)); //Manages retrieval, storage, and search of map points. Gets all data from map portlet on uPortal, but stores locally.
        app.registerModel('directoryProxy', new DirectoryProxy(app)); //Manages real-time searching the uPortal service for directory entries, used primarily by DirectoryWindowController.
        app.registerModel('portalProxy', new PortalProxy(app)); //Manages the home screen view which displays a grid of icons representing portlets.
        app.registerModel('deviceProxy', new DeviceProxy(app));

        app.registerView('MapDetailTop', MapDetailTop); // Partial view used at the top of the map detail view
        app.registerView('GenericTitleBar', GenericTitleBar); // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
        app.registerView('PersonDetailTableView', PersonDetailTableView); // Used in Directory Window controller to show search results.
        app.registerView('GlobalActivityIndicator', new GlobalActivityIndicator(app)); //A view factory to create activity indicator instances in the controllers to be shown during time-intensive operations.
        app.registerView('SecondaryNavBar', SecondaryNavBar); // A partial view used in some controllers to place a nav bar just below the titleBar
        app.registerView('SharedWebView', new SharedWebView(app)); // A single webview shared between all web-based portlets, necessary for cookie-sharing in Android. (Titanium bug)

        // Second class controllers, but required for first class controllers to load.
        app.registerController('DirectoryDetailController', DirectoryDetailController); // Subcontext in DirectoryWindowController to show 
        app.registerController('MapDetailViewController', MapDetailViewController); // Subcontext in MapWindowController to show details of a location on the map
        
        //Window controllers
        app.registerController('portalWindowController', new PortalWindowController(app));
        app.registerController('directoryWindowController', new DirectoryWindowController(app)); // Controls the native Directory portlet window
        app.registerController('mapWindowController', new MapWindowController(app)); // Controls the native Map portlet window
        app.registerController('portletWindowController', new PortletWindowController(app)); // Controls the webview for all portlets that aren't native (essentially an iframe for the portal)
        app.registerController('settingsWindowController', new SettingsWindowController(app)); // Controls the settings window (currently manages username/password)
        
        Ti.App.fireEvent("FacadeInitialized");
    };
    
    setUpWindows = function () {
        // This method adds window controllers to the window manager,
        // which manages the stack of window activities, and manages opening and closing
        // of windows so that controllers don't have to be concerned with details,
        // they just tell the window manager what to open, and it handles the rest.
        
        windowManager.addWindow(app.controllers.portalWindowController); //Home controller
        windowManager.addWindow(app.controllers.portletWindowController);
        windowManager.addWindow(app.controllers.directoryWindowController);
        windowManager.addWindow(app.controllers.mapWindowController);
        windowManager.addWindow(app.controllers.settingsWindowController);
    };
    
    init();
    
})();

