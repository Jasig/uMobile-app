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
        initialized, winListeners = [], activePortlet,
        pathToRoot = '../../',
        init, drawWindow, getQualifiedUrl,
        onBackBtnPress, onBackButtonUp, includePortlet, onPortletLoad, onPortletBeforeLoad, onWindowOpen, onAppResume;

    init = function () {
        var navBarOptions;
        Ti.API.debug("init() in PortletWindowController");
        self.key = 'portlet';
        sharedWebView = app.views.SharedWebView;
        
        initialized = true;
    };
    
    self.close = function (options) {
        Ti.API.info("close() in PortletWindowController");
        if (win) {
            win.close();
        }
        else {
            Ti.API.error("Portlet Window isn't open");
        }
    };
    
    self.open = function (portlet) {
        if (portlet) {
            activePortlet = portlet;
        }
        else {
            Ti.API.error("No portlet was passed to includePortlet() in PortletWindowController");
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
            return;
        }
        
        win = Titanium.UI.createWindow({
            key: 'portlet',
            backgroundColor: app.styles.backgroundColor,
            exitOnClose: false,
            navBarHidden: true
        });

        if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
            webView = Titanium.UI.createWebView(app.styles.portletView);
        }
        else {
            webView = sharedWebView.getWebView();
        }
        
        titleBar = new app.views.GenericTitleBar({
            windowKey: 'portlet',
            app: app,
            title: app.localDictionary.uMobile,
            settingsButton: false,
            homeButton: true
        });
        
        navBarOptions = app.styles.secondaryBarButton;
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

        win.add(titleBar);
        win.add(navBar);
        win.add(webView);
        win.add(activityIndicator);
        
        webView.addEventListener('load', onPortletLoad);
        webView.addEventListener('beforeload', onPortletBeforeLoad);
        
        includePortlet(activePortlet);

        win.open();
    };
    
    includePortlet = function (portlet) {
        Ti.API.debug("includePortlet() in PortletWindowController");
        
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.show();
        
        if (portlet.url.indexOf('/') == 0) {
            Ti.API.debug("Portlet URL is local");
            if (app.models.windowManager.validateSessions()[app.models.sessionProxy.sessionTimeContexts.WEBVIEW].isActive) {
                webView.url = sharedWebView.getLocalUrl(portlet.url);
            }
            else {
                webView.url = app.models.loginProxy.getLocalLoginURL(portlet.url);
            }
            webView.externalModule = false;
            webView.top = titleBar.height;
        } else {
            Ti.API.debug("Portlet URL is external");
            // webView.getExternalUrl(portlet.url);
            webView.url = portlet.url;
            webView.externalModule = true;
        }
        titleBar.updateTitle(portlet.title);
    };
    
    onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + webView.url);
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.show();
    };
    
    onPortletLoad = function (e) {
        activityIndicator.hide();
        var portalIndex = e.url.indexOf(app.UPM.BASE_PORTAL_URL);
        Ti.API.debug("onPortletLoad() in PortletWindowController, index: " + portalIndex);
        if (portalIndex >= 0) {
            Ti.API.debug("Visiting a portal link");
            Ti.App.fireEvent('SessionActivity', {context: LoginProxy.sessionTimeContexts.WEBVIEW});
            webView.externalModule = false;
            navBar.visible = false;
            webView.top = titleBar.height;
            webView.height = win.height - titleBar.height;
            // webView.setTop(app.styles.titleBar.height);
            app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        } 
        else {
            Ti.API.debug("Visiting an external link");
            webView.externalModule = true;
            if (webView.canGoBack()) {
                navBar.visible = true;
                webView.top = titleBar.height + navBar.height;
                webView.height = win.height - titleBar.height - navBar.height;
            }
            else {
                Ti.API.info("Webview can't go back");
                webView.top = titleBar.height;
                webView.height = win.height - titleBar.height;
            }
            Ti.API.debug("WebView height is: " + webView.height);
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
    
    if (!initialized) {
        init();
    }
    
    return self;
};