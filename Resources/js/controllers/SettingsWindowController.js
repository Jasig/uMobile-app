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

var SettingsWindowController = function(facade){
    var win, app = facade, self = {},
        credentials, initialized, wasFormSubmitted = false,
        usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar,
        init, createTitleBar, createCredentialsForm,
        onUpdateCredentials, onSaveButtonPress, onSaveButtonUp, onWindowBlur, onSessionSuccess, onSessionError, onPortalProxyPortletsLoaded, onLogOutButtonClick, onLogOutButtonPress, onLogOutButtonUp;

    init = function () {
        self.key = 'settings';
        Ti.API.debug("init() in SettingsWindowController");
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onSessionError);
        Ti.App.addEventListener('PortalProxyPortletsLoaded', onPortalProxyPortletsLoaded);
        
        credentials = app.models.loginProxy.getCredentials();
        
        initialized = true;
    };
    
    self.open = function () {
        Ti.API.debug("self.open() in SettingsWindowController");

        Ti.API.debug("Creating window");
        
        credentials = app.models.loginProxy.getCredentials();
        
        win = Titanium.UI.createWindow({
            title: 'settings',
            exitOnClose: false, 
            navBarHidden: true,
            backgroundColor: app.styles.backgroundColor
        });
        win.open();
        
        titleBar = app.UI.createTitleBar({
            title: app.localDictionary.settings,
            settingsButton: false,
            homeButton: true
        });
        
        win.add(titleBar);
        createCredentialsForm();
        
        activityIndicator = app.UI.createActivityIndicator();
        activityIndicator.resetDimensions();
        
        win.add(activityIndicator);
        activityIndicator.hide();
    };
    
    self.close = function (options) {
        if (win) {
            win.close();
        }
        onWindowBlur();
    };

    createCredentialsForm = function () {
        var usernameLabelOpts = app.styles.settingsUsernameLabel,
            usernameInputOpts = app.styles.settingsUsernameInput,
            passwordLabelOpts = app.styles.settingsPasswordLabel,
            passwordInputOpts = app.styles.settingsPasswordInput,
            saveButtonOpts = app.styles.contentButton,
            resetPasswordOpts = app.styles.settingsResetPasswordLabel,
            logOutButtonOpts = app.styles.contentButton;

        // create the username label and input field
        usernameLabelOpts.text = app.localDictionary.username;
        usernameLabel = Titanium.UI.createLabel(usernameLabelOpts);
        win.add(usernameLabel);

        usernameInputOpts.value = credentials.username;
        usernameInput = Titanium.UI.createTextField(usernameInputOpts);
        win.add(usernameInput);

        // create the password label and input field
        
        passwordLabelOpts.text = app.localDictionary.password;
        passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
        win.add(passwordLabel);

        passwordInputOpts.value = credentials.password;
        
        passwordInput = Titanium.UI.createTextField(passwordInputOpts);
        win.add(passwordInput);

        // create the save button and configure it to persist
        // the new credentials when pressed
        saveButtonOpts.title = app.localDictionary.update;
        saveButtonOpts.top = 150;
        saveButtonOpts.left = 10;
        saveButton = Titanium.UI.createButton(saveButtonOpts);

        win.add(saveButton);
        
        logOutButtonOpts.left = 100 + 10 * 2;
        logOutButtonOpts.top = 150;
        logOutButtonOpts.title = app.localDictionary.logOut;
        logOutButton = Ti.UI.createButton(logOutButtonOpts);
        
        win.add(logOutButton);
        
        resetPassword = Ti.UI.createLabel(resetPasswordOpts);
        resetPassword.text = app.localDictionary.resetPasswordLink + app.UPM.FORGOT_PASSWORD_URL;
        win.add(resetPassword);
        
        logOutButton.addEventListener('click', onLogOutButtonClick);
        if(Ti.Platform.osname === 'iphone') {
            logOutButton.addEventListener('touchstart', onLogOutButtonPress);
            logOutButton.addEventListener('touchend', onLogOutButtonUp);
        }
        saveButton.addEventListener('click', onUpdateCredentials);
        if(Ti.Platform.osname === 'iphone') {
            saveButton.addEventListener('touchstart', onSaveButtonPress);
            saveButton.addEventListener('touchend', onSaveButtonUp);
        }
        passwordInput.addEventListener('return', onUpdateCredentials);
        usernameInput.addEventListener('return', onUpdateCredentials);
        
        resetPassword.addEventListener('click', function (e){
            Ti.Platform.openURL(app.UPM.FORGOT_PASSWORD_URL);
        });
    };

    onUpdateCredentials = function (e) {
        Ti.API.debug("onUpdateCredentials() in SettingsWindowController");
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        if (app.models.deviceProxy.checkNetwork()) {
            if (usernameInput.value === '') {
                /*Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.enterAUserName, buttonNames: [app.localDictionary.OK]
                    }).show();*/
            }
            else {
                wasFormSubmitted = true;
                activityIndicator.loadingMessage(app.localDictionary.loggingIn);
                activityIndicator.show();
                app.models.loginProxy.saveCredentials({
                    username: usernameInput.value, 
                    password: passwordInput.value 
                });
                app.models.loginProxy.establishNetworkSession();
            }
        }
    };
    
    onSaveButtonPress = function(e) {
        Ti.API.debug("onSaveButtonPress() in SettingsWindowController");
        saveButton.backgroundGradient = app.styles.contentButton.backgroundGradientPress;
    };
    
    onSaveButtonUp = function (e) {
        Ti.API.debug("onSaveButtonUp() in SettingsWindowController");
        if (saveButton) { saveButton.backgroundGradient = app.styles.contentButton.backgroundGradient; }
    };
    
    onLogOutButtonClick = function (e) {
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        app.models.loginProxy.saveCredentials({
            username: '', 
            password: ''
        });
        usernameInput.value = '';
        passwordInput.value = '';
        app.models.loginProxy.establishNetworkSession();
    };
    
    onLogOutButtonPress = function (e) {
        logOutButton.backgroundGradient = app.styles.contentButton.backgroundGradientPress;
    };
    
    onLogOutButtonUp = function (e) {
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        if (logOutButton) { logOutButton.backgroundGradient = app.styles.contentButton.backgroundGradient; }
    };
    
    onWindowBlur = function (e) {
        Ti.API.debug("onWindowBlur in SettingsWindowController");
        if (win) {
            passwordInput.blur();
            usernameInput.blur();
            if(activityIndicator.visible) {
                activityIndicator.hide();
            }            
        }
    };
    
    //LoginProxy events
    onSessionSuccess = function (e) {
        if (activityIndicator) {
            activityIndicator.hide();
        }
        Ti.API.debug("onSessionSuccess() in SettingsWindowController. Current Window: " + app.models.windowManager.getCurrentWindow());
        if(app.models.windowManager.getCurrentWindow() === self.key && e.user === credentials.username && wasFormSubmitted) {
            /*Titanium.UI.createAlertDialog({ title: app.localDictionary.success,
                message: app.localDictionary.authenticationSuccessful, buttonNames: [app.localDictionary.OK]
                }).show();*/
        }
        else {
            Ti.API.debug("SettingsWindow isn't visible apparently...");
        }
    };
    
    onPortalProxyPortletsLoaded = function (e) {
        if (wasFormSubmitted) {
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
        }
        else {
            Ti.API.debug("The portlets loaded are for " + e.user + " and not for " + credentials.username);
        }
    };
    
    onSessionError = function (e) {
        Ti.API.debug("onSessionError() in SettingsWindowController");
        if (activityIndicator) {
            activityIndicator.hide();
        }
        if (e.user && e.user != app.models.loginProxy.getCredentials().username) {
            if (!win || !win.visible) {
                app.models.windowManager.openWindow(self.key);
            }
            /*Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
                }).show();*/
        }
    };
    

    if (!initialized) {
        init();
    }
    
    return self;
};