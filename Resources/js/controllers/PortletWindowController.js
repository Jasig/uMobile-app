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
        app = facade, sharedWebView,
        activityIndicator, titleBar, navBar, webView,
        initialized, winListeners = [],
        pathToRoot = '../../',
        init, drawWindow, getQualifiedUrl,
        onBackBtnPress, onBackButtonUp, onIncludePortlet, onPortletLoad, onPortletBeforeLoad, onWindowOpen;

    init = function () {
        var navBarOptions;
        
        sharedWebView = app.views.SharedWebView;
        
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
        
        self.initialized = true;
    };
    
    self.close = function () {
        win.close();
    };
    
    self.open = function (portlet) {
        if (!win) {
            win = Titanium.UI.createWindow({
                key: 'portlet',
                backgroundColor: app.styles.backgroundColor,
                exitOnClose: false,
                modal: true,
                navBarHidden: true
            });
            win.open();
            
            for (var i = 0, iLength = winListeners.length; i<iLength; i++) {
                win.addEventListener(winListeners[i].event, winListeners[i].callback);
            }
            
            if (Ti.Platform.osname === 'iphone') {
                webView = Titanium.UI.createWebView(app.styles.portletView); 
            }
            else {
                // webView = webView.getWebView();
            }
            
            win.add(titleBar);
            win.add(webView);
            win.add(navBar);
            win.add(activityIndicator);
            
            webView.addEventListener('load', onPortletLoad);
            webView.addEventListener('beforeload', onPortletBeforeLoad);
            onIncludePortlet(portlet);
        }
        else {
            win.top = Ti.Platform.osname === 'iphone' ? 20 : 0;
            win.open({
                modal: true
            });
            
            
            if (Ti.Platform.osname === 'iphone' && webView) {
                webView.removeEventListener('load', onPortletLoad);
                webView.removeEventListener('beforeload', onPortletBeforeLoad);
                win.remove(webView);
                webView = Titanium.UI.createWebView(app.styles.portletView);
                win.add(webView);
                webView.addEventListener('load', onPortletLoad);
                webView.addEventListener('beforeload', onPortletBeforeLoad);
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
        
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.show();
        
        if (portlet.url.indexOf('/') == 0) {
            Ti.API.debug("Portlet URL is local");
            // webView.getLocalUrl(portlet.url);
            webView.url = sharedWebView.getLocalUrl(portlet.url);
            webView.externalModule = false;
            webView.top = titleBar.height;
        } else {
            Ti.API.debug("Portlet URL is external");
            // webView.getExternalUrl(portlet.url);
            webView.url = portlet.url;
            webView.externalModule = true;
        }
        titleBar.updateTitle(portlet.title);
        
        Ti.API.info("is webView loading in onIncludePortlet()? " + webView.loading);
        Ti.API.info("is webView defined? " + webView);
    };
    
    onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + webView.url);
    };
    
    onPortletLoad = function (e) {
        Ti.API.debug("onPortletLoad() in PortletWindowController");
        if (webView.url.indexOf('/') == 0 || webView.url.indexOf(app.UPM.BASE_PORTAL_URL) >= 0) {
            Ti.App.fireEvent('SessionActivity', {context: LoginProxy.sessionTimeContexts.WEBVIEW});
            webView.externalModule = false;
            navBar.visible = false;
            webView.top = titleBar.height;
            webView.height = win.height - titleBar.height;
            // webView.setTop(app.styles.titleBar.height);
            app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        } 
        else {
            webView.externalModule = true;
            if (webView.canGoBack()) {
                navBar.visible = true;
                webView.top = titleBar.height + navBar.height;
                webView.height = win.height - titleBar.height - navBar.height;
            }
            // webView.setTop(app.styles.titleBar.height + navBar.height);
        }
        activityIndicator.hide();
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