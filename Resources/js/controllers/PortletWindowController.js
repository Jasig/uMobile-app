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

var PortletWindowController = function (facade) {
    var win,
        self = {},
        app = facade,
        activityIndicator, titleBar, navBar, sharedWebView, webView,
        initialized, winListeners = [],
        pathToRoot = '../../',
        init, drawWindow, getQualifiedUrl,
        onBackBtnPress, onBackButtonUp, onIncludePortlet, onPortletLoad, onWindowOpen;

    init = function () {
        var navBarOptions;
        
        Ti.API.debug("init() in PortletWindowController");
        self.key = 'portlet';
        
        // Ti.App.addEventListener('includePortlet', onIncludePortlet);

                
        titleBar = new app.views.GenericTitleBar({
            windowKey: 'portlet',
            app: app,
            title: app.localDictionary.uMobile,
            settingsButton: false,
            homeButton: true
        });
        
        // initialize navigation back button for URLs outside of the portal
        navBarOptions = app.styles.secondaryNavBarButton;
        navBarOptions.title = app.localDictionary.back;
        
        navBackButton = Titanium.UI.createButton(navBarOptions);
        navBackButton.addEventListener('touchstart', onBackBtnPress);
        navBackButton.addEventListener('touchend', onBackBtnUp);
        navBackButton.addEventListener('click', function() { webView.goBack(); });
        // initialize navigation bar for URLs outside the portal
        navBar = new app.views.SecondaryNavBar(app,{
            backButton: navBackButton
        });
        navBar.top = 40;
        navBar.visible = false;
        
        activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
        activityIndicator.hide();
        
        sharedWebView = app.views.SharedWebView;
        
        self.initialized = true;
    };
    
    self.close = function () {
        win.close();
    };
    
    self.open = function (portlet) {
        Ti.App.addEventListener('SharedWebViewLoad', onPortletLoad);
        if (!win) {
            win = Titanium.UI.createWindow({
                backgroundColor: app.styles.backgroundColor,
                exitOnClose: false,
                modal: true,
                navBarHidden: true
            });
            win.open();
            
            for (var i = 0, iLength = winListeners.length; i<iLength; i++) {
                win.addEventListener(winListeners[i].event, winListeners[i].callback);
            }
            
            webView = sharedWebView.getWebView();
            
            win.add(titleBar);
            win.add(webView);
            win.add(navBar);
            win.add(activityIndicator);
            onIncludePortlet(portlet);
        }
        else {
            win.open();
            onIncludePortlet(portlet);
        }
    };
    
    self.addEventListener = function (event, callback) {
        if (win) {
            win.addEventListener(event, callback);
        }
        winListeners.push({event: event, callback: callback});
    };
    
    onIncludePortlet = function (portlet) {
        Ti.API.debug("onIncludePortlet() in PortletWindowController");
        
        if (portlet.url.indexOf('/') == 0 || portlet.url.indexOf(app.UPM.BASE_PORTAL_URL) >= 0) {
            Ti.API.debug("Portlet URL is local");
            sharedWebView.getLocalUrl(portlet.url);
            sharedWebView.externalModule = false;
        } else {
            Ti.API.debug("Portlet URL is external");
            sharedWebView.getExternalUrl(portlet.url);
            sharedWebView.externalModule = true;
        }
        titleBar.updateTitle(portlet.title);
    };
    
    onPortletLoad = function (e) {
         if (e.url.indexOf('/') == 0 || e.url.indexOf(app.UPM.BASE_PORTAL_URL) >= 0) {
            sharedWebView.externalModule = false;
            navBar.visible = false;
            // sharedWebView.setTop(app.styles.titleBar.height);
            app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        } else {
            sharedWebView.externalModule = true;
            navBar.visible = true;
            // sharedWebView.setTop(app.styles.titleBar.height + navBar.height);
        }
    };
    
    onBackBtnPress = function (e) {
        Ti.API.debug("onBackBtnPress() in PortletWindowController");
        navBackButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradientPress;
    };
    
    onBackBtnUp = function (e) {
        Ti.API.debug("onBackBtnUp() in PortletWindowController");
        navBackButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradient;
    };

    init();
    
    return self;
};