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

Titanium.include("lib.js");
Titanium.include('skin.js');

var win, portletView;


win = Titanium.UI.currentWindow;

var portletBar = Titanium.UI.createView({
    backgroundColor: UPM.TITLEBAR_BACKGROUND_COLOR,
    top:0,
    height: UPM.TITLEBAR_HEIGHT
});
var portletTitle = Titanium.UI.createLabel({
    textAlign: "center",
    text: "uMobile",
    color: UPM.TITLEBAR_TEXT_COLOR,
    font: { fontWeight: "bold" }
});
portletBar.add(portletTitle);
var homeButton = Titanium.UI.createImageView({
    image: "icons/tab-home.png",
    width: 18,
    height: 18,
    left: 10
});
portletBar.add(homeButton);
win.add(portletBar);
win.initialized = true;

homeButton.addEventListener('singletap', function() {
    Ti.App.fireEvent(
        'showWindow', 
        {
            oldWindow: 'portlet',
            newWindow: 'home'
        }
    );
});

Ti.App.addEventListener('includePortlet', function(portlet) {
    Ti.API.info("Loading portlet " + portlet);
    
    if (portletView) {
        win.remove(portletView);
    }

    Ti.API.info("Showing portlet " + portlet.url);
    portletView = Titanium.UI.createWebView({ 
        url: UPM.BASE_PORTAL_URL + portlet.url,
        top: UPM.TITLEBAR_HEIGHT
    });
    portletTitle.text = portlet.title;
    
    win.add(portletView);
    Ti.API.info("Finished portlet " + portlet.url);

});

