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
    var win, app = facade, _self = this, Device, User, UI, LocalDictionary, Styles, UPM, Login,
        credentials, initialized, wasFormSubmitted = false, wasLogOutClicked = false,
        usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar, settingsTable, credentialsGroup,
        init, createCredentialsForm,
        onUpdateCredentials, onSaveButtonPress, onSaveButtonUp, onWindowBlur, onSessionSuccess, onSessionError, onPortalProxyPortletsLoaded, onLogOutButtonClick, onLogOutButtonPress, onLogOutButtonUp;

    init = function () {
        _self.key = 'settings';
        _self.isModal = true;
        Ti.App.addEventListener(app.events['STYLESHEET_UPDATED'], function (e) {
            Styles = app.styles;
        });
    };
    
    this.open = function () {
        Ti.API.debug("this.open() in SettingsWindowController");

        if (!initialized) {
            Ti.App.addEventListener(LoginProxy.events['NETWORK_SESSION_SUCCESS'], onSessionSuccess);
            Ti.App.addEventListener(LoginProxy.events['NETWORK_SESSION_FAILURE'], onSessionError);
            Ti.App.addEventListener(PortalProxy.events['PORTLETS_LOADED'], onPortalProxyPortletsLoaded);

            Device = app.models.deviceProxy;
            User = app.models.userProxy;
            UI = app.UI;
            LocalDictionary = app.localDictionary;
            Styles = app.styles;
            UPM = app.config;
            Login = app.models.loginProxy;
            PortalWindow = app.controllers.portalWindowController;

            credentials = User.getCredentials();

            initialized = true;
        }
        
        credentials = User.getCredentials();
        
        win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            exitOnClose: false, 
            backgroundColor: Styles.backgroundColor,
            modal: true,
            navBarHidden: true,
            orientationModes: [
            	Titanium.UI.PORTRAIT,
            	Titanium.UI.UPSIDE_PORTRAIT,
            	Titanium.UI.LANDSCAPE_LEFT,
            	Titanium.UI.LANDSCAPE_RIGHT,
            	Titanium.UI.FACE_UP,
            	Titanium.UI.FACE_DOWN
            ]
        });
        /*if (Device.isIOS()) {
            win.modal = true;
            win.navBarHidden = true;
        }*/
        win.open();
        
        titleBar = require('/js/views/UI/TitleBar');
        titleBar.addHomeButton();
        titleBar.updateTitle(LocalDictionary.settings)
        
        win.add(titleBar.view);
        if (Device.isAndroid()) {
        	// titleBar.top += 24;
        }
        createCredentialsForm();
        
        activityIndicator = require('/js/views/UI/ActivityIndicator');
        activityIndicator.resetDimensions();
        win.add(activityIndicator.view);
        activityIndicator.view.hide();
    };
    
    this.close = function (options) {
        if (win) {
            win.close();
        }
        onWindowBlur();
    };

    createCredentialsForm = function () {
        var usernameLabelOpts = _.clone(Styles.settingsUsernameLabel),
            usernameInputOpts = _.clone(Styles.settingsUsernameInput),
            passwordLabelOpts = _.clone(Styles.settingsPasswordLabel),
            passwordInputOpts = _.clone(Styles.settingsPasswordInput),
            saveButtonOpts = _.clone(Styles.contentButton),
            resetPasswordOpts = _.clone(Styles.settingsResetPasswordLabel),
            logOutButtonOpts = _.clone(Styles.contentButton);

        var credentialsGroup = Ti.UI.createTableViewSection({
            headerTitle: LocalDictionary.accountSettings
        });
        
        var usernameRow = Ti.UI.createTableViewRow({
            className: "inputRow"
        });
        
        // create the username label and input field
        usernameLabelOpts.text = LocalDictionary.username;
        usernameLabel = Titanium.UI.createLabel(usernameLabelOpts);
        usernameRow.add(usernameLabel);

        usernameInputOpts.value = credentials.username;
        usernameInput = Titanium.UI.createTextField(usernameInputOpts);
        usernameRow.add(usernameInput);
        
        credentialsGroup.add(usernameRow);

        // create the password label and input field
        
        var passwordRow = Ti.UI.createTableViewRow({
            className: "inputRow"
        });
        
        passwordLabelOpts.text = LocalDictionary.password;
        passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
        passwordRow.add(passwordLabel);

        passwordInputOpts.value = credentials.password;
        
        passwordInput = Titanium.UI.createTextField(passwordInputOpts);
        passwordRow.add(passwordInput);
        
        credentialsGroup.add(passwordRow);
        
        
        var buttonRow = Ti.UI.createTableViewRow();
        // create the save button and configure it to persist
        // the new credentials when pressed
        saveButtonOpts.title = LocalDictionary.update;
        saveButtonOpts.left = 10;
        saveButton = Titanium.UI.createButton(saveButtonOpts);

        buttonRow.add(saveButton);
        
        logOutButtonOpts.left = 100 + 10*2;
        logOutButtonOpts.title = LocalDictionary.logOut;
        logOutButton = Ti.UI.createButton(logOutButtonOpts);
        
        buttonRow.add(logOutButton);
        
        credentialsGroup.add(buttonRow);
        
        var resetPasswordRow = Ti.UI.createTableViewRow();
        
        resetPassword = Ti.UI.createLabel(resetPasswordOpts);
        resetPassword.text = LocalDictionary.resetPasswordLink + UPM.FORGOT_PASSWORD_URL;
        resetPasswordRow.add(resetPassword);
        
        credentialsGroup.add(resetPasswordRow);
        
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
        
        settingsTable = Ti.UI.createTableView(Styles.settingsTable);
        settingsTable.setData([credentialsGroup]);
        if (Device.isAndroid()) {
        	settingsTable.top = titleBar.view.top + titleBar.view.height;
        }
        win.add(settingsTable);
        /*settingsTable.addEventListener('click', function (e) {
            Ti.API.info("Settings table click, source is " + e.source);
            if (Device.isIOS() && e.source !== usernameInput && e.source !==passwordInput) {
                usernameInput.blur();
                passwordInput.blur();
            }
        })*/
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
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
                if (win.visible || app.models.deviceProxy.isIOS()) {
                    Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                        message: LocalDictionary.enterAUserName, buttonNames: [LocalDictionary.OK]
                        }).show();
                }
            }
            else {
                wasFormSubmitted = true;
                activityIndicator.setLoadingMessage(LocalDictionary.loggingIn);
                activityIndicator.view.show();
                User.saveCredentials({
                    username: usernameInput.value, 
                    password: passwordInput.value 
                });
                Login.establishNetworkSession();
            }
        }
        else {
            Ti.App.fireEvent(app.events['NETWORK_ERROR']);
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
        if (usernameInput) { /*usernameInput.blur();*/ }
        User.saveCredentials({
            username: '', 
            password: ''
        });
        usernameInput.value = '';
        passwordInput.value = '';
        Login.clearSession();
        wasLogOutClicked = true;
        activityIndicator.view.show();
    };
    
    onLogOutButtonPress = function (e) {
        logOutButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
    };
    
    onLogOutButtonUp = function (e) {
        Ti.API.debug("onLogOutButtonUp in SettingsWindowController");
        if (passwordInput) { passwordInput.blur(); }
        if (usernameInput) { /*usernameInput.blur();*/ }
        if (logOutButton) { logOutButton.backgroundGradient = Styles.contentButton.backgroundGradient; }
    };
    
    onWindowBlur = function (e) {
        Ti.API.debug("onWindowBlur in SettingsWindowController");
        if (win) {
            passwordInput.blur();
            activityIndicator.view.hide();
        }
    };
    
    //LoginProxy events
    onSessionSuccess = function (e) {
        var _toast;
        activityIndicator.view.hide();
        Ti.API.debug("onSessionSuccess() in SettingsWindowController. Current Window: " + app.models.windowManager.getCurrentWindow());
        if(app.models.windowManager.getCurrentWindow() === _self.key && (wasFormSubmitted || wasLogOutClicked)) {
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
                    try {
                        Titanium.UI.createAlertDialog({ title: LocalDictionary.success,
                            message: LocalDictionary.authenticationSuccessful, buttonNames: [LocalDictionary.OK]
                            }).show();
                    }
                    catch (e) {
                        Ti.API.error("Couldn't fire alert. Window is probably closed.");
                    }
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
                    try {                     
                        Titanium.UI.createAlertDialog({ title: LocalDictionary.success,
                            message: LocalDictionary.logOutSuccessful, buttonNames: [LocalDictionary.OK]
                            }).show();
                            logOutButton.hide();
                    }
                    catch (e) {
                        Ti.API.error("Couldn't fire alert. Window is probably closed.");
                    }
                }
            }
            else if (e.user === 'guest') {
                wasFormSubmitted = false;
                logOutButton.hide();
                try {
                    Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                        message: LocalDictionary.authenticationFailed, buttonNames: [LocalDictionary.OK]
                        }).show();
                }
                catch (e) {
                    Ti.API.error("Couldn't fire alert. Window is probably closed.");
                }
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
        Ti.API.debug("onPortalProxyPortletsLoaded in SettingsWindowController");
        if (wasFormSubmitted && e.user === credentials.username) {
            app.models.windowManager.openWindow(PortalWindow.key);
            wasFormSubmitted = false;
            wasLogOutClicked = false;
        }
        else {
            Ti.API.debug("The portlets loaded are for " + e.user + " and not for " + credentials.username);
	        onSessionError(e);
        }
    };
    
    onSessionError = function (e) {
        Ti.API.debug("onSessionError() in SettingsWindowController");

        activityIndicator.view.hide();
        
        //If we at least received a user layout back from the service
        if (e.user && e.user != User.getCredentials().username && wasFormSubmitted) {
            Ti.API.debug("Condition 1 passes in onSessionError() in Settings Window Controller");
            try {
                Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                    message: LocalDictionary.authenticationFailed, buttonNames: [LocalDictionary.OK]
                    }).show();
            }
            catch (e) {
                Ti.API.error("Couldn't fire alert. Window is probably closed.");
            }
        }
        else if (wasFormSubmitted) {
            Ti.API.debug("Condition 2 passes in onSessionError() in Settings Window Controller");
            try {
                Titanium.UI.createAlertDialog({ title: LocalDictionary.error,
                    message: LocalDictionary.couldNotLoginToPortal, buttonNames: [LocalDictionary.OK]
                    }).show();
            }
            catch (e) {
                Ti.API.error("Couldn't fire alert. Window is probably closed.");
            }
        }
        else {
            Ti.API.debug("Settings form wasn't submitted");
        }
        
        wasFormSubmitted = false;
        wasLogOutClicked = false;
    };
    

    if (!initialized) {
        init();
    }
};