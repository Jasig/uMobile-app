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
    var win, app = facade, _self = this, device,
        credentials, initialized, wasFormSubmitted = false, wasLogOutClicked = false,
        usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar,
        init, createTitleBar, createCredentialsForm,
        onUpdateCredentials, onSaveButtonPress, onSaveButtonUp, onWindowBlur, onSessionSuccess, onSessionError, onPortalProxyPortletsLoaded, onLogOutButtonClick, onLogOutButtonPress, onLogOutButtonUp;

    init = function () {
        _self.key = 'settings';
        Ti.API.debug("init() in SettingsWindowController");
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onSessionError);
        Ti.App.addEventListener('PortalProxyPortletsLoaded', onPortalProxyPortletsLoaded);
        
        device = app.models.deviceProxy;
        
        credentials = app.models.loginProxy.getCredentials();
        
        initialized = true;
    };
    
    this.open = function () {
        Ti.API.debug("this.open() in SettingsWindowController");
        
        credentials = app.models.loginProxy.getCredentials();
        
        win = Titanium.UI.createWindow({
            exitOnClose: false, 
            navBarHidden: true,
            backgroundColor: app.styles.backgroundColor
            // orientationModes: [Ti.UI.PORTRAIT]
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
    
    this.close = function (options) {
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
        if(device.isIOS()) {
            logOutButton.addEventListener('touchstart', onLogOutButtonPress);
            logOutButton.addEventListener('touchend', onLogOutButtonUp);
        }
        saveButton.addEventListener('click', onUpdateCredentials);
        if(device.isIOS()) {
            saveButton.addEventListener('touchstart', onSaveButtonPress);
            saveButton.addEventListener('touchend', onSaveButtonUp);
        }
        passwordInput.addEventListener('return', onUpdateCredentials);
        usernameInput.addEventListener('return', onUpdateCredentials);
        
        resetPassword.addEventListener('click', function (e){
            Ti.Platform.openURL(app.UPM.FORGOT_PASSWORD_URL);
        });
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            usernameInput.width = app.styles.settingsUsernameInput.width;
            passwordInput.width = app.styles.settingsPasswordInput.width;
        });
    };

    onUpdateCredentials = function (e) {
        Ti.API.debug("onUpdateCredentials() in SettingsWindowController");
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        if (app.models.deviceProxy.checkNetwork()) {
            if (usernameInput.value === '') {
                Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.enterAUserName, buttonNames: [app.localDictionary.OK]
                    }).show();
            }
            else {
                wasFormSubmitted = true;
                activityIndicator.setLoadingMessage(app.localDictionary.loggingIn);
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
        wasLogOutClicked = true;
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
        if(app.models.windowManager.getCurrentWindow() === _self.key && (wasFormSubmitted || wasLogOutClicked)) {
            if (e.user === usernameInput.value) {
                logOutButton.show();
                Titanium.UI.createAlertDialog({ title: app.localDictionary.success,
                    message: app.localDictionary.authenticationSuccessful, buttonNames: [app.localDictionary.OK]
                    }).show();
            }
            else if (e.user === 'guest' && wasLogOutClicked) {
                Titanium.UI.createAlertDialog({ title: app.localDictionary.success,
                    message: app.localDictionary.logOutSuccessful, buttonNames: [app.localDictionary.OK]
                    }).show();
                    logOutButton.hide();
            }
            else if (e.user === 'guest') {
                wasFormSubmitted = false;
                logOutButton.hide();
                Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
                    }).show();
            }
            else {
                Ti.API.error("Logout must not've worked, user: " + e.user);
            }
        }
        else {
            Ti.API.debug("SettingsWindow isn't visible apparently...");
        }
        wasLogOutClicked = false;
    };
    
    onPortalProxyPortletsLoaded = function (e) {
        if (wasFormSubmitted) {
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
            wasFormSubmitted = false;
            wasLogOutClicked = false;
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
        if (e.user && e.user != app.models.loginProxy.getCredentials().username && wasFormSubmitted) {
            /*if (!win || !win.visible) {
                app.models.windowManager.openWindow(_self.key);
            }*/
            Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
                }).show();
        }
        wasFormSubmitted = false;
        wasLogOutClicked = false;
    };
    

    if (!initialized) {
        init();
    }
};