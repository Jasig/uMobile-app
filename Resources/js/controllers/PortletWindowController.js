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
        portletViewOpts,
        portletView,
        titleBar,
        initialized,
        pathToRoot = '../../';

    function init() {
        titleBar = new app.views.GenericTitleBar({
            windowKey: 'portlet',
            app: app,
            title: app.localDictionary.uMobile,
            settingsButton: true,
            homeButton: true
        });
        win.add(titleBar);   
        
        portletViewOpts = app.styles.portletView;
        portletView = Titanium.UI.createWebView(portletViewOpts);
        win.add(portletView);
        
        portletView.addEventListener('load', onPortletLoad);
        portletView.addEventListener('beforeload', onBeforePortletLoad);
        Ti.App.addEventListener('includePortlet', onIncludePortlet);
        
        win.add(activityIndicator);
        
        win.initialized = true;
    }
    
    function onIncludePortlet (portlet) {
        if (portletView) {
            Ti.API.debug('portletView exists, removing it.');
            portletView.stopLoading();
            portletView.hide();
        }
        portletView.url = app.UPM.BASE_PORTAL_URL + portlet.url;
        titleBar.updateTitle(portlet.title);
    }
    
    function onBeforePortletLoad (e) {
        Ti.API.debug("Loading portlet");
        activityIndicator.message = app.localDictionary.loading;
        activityIndicator.show();
    }
    
    function onPortletLoad(e) {
        Ti.API.debug("Porlet loaded");
        // activityIndicator.hide();
        portletView.show();
    }
    
    if(!win.initialized) {
        init();
    }
    
})();