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

/**
 * settings_window.js contains setup information for the
 * user settings tab.
 */

// library includes
Titanium.include('lib.js');
Titanium.include('skin.js');

var win = Titanium.UI.currentWindow;

var titlebar, title, homeButton,
    createTitleBar;

createTitleBar = function () {
    titlebar = Titanium.UI.createView({
        backgroundColor: UPM.TITLEBAR_BACKGROUND_COLOR,
        top:0,
        height: UPM.TITLEBAR_HEIGHT
    });
    win.add(titlebar);
    
    title = Titanium.UI.createLabel({
        textAlign: "center",
        text: "Directory",
        color: UPM.TITLEBAR_TEXT_COLOR,
        font: { fontWeight: "bold" }
    });
    titlebar.add(title);
    
    homeButton = Titanium.UI.createImageView({
        image: "icons/tab-home.png",
        height: 18,
        width: 18,
        left: 10
    });
    titlebar.add(homeButton);
    
    homeButton.addEventListener('singletap', function (e) {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'directory',
                newWindow: 'home',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT 
            }
        );
    });

};

createTitleBar();

