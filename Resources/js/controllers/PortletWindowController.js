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
        app = facade, device,
        activityIndicator, titleBar, navBar, webView,
        initialized, winListeners = [], activePortlet,
        pathToRoot = '../../',
        init, drawWindow, getQualifiedURL, getLocalUrl,
        onBackBtnPress, onBackButtonUp, includePortlet, onPortletLoad, onPortletBeforeLoad, onWindowOpen, onAppResume;

    init = function () {
        Ti.API.debug("init() in PortletWindowController");
        self.key = 'portlet';
        
        device = app.models.deviceProxy;
        
        initialized = true;
    };
    
    self.close = function (options) {
        Ti.API.info("close() in PortletWindowController");
        if (win) {
            win.close();
        }
    };
    
    self.open = function (portlet) {
        var navBarOptions;
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
            // orientationModes: [Ti.UI.PORTRAIT]
        });
        win.open();

        if (device.isIOS() || !webView) {
            webView = Titanium.UI.createWebView(app.styles.portletView);
            webView.addEventListener('load', onPortletLoad);
            webView.addEventListener('beforeload', onPortletBeforeLoad);
            webView.hide();
        }
        
        titleBar = app.UI.createTitleBar({
            title: portlet.title,
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
        navBar = app.UI.createSecondaryNavBar({
            backButton: navBackButton
        });
        navBar.top = 40;
        navBar.visible = false;

        activityIndicator = app.UI.createActivityIndicator();
        activityIndicator.hide();

        win.add(titleBar);
        win.add(navBar);
        win.add(webView);
        win.add(activityIndicator);
        
        includePortlet(activePortlet);

        Titanium.App.addEventListener('dimensionchanges', function (e) {
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
        });
    };
    
    includePortlet = function (portlet) {
        Ti.API.debug("includePortlet() in PortletWindowController");
        
        activityIndicator.setLoadingMessage(app.localDictionary.loading);
        activityIndicator.show();
        
        webView.url = getQualifiedURL(portlet.url);
        
        titleBar.updateTitle(portlet.title);
    };
    
    getLocalUrl = function (url) {
        var localUrl, isValidSession;
        Ti.API.debug("getLocalUrl() in SharedWebView");
        /*
        This method determines if a session is valid for the webview, and will
        either modify the URL and load, or will load the URL as-is if session is active.
        This method only returns a URL, doesn't actually set the url property of the webview.
        */

        if (!app.models.deviceProxy.checkNetwork()) {
            return false;
        }

        //We only need to check the session if it's a link to the portal.
        isValidSession = app.models.loginProxy.isValidWebViewSession();
        if (!isValidSession) {
            var doCas, doLocal;
            doLocal = function () {
                Ti.API.debug("load > doLocal() in SharedWebView");
                Ti.API.debug("Resulting URL: " + app.models.loginProxy.getLocalLoginURL(url));
                localUrl = app.models.loginProxy.getLocalLoginURL(url);
            };

            doCas = function () {
                Ti.API.debug("load > doCas() in SharedWebView");
                Ti.API.debug("CAS URL is: " + app.models.loginProxy.getCASLoginURL(url));
                localUrl = app.models.loginProxy.getCASLoginURL(url);
            };

            switch (app.UPM.LOGIN_METHOD) {
                case app.models.loginProxy.loginMethods.CAS:
                    doCas();
                    break;
                case app.models.loginProxy.loginMethods.LOCAL_LOGIN:
                    doLocal();
                    break;
                default:
                    Ti.API.debug("Unrecognized login method in SharedWebView.load()");
            }
        }
        else {
            if (url.indexOf('/') === 0) {
                Ti.API.info("Index of / in URL is 0");
                var newUrl = app.UPM.BASE_PORTAL_URL + url;
                Ti.API.info(newUrl);
                localUrl = newUrl;
            }
            else {
                Ti.API.info("Index of / in URL is NOT 0");
                localUrl = url;
            }
        }
        return localUrl;
    };
    
    getQualifiedURL = function (url) {
        var _url;
        if (url.indexOf('/') == 0) {
            Ti.API.debug("Portlet URL is local");
            if (app.models.sessionProxy.validateSessions()[LoginProxy.sessionTimeContexts.WEBVIEW].isActive) {
                _url = getLocalUrl(url);
            }
            else {
                _url = app.models.loginProxy.getLocalLoginURL(url);
            }
            webView.externalModule = false;
            webView.top = titleBar.height;
        } else {
            Ti.API.debug("Portlet URL is external");
            // webView.getExternalUrl(portlet.url);
            _url = url;
            webView.externalModule = true;
        }
        
        return _url;
    };
    
    onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + webView.url);
        //We want to make sure we don't need to re-establish a session.
        if (webView.url !== getQualifiedURL(webView.url)) {
            webView.stopLoading();
            webView.url = getQualifiedURL(webView.url);
        }
        activityIndicator.setLoadingMessage(app.localDictionary.loading);
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
            // app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
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
        webView.show();
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