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

(function () {
    var win = Titanium.UI.currentWindow,
        app = win.app,
        activityIndicator = app.views.GlobalActivityIndicator,
        portletView, titleBar, navBar,
        initialized,
        pathToRoot = '../../',
        onBackBtnPress, onBackButtonUp;

    function init() {
        var portletViewOpts, navBarOptions;
        
        win.setBackgroundColor(app.styles.backgroundColor);
        titleBar = new app.views.GenericTitleBar({
            windowKey: 'portlet',
            app: app,
            title: app.localDictionary.uMobile,
            settingsButton: false,
            homeButton: true
        });
        win.add(titleBar);   
        
        portletView = app.views.SharedWebView;
        win.add(portletView);
        
        Ti.App.addEventListener('includePortlet', onIncludePortlet);
        Ti.App.addEventListener('SharedWebViewLoad', onPortletLoad);

        // initialize navigation back button for URLs outside of the portal
        navBarOptions = app.styles.secondaryNavBarButton;
        navBarOptions.title = app.localDictionary.back;
        navBackButton = Titanium.UI.createButton(navBarOptions);
        navBackButton.addEventListener('touchstart', onBackBtnPress);
        navBackButton.addEventListener('touchend', onBackBtnUp);

        // initialize navigation bar for URLs outside the portal
        navBar = new app.views.SecondaryNavBar(app,{
            backButton: navBackButton
        });
        navBar.top = 40;
        navBar.visible = false;
        win.add(navBar);
        navBackButton.addEventListener('click', function() { portletView.goBack(); });

        win.add(activityIndicator);
        
        win.initialized = true;
    }
    
    function onIncludePortlet (portlet) {
        if (portletView) {
            Ti.API.debug('portletView exists, removing it.');
            portletView.stopLoading();
            portletView.hide();
        }
        if (portlet.url.indexOf('/') == 0) {
            portletView.load(portlet.url);
            portletView.externalModule = false;
        } else {
            portletView.load(portlet.url);
            portletView.externalModule = true;
        }
        titleBar.updateTitle(portlet.title);
    }
    
    function onPortletLoad(e) {
        Ti.API.debug("Porlet loaded");
        activityIndicator.hide();
        
        var newUrl = e.url;
        if (portletView.externalModule || newUrl.indexOf(app.UPM.BASE_PORTAL_URL) >= 0) {
            navBar.visible = false;
            portletView.top = app.styles.titleBar.height;
            app.models.loginProxy.updateSessionTimeout(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        } else {
            navBar.visible = true;
            portletView.top = app.styles.titleBar.height + navBar.height;
        }

        portletView.show();
    }
    
    onBackBtnPress = function (e) {
        navBackButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradientPress;
    };
    
    onBackBtnUp = function (e) {
        navBackButton.backgroundGradient = app.styles.secondaryBarButton.backgroundGradient;
    };
    
    if(!win.initialized) {
        init();
    }
    
})();