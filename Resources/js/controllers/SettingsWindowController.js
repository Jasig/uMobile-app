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
    var win, app = facade, _self = this, Device, User, UI, LocalDictionary, Styles, UPM, Login, WindowManager,
        credentials, initialized, wasFormSubmitted = false, wasLogOutClicked = false,
        usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar,
        init, createTitleBar, createCredentialsForm,
        onUpdateCredentials, onSaveButtonPress, onSaveButtonUp, onWindowBlur, onSessionSuccess, onSessionError, onPortalProxyPortletsLoaded, onLogOutButtonClick, onLogOutButtonPress, onLogOutButtonUp;

    init = function () {
        _self.key = 'settings';
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
    };
    
    this.open = function () {
        Ti.API.debug("this.open() in SettingsWindowController");
        
        if (!initialized) {
            Ti.App.addEventListener('EstablishNetworkSessionSuccess', onSessionSuccess);
            Ti.App.addEventListener('EstablishNetworkSessionFailure', onSessionError);
            Ti.App.addEventListener('PortalProxyPortletsLoaded', onPortalProxyPortletsLoaded);

            Device = app.models.deviceProxy;
            User = app.models.userProxy;
            UI = app.UI;
            LocalDictionary = app.localDictionary;
            Styles = app.styles;
            UPM = app.config;
            Login = app.models.loginProxy;
            WindowManager = app.models.windowManager;
            PortalWindow = app.controllers.portalWindowController;

            credentials = User.getCredentials();

            initialized = true;
        }
        
        credentials = User.getCredentials();
        
        win = Titanium.UI.createWindow({
            exitOnClose: false, 
            navBarHidden: true,
            backgroundColor: Styles.backgroundColor
            // orientationModes: [Ti.UI.PORTRAIT]
        });
        win.open();
        
        titleBar = UI.createTitleBar({
            title: LocalDictionary.settings,
            settingsButton: false,
            homeButton: true
        });
        
        win.add(titleBar);
        createCredentialsForm();
        
        activityIndicator = UI.createActivityIndicator();
        activityIndicator.resetDimensions();
        activityIndicator.hide();
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
        var usernameLabelOpts = Styles.settingsUsernameLabel,
            usernameInputOpts = Styles.settingsUsernameInput,
            passwordLabelOpts = Styles.settingsPasswordLabel,
            passwordInputOpts = Styles.settingsPasswordInput,
            saveButtonOpts = Styles.contentButton,
            resetPasswordOpts = Styles.settingsResetPasswordLabel,
            logOutButtonOpts = Styles.contentButton;

        // create the username label and input field
        usernameLabelOpts.text = LocalDictionary.username;
        usernameLabel = Titanium.UI.createLabel(usernameLabelOpts);
        win.add(usernameLabel);

        usernameInputOpts.value = credentials.username;
        usernameInput = Titanium.UI.createTextField(usernameInputOpts);
        win.add(usernameInput);

        // create the password label and input field
        
        passwordLabelOpts.text = LocalDictionary.password;
        passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
        win.add(passwordLabel);

        passwordInputOpts.value = credentials.password;
        
        passwordInput = Titanium.UI.createTextField(passwordInputOpts);
        win.add(passwordInput);

        // create the save button and configure it to persist
        // the new credentials when pressed
        saveButtonOpts.title = LocalDictionary.update;
        saveButtonOpts.top = 150;
        saveButtonOpts.left = 10;
        saveButton = Titanium.UI.createButton(saveButtonOpts);

        win.add(saveButton);
        
        logOutButtonOpts.left = 100 + 10 * 2;
        logOutButtonOpts.top = 150;
        logOutButtonOpts.title = LocalDictionary.logOut;
        logOutButton = Ti.UI.createButton(logOutButtonOpts);
        
        win.add(logOutButton);
        
        resetPassword = Ti.UI.createLabel(resetPasswordOpts);
        resetPassword.text = LocalDictionary.resetPasswordLink + UPM.FORGOT_PASSWORD_URL;
        win.add(resetPassword);
        
        logOutButton.addEventListener('click', onLogOutButtonClick);
        if(Device.isIOS()) {
            logOutButton.addEventListener('touchstart', onLogOutButtonPress);
            logOutButton.addEventListener('touchend', onLogOutButtonUp);
        }
        saveButton.addEventListener('click', onUpdateCredentials);
        if(Device.isIOS()) {
            saveButton.addEventListener('touchstart', onSaveButtonPress);
            saveButton.addEventListener('touchend', onSaveButtonUp);
        }
        passwordInput.addEventListener('return', onUpdateCredentials);
        usernameInput.addEventListener('return', onUpdateCredentials);
        
        resetPassword.addEventListener('click', function (e){
            Ti.Platform.openURL(UPM.FORGOT_PASSWORD_URL);
        });
        
        Titanium.App.addEventListener('dimensionchanges', function (e) {
            usernameInput.width = Styles.settingsUsernameInput.width;
            passwordInput.width = Styles.settingsPasswordInput.width;
        });
    };

    onUpdateCredentials = function (e) {
        Ti.API.debug("onUpdateCredentials() in SettingsWindowController");
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        if (Device.checkNetwork()) {
            if (usernameInput.value === '') {
                Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                    message: LocalDictionary.enterAUserName, buttonNames: [LocalDictionary.OK]
                    }).show();
            }
            else {
                wasFormSubmitted = true;
                activityIndicator.setLoadingMessage(LocalDictionary.loggingIn);
                activityIndicator.show();
                User.saveCredentials({
                    username: usernameInput.value, 
                    password: passwordInput.value 
                });
                Login.establishNetworkSession();
            }
        }
    };
    
    onSaveButtonPress = function(e) {
        Ti.API.debug("onSaveButtonPress() in SettingsWindowController");
        saveButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
    };
    
    onSaveButtonUp = function (e) {
        Ti.API.debug("onSaveButtonUp() in SettingsWindowController");
        if (saveButton) { saveButton.backgroundGradient = Styles.contentButton.backgroundGradient; }
    };
    
    onLogOutButtonClick = function (e) {
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        User.saveCredentials({
            username: '', 
            password: ''
        });
        usernameInput.value = '';
        passwordInput.value = '';
        Login.establishNetworkSession();
        wasLogOutClicked = true;
    };
    
    onLogOutButtonPress = function (e) {
        logOutButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
    };
    
    onLogOutButtonUp = function (e) {
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { usernameInput.blur(); }
        if (logOutButton) { logOutButton.backgroundGradient = Styles.contentButton.backgroundGradient; }
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
        var _toast;
        if (activityIndicator) {
            activityIndicator.hide();
        }
        Ti.API.debug("onSessionSuccess() in SettingsWindowController. Current Window: " + WindowManager.getCurrentWindow());
        if(WindowManager.getCurrentWindow() === _self.key && (wasFormSubmitted || wasLogOutClicked)) {
            if (e.user === usernameInput.value) {
                logOutButton.show();
                if (Device.isAndroid()) {
                    _toast = Titanium.UI.createNotification({
                        duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                        message: LocalDictionary.authenticationSuccessful
                    });
                    _toast.show();
                }
                else {
                    Titanium.UI.createAlertDialog({ title: LocalDictionary.success,
                        message: LocalDictionary.authenticationSuccessful, buttonNames: [LocalDictionary.OK]
                        }).show();                    
                }
            }
            else if (e.user === 'guest' && wasLogOutClicked) {
                if (Device.isAndroid()) {
                    _toast = Titanium.UI.createNotification({
                        duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                        message: LocalDictionary.logOutSuccessful
                    });
                    _toast.show();
                }
                else {
                    Titanium.UI.createAlertDialog({ title: LocalDictionary.success,
                        message: LocalDictionary.logOutSuccessful, buttonNames: [LocalDictionary.OK]
                        }).show();
                        logOutButton.hide();
                }
            }
            else if (e.user === 'guest') {
                wasFormSubmitted = false;
                logOutButton.hide();
                Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                    message: LocalDictionary.authenticationFailed, buttonNames: [LocalDictionary.OK]
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
            WindowManager.openWindow(PortalWindow.key);
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
        if (e.user && e.user != User.getCredentials().username && wasFormSubmitted) {
            /*if (!win || !win.visible) {
                WindowManager.openWindow(_self.key);
            }*/
            Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                message: LocalDictionary.authenticationFailed, buttonNames: [LocalDictionary.OK]
                }).show();
        }
        wasFormSubmitted = false;
        wasLogOutClicked = false;
    };
    

    if (!initialized) {
        init();
    }
};