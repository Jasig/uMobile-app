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
                key: 'portlet',
                backgroundColor: app.styles.backgroundColor,
                exitOnClose: false,
                modal: true,
                navBarHidden: true
            });
            win.open({
                modal: true,
                modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_CURRENT_CONTEXT
            });
            
            for (var i = 0, iLength = winListeners.length; i<iLength; i++) {
                win.addEventListener(winListeners[i].event, winListeners[i].callback);
            }
            
            if (Ti.Platform.osname === 'iphone') {
                webView = Titanium.UI.createWebView(app.styles.portletView); 
            }
            else {
                webView = sharedWebView.getWebView();
            }

            
            win.add(titleBar);
            win.add(webView);
            win.add(navBar);
            win.add(activityIndicator);

            
            webView.addEventListener('load', sharedWebView.onWebViewLoad);
            onIncludePortlet(portlet);            
            Ti.API.info("is webView loading in self.open()? " + webView.loading);
            Ti.API.info("is webView defined? " + webView);
        }
        else {
            win.top = Ti.Platform.osname === 'iphone' ? 20 : 0;
            win.open({
                modal: true
            });
            
            
            if (Ti.Platform.osname === 'iphone' && webView) {
                win.remove(webView);
                webView = Titanium.UI.createWebView(app.styles.portletView);
                win.add(webView);
                webView.addEventListener('load', sharedWebView.onWebViewLoad);                
            }
            
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
        
        if (portlet.url.indexOf('/') == 0) {
            Ti.API.debug("Portlet URL is local");
            // sharedWebView.getLocalUrl(portlet.url);
            webView.url = app.UPM.BASE_PORTAL_URL + portlet.url;
            sharedWebView.externalModule = false;
            webView.top = titleBar.height;
        } else {
            Ti.API.debug("Portlet URL is external");
            // sharedWebView.getExternalUrl(portlet.url);
            webView.url = portlet.url;
            sharedWebView.externalModule = true;
            
        }
        titleBar.updateTitle(portlet.title);
        
        Ti.API.info("is webView loading in onIncludePortlet()? " + webView.loading);
        Ti.API.info("is webView defined? " + webView);
    };
    
    onPortletLoad = function (e) {
         if (e.url.indexOf('/') == 0 || e.url.indexOf(app.UPM.BASE_PORTAL_URL) >= 0) {
            sharedWebView.externalModule = false;
            navBar.visible = false;
            webView.top = titleBar.height;
            // sharedWebView.setTop(app.styles.titleBar.height);
            app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        } else {
            sharedWebView.externalModule = true;
            if (webView.canGoBack()) {
                navBar.visible = true;
                webView.top = titleBar.height + navBar.height;
            }
            
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