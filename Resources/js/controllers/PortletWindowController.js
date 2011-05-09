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
    
    self.close = function () {
        Ti.API.info("close() in PortletWindowController");
        win.close();
    };
    
    self.open = function (portlet) {
        if (portlet) {
            activePortlet = portlet;
        }
        
        if (!win) {
            win = Titanium.UI.createWindow({
                key: 'portlet',
                backgroundColor: app.styles.backgroundColor,
                exitOnClose: false,
                modal: true,
                navBarHidden: true
            });
            if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
                win.top = 20;
            }
            for (var i = 0, iLength = winListeners.length; i<iLength; i++) {
                win.addEventListener(winListeners[i].event, winListeners[i].callback);
            }
        }
    
        if (webView) {
            webView.removeEventListener('load', onPortletLoad);
            webView.removeEventListener('beforeload', onPortletBeforeLoad);
            win.remove(webView);
        }
        if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
            webView = Titanium.UI.createWebView(app.styles.portletView); 
        }
        else {
            webView = sharedWebView.getWebView();
        }
        
        win.add(webView);
        webView.addEventListener('load', onPortletLoad);
        webView.addEventListener('beforeload', onPortletBeforeLoad);
        
        
        if (!titleBar) {
            titleBar = new app.views.GenericTitleBar({
                windowKey: 'portlet',
                app: app,
                title: app.localDictionary.uMobile,
                settingsButton: false,
                homeButton: true
            });            
        }
        
        if (!navBar) {
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
        }

        if (!activityIndicator) {
            activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
            activityIndicator.hide();            
        }

        win.add(titleBar);
        win.add(webView);
        win.add(navBar);
        win.add(activityIndicator);
        
        webView.addEventListener('load', onPortletLoad);
        webView.addEventListener('beforeload', onPortletBeforeLoad);
        includePortlet(activePortlet);

        win.open();
    };
    
    self.addEventListener = function (event, callback) {
        if (win) {
            win.addEventListener(event, callback);
        }
        winListeners.push({event: event, callback: callback});
    };
    
    includePortlet = function (portlet) {
        Ti.API.debug("includePortlet() in PortletWindowController");
        
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
    };
    
    onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + webView.url);
    };
    
    onPortletLoad = function (e) {
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