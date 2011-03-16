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

//TODO: Move everything into a controller function

var win = Titanium.UI.currentWindow;

var credentials, 
    usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, 
    titlebar, title, homeButton,
    createTitleBar, createCredentialsForm;


// get the current user credentials in order
// to pre-populate the input fields
credentials = win.app.UPM.getCredentials();

win.backgroundColor = win.app.UPM.HOME_GRID_BACKGROUND_COLOR;

// TODO: Remove this block of code and use GenericTitleBar instead 
createTitleBar = function () {
    titlebar = Titanium.UI.createView({
        backgroundColor: win.app.UPM.TITLEBAR_BACKGROUND_COLOR,
        top:0,
        height: win.app.UPM.TITLEBAR_HEIGHT
    });
    win.add(titlebar);
    
    title = Titanium.UI.createLabel({
        textAlign: "center",
        text: win.app.localDictionary.settings,
        color: win.app.UPM.TITLEBAR_TEXT_COLOR,
        font: { fontWeight: "bold" }
    });
    titlebar.add(title);
    
    homeButton = Titanium.UI.createImageView({
        image: "../../icons/tab-home.png",
        height: 18,
        width: 18,
        left: 10
    });
    titlebar.add(homeButton);
    
    homeButton.addEventListener('singletap', function (e) {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'settings',
                newWindow: 'home',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT 
            }
        );
    });

};

createCredentialsForm = function () {
    
    // create the username label and input field
    usernameLabel = Titanium.UI.createLabel({
        text: win.app.localDictionary.username,
        height:35,
        width:'auto',
        top:50,
        left:10
    });
    win.add(usernameLabel);
    usernameInput = Titanium.UI.createTextField({
    	height:35,
    	top:50,
    	left:100,
    	width:150,
        value: credentials.username,
    	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    win.add(usernameInput);
    
    // create the password label and input field
    passwordLabel = Titanium.UI.createLabel({
        text:win.app.localDictionary.password,
        height:35,
        width:'auto',
        top:100,
        left:10
    });
    win.add(passwordLabel);
    passwordInput = Titanium.UI.createTextField({
        height:35,
        top:100,
        left:100,
        width:150,
        value: credentials.password,
        borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    win.add(passwordInput);
    
    // create the save button and configure it to persist
    // the new credentials when pressed
    saveButton = Titanium.UI.createButton({
        height:35,
        top:150,
        left:10,
        width:250,
        title: win.app.localDictionary.update
    });
    win.add(saveButton);
    saveButton.addEventListener('singletap', function (e) {
        win.app.UPM.saveCredentials({ 
            username: usernameInput.value, 
            password: passwordInput.value 
        });
        Ti.API.debug('Updated user credentials');
        Ti.App.fireEvent('credentialUpdate', {});
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'settings',
                newWindow: 'home',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT 
            }
        );
    });

};

createTitleBar();
createCredentialsForm();
win.initialized = true;

