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
        credentials, initialized,
        usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, activityIndicator, titlebar,
        init, createTitleBar, createCredentialsForm,
        onUpdateCredentials, onSaveButtonPress, onSaveButtonUp, onWindowBlur, onSessionSuccess, onSessionError;

    init = function () {
        self.key = 'settings';
        Ti.API.debug("init() in SettingsWindowController");
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onSessionError);
        
        // get the current user credentials in order
        // to pre-populate the input fields
        credentials = app.models.loginProxy.getCredentials();

        titleBar = new app.views.GenericTitleBar({
            app: app,
            windowKey: 'settings',
            title: app.localDictionary.settings,
            settingsButton: false,
            homeButton: true
        });

        activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
        activityIndicator.resetDimensions();
        
        initialized = true;
    };
    
    self.open = function () {
        Ti.API.debug("self.open() in SettingsWindowController");
        if (!win) {
            Ti.API.debug("Creating window");
            win = Titanium.UI.createWindow({
                title: 'settings',
                key: 'settings',
                exitOnClose: false, 
                navBarHidden: true,
                modal: true,
                backgroundColor: app.styles.backgroundColor
            });
            win.top = Ti.Platform.osname === 'iphone' ? 20 : 0;
            win.open();
            
            win.add(titleBar);
            createCredentialsForm();
            win.add(activityIndicator);
            activityIndicator.hide();
            
        }
        else {
            win.open();
        }
    };
    
    self.close = function (options) {
        if (options.callback) {
            win.addEventListener('close', function winCallback(e) {
                Ti.API.info("Settings Window close event fired.");
                win.removeEventListener('close', winCallback);
                options.callback();
            });
        }
        else {
            Ti.API.error("There's no callback in the close options for SettingsWindowController");
        }
        win.close();
        onWindowBlur();
    };

    createCredentialsForm = function () {
        var usernameLabelOpts = app.styles.textFieldLabel,
            usernameInputOpts = app.styles.textField,
            passwordLabelOpts = app.styles.textFieldLabel,
            passwordInputOpts = app.styles.textField,
            saveButtonOpts;

        // create the username label and input field
        usernameLabelOpts.text = app.localDictionary.username;
        usernameLabelOpts.top = 50;
        usernameLabelOpts.left = 10;
        usernameLabel = Titanium.UI.createLabel(usernameLabelOpts);
        win.add(usernameLabel);

        usernameInputOpts.top = 50;
        usernameInputOpts.left = 100;
        usernameInputOpts.width = Ti.Platform.displayCaps.platformWidth - 100 - 10;
        usernameInputOpts.value = credentials.username || '';
        usernameInputOpts.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
        usernameInputOpts.autocorrect = false;
        usernameInput = Titanium.UI.createTextField(usernameInputOpts);
        win.add(usernameInput);

        // create the password label and input field
        passwordLabelOpts.top = 100;
        passwordLabelOpts.left = 10;
        passwordLabelOpts.text = app.localDictionary.password || '';
        passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
        win.add(passwordLabel);

        passwordInputOpts.value = credentials.password;
        passwordInputOpts.passwordMask = true;
        passwordInputOpts.top = 100;
        passwordInputOpts.left = 100;
        passwordInputOpts.width = Ti.Platform.displayCaps.platformWidth - 100 - 10;
        passwordInputOpts.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
        passwordInputOpts.autocorrect = false;
        passwordInput = Titanium.UI.createTextField(passwordInputOpts);
        win.add(passwordInput);

        // create the save button and configure it to persist
        // the new credentials when pressed

        saveButtonOpts = app.styles.contentButton;
        saveButtonOpts.top = 150;
        saveButtonOpts.left = 10;
        saveButtonOpts.title = app.localDictionary.update;
        saveButton = Titanium.UI.createButton(saveButtonOpts);

        win.add(saveButton);
        

        saveButton.addEventListener('click', onUpdateCredentials);
        if(Ti.Platform.osname === 'iphone') {
            saveButton.addEventListener('touchstart', onSaveButtonPress);
            saveButton.addEventListener('touchend', onSaveButtonUp);
        }
        passwordInput.addEventListener('return', onUpdateCredentials);
        usernameInput.addEventListener('return', onUpdateCredentials);
        
        resetPassword = Ti.UI.createLabel(app.styles.textFieldLabel);
        resetPassword.top = 200;
        resetPassword.left = 10;
        resetPassword.height = 40;
        resetPassword.textDecoration = 'underline';
        resetPassword.text = app.localDictionary.resetPasswordLink + app.UPM.FORGOT_PASSWORD_URL;
        resetPassword.addEventListener('click', function (e){
            app.models.windowManager.openWindow(app.controllers.portletWindowController.key, {
                url: app.UPM.FORGOT_PASSWORD_URL + '?isNativeDevice=true', 
                title: app.localDictionary.resetPasswordTitle,
                externalModule: true
            });
        });
        win.add(resetPassword);
        

    };

    onUpdateCredentials = function (e) {
        Ti.API.debug("onUpdateCredentials() in SettingsWindowController");
        if (app.models.deviceProxy.checkNetwork()) {
            if (usernameInput.value === '') {
                Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.enterAUserName, buttonNames: [app.localDictionary.OK]
                    }).show();
            }
            else {
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
        saveButton.backgroundGradient = app.styles.contentButton.backgroundGradient;
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
        Ti.API.debug("onSessionSuccess() in SettingsWindowController. Current Window: " + app.models.windowManager.getCurrentWindow);
        if(app.models.windowManager.getCurrentWindow() === self.key) {
            Ti.API.debug("onSessionSuccess() in SettingsWindowController");
            app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
        }
        else {
            Ti.API.debug("SettingsWindow isn't visible apparently...");
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
            Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
                }).show();
        }
    };
    

    if (!initialized) {
        init();
    }
    
    return self;
};