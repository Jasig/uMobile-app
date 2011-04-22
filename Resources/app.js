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
Ti.include('js/ApplicationFacade.js');
Titanium.include('style.js');
Titanium.include('localization.js');
Titanium.include('js/gibberish-aes.js');
Titanium.include('js/models/MapProxy.js');
Titanium.include('js/models/DirectoryProxy.js');
Titanium.include('js/models/LoginProxy.js');
Titanium.include('js/models/PortalProxy.js');
Titanium.include('js/models/ResourceProxy.js');
Titanium.include('js/models/SessionTimerModel.js');
Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/GlobalActivityIndicator.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/PersonDetailTableView.js');
Titanium.include('js/views/SecondaryNavBar.js');
Titanium.include('js/views/SharedWebView.js');
Titanium.include('js/controllers/DirectoryDetailController.js');
Titanium.include('js/controllers/MapDetailViewController.js');

(function (){
    var windows = {},
        app,
        activityIndicator,
        init, setUpWindows;
    
    init = function () {
        app = new ApplicationFacade();
        
        
        app.registerModel('resourceProxy', new ResourceProxy()); //This one doesn't need the app passed in because it only needs to know the OS
        app.registerMember('styles', new Styles(app));
        app.registerMember('GibberishAES', GibberishAES);
        app.registerMember('UPM', new Config(app));
        
        app.registerModel('sessionTimerModel', new SessionTimerModel(app));
        app.registerModel('loginProxy', new LoginProxy(app));
        app.registerModel('mapService', new MapService(app));
        app.registerModel('directoryProxy', new DirectoryProxy(app));
        app.registerModel('portalProxy', new PortalProxy(app));

        app.registerView('MapDetailTop', MapDetailTop);
        app.registerView('GenericTitleBar', GenericTitleBar);
        app.registerView('PersonDetailTableView', PersonDetailTableView);
        app.registerView('GlobalActivityIndicator', new GlobalActivityIndicator(app));
        app.registerView('SecondaryNavBar', SecondaryNavBar);
        app.registerView('SharedWebView', new SharedWebView(app));
        
        app.registerMember('localDictionary', localDictionary[Titanium.App.Properties.getString('locale')]);
        
        activityIndicator = app.views.GlobalActivityIndicator;
        
        Ti.App.fireEvent("FacadeInitialized");

        // Titanium.UI.setBackgroundColor(app.styles.backgroundColor);

        //Let the user know that they need a network connection to use this app.
        if (!Ti.Network.online) {
            alert(app.localDictionary.networkConnectionRequired);
        }
        
        Ti.App.addEventListener('showWindow', function (e) {
            Ti.API.debug("showWindow Event. New: " + e.newWindow + ", Old: " + e.oldWindow);

            if(windows[e.oldWindow] != windows[e.newWindow]) {
                if (windows[e.newWindow].initialized) {
                    Ti.API.debug("new window is initialized");
                    windows[e.newWindow].show();
                }     
                else {
                    Ti.API.debug("new window is NOT initialized");
                    windows[e.newWindow].open();
                }
                windows[e.oldWindow].hide();
                Ti.API.info("Is old window visible? " + windows[e.oldWindow].visible);
                Ti.API.info("Is new window visible? " + windows[e.newWindow].visible);
            }
            else {
                Ti.API.debug("You're trying to navigate to the same window you're already in.");
            }
        });

        Ti.App.addEventListener('showPortlet', function (portlet) {

            Ti.API.info("Showing portlet window " + portlet.title);
            if (windows.portlet.initialized) {
                Titanium.App.fireEvent('includePortlet', portlet);
                windows.portlet.show();
            } 

            else {
                windows.portlet.addEventListener('open', function(e) {
                    Titanium.App.fireEvent('includePortlet', portlet);
                });
                windows.portlet.open();
            }
            windows.home.hide();
        });
        
        setUpWindows();
    };
    
    setUpWindows = function () {
        //
        // MAIN PORTAL VIEW
        //
        windows.home = Titanium.UI.createWindow({
            url: 'js/controllers/PortalWindowController.js',
            app: app,
            key: 'home',
            exitOnClose: true
        });

        windows.home.open();


        //
        // PORTLET VIEW
        //
        windows.portlet = Titanium.UI.createWindow({
            url: 'js/controllers/PortletWindowController.js',
            app: app,
            key: 'portlet'
        });

        //
        //Directory VIEW
        //
        windows.directory = Titanium.UI.createWindow({
            url: 'js/controllers/DirectoryWindowController.js',
            backgroundColor: app.styles.backgroundColor,
            title: app.localDictionary.directory,
            app: app,
            key: 'directory',
            id: 'directoryWindowController'
        });
        // windows.directory.open();

        //
        // MAP VIEW
        //
        windows.map = Titanium.UI.createWindow({
            url: 'js/controllers/MapWindowController.js',
            title: app.localDictionary.map,
            app: app,
            key: 'map'
        });
        // windows.map.open();
        //
        //  SETTINGS VIEW
        //
        windows.settings = Titanium.UI.createWindow({
            url: 'js/controllers/SettingsWindowController.js',
            app: app,
            key: 'settings'
        });
    };
    
    init();
    
})();

