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
 * SettingsWindowController contains setup information for the
 * user settings tab.
 */

var win, credentials, usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar, settingsTable, credentialsGroup,
wasFormSubmitted = false, 
wasLogOutClicked = false;

exports.open = function () {
    Ti.App.addEventListener(app.models.loginProxy.events['NETWORK_SESSION_SUCCESS'], onSessionSuccess);
    Ti.App.addEventListener(app.models.loginProxy.events['NETWORK_SESSION_FAILURE'], onSessionError);
    Ti.App.addEventListener(app.models.portalProxy.events['PORTLETS_LOADED'], onPortalProxyPortletsLoaded);

    credentials = app.models.userProxy.retrieveCredentials();
    
    win = Titanium.UI.createWindow({
        // url: 'js/views/WindowContext.js',
        exitOnClose: false, 
        backgroundColor: app.styles.backgroundColor,
        orientationModes: [
        	Titanium.UI.PORTRAIT,
        	Titanium.UI.UPSIDE_PORTRAIT,
        	Titanium.UI.LANDSCAPE_LEFT,
        	Titanium.UI.LANDSCAPE_RIGHT,
        	Titanium.UI.FACE_UP,
        	Titanium.UI.FACE_DOWN
        ]
    });

    win.open();
    
    titleBar = require('/js/views/UI/TitleBar');
    titleBar.addHomeButton();
    titleBar.updateTitle(app.localDictionary.settings);
    
    win.add(titleBar.view);

    createCredentialsForm();
    
    activityIndicator = require('/js/views/UI/ActivityIndicator');
    activityIndicator.resetDimensions();
    win.add(activityIndicator.view);
    activityIndicator.view.hide();
};

exports.close = function (options) {
    Ti.App.removeEventListener(app.models.loginProxy.events['NETWORK_SESSION_SUCCESS'], onSessionSuccess);
    Ti.App.removeEventListener(app.models.loginProxy.events['NETWORK_SESSION_FAILURE'], onSessionError);
    Ti.App.removeEventListener(app.models.portalProxy.events['PORTLETS_LOADED'], onPortalProxyPortletsLoaded);
    
    logOutButton.removeEventListener('click', onLogOutButtonClick);
    saveButton.removeEventListener('click', onUpdateCredentials);
    passwordInput.removeEventListener('return', onUpdateCredentials);
    usernameInput.removeEventListener('return', onUpdateCredentials);
    resetPassword.removeEventListener('click', onResetPassword);
    Titanium.App.removeEventListener(app.events['DIMENSION_CHANGES'], resetFormOrientation);
    
    win.close();
    onWindowBlur();
    win = null;
};

function createCredentialsForm () {
    var usernameLabelOpts = _.clone(app.styles.settingsUsernameLabel),
        usernameInputOpts = _.clone(app.styles.settingsUsernameInput),
        passwordLabelOpts = _.clone(app.styles.settingsPasswordLabel),
        passwordInputOpts = _.clone(app.styles.settingsPasswordInput),
        saveButtonOpts = _.clone(app.styles.contentButton),
        resetPasswordOpts = _.clone(app.styles.settingsResetPasswordLabel),
        logOutButtonOpts = _.clone(app.styles.contentButton);

    var credentialsGroup = Ti.UI.createTableViewSection({
        headerTitle: app.localDictionary.accountSettings
    });
    
    var usernameRow = Ti.UI.createTableViewRow({
        className: "inputRow"
    });
    
    // create the username label and input field
    usernameLabelOpts.text = app.localDictionary.username;
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
    
    passwordLabelOpts.text = app.localDictionary.password;
    passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
    passwordRow.add(passwordLabel);

    passwordInputOpts.value = credentials.password;
    
    passwordInput = Titanium.UI.createTextField(passwordInputOpts);
    passwordRow.add(passwordInput);
    
    credentialsGroup.add(passwordRow);
    
    
    var buttonRow = Ti.UI.createTableViewRow();
    // create the save button and configure it to persist
    // the new credentials when pressed
    saveButtonOpts.title = app.localDictionary.update;
    saveButtonOpts.left = 10;
    saveButton = Titanium.UI.createButton(saveButtonOpts);

    buttonRow.add(saveButton);
    
    logOutButtonOpts.left = 100 + 10*2;
    logOutButtonOpts.title = app.localDictionary.logOut;
    logOutButton = Ti.UI.createButton(logOutButtonOpts);
    
    buttonRow.add(logOutButton);
    
    credentialsGroup.add(buttonRow);
    
    var resetPasswordRow = Ti.UI.createTableViewRow();
    
    resetPassword = Ti.UI.createLabel(resetPasswordOpts);
    resetPassword.text = app.localDictionary.resetPasswordLink + app.config.FORGOT_PASSWORD_URL;
    resetPasswordRow.add(resetPassword);
    
    credentialsGroup.add(resetPasswordRow);
    
    logOutButton.addEventListener('click', onLogOutButtonClick);
    if(app.models.deviceProxy.isIOS()) {
        logOutButton.addEventListener('touchstart', onLogOutButtonPress);
        logOutButton.addEventListener('touchend', onLogOutButtonUp);
    }
    saveButton.addEventListener('click', onUpdateCredentials);
    if(app.models.deviceProxy.isIOS()) {
        saveButton.addEventListener('touchstart', onSaveButtonPress);
        saveButton.addEventListener('touchend', onSaveButtonUp);
    }
    passwordInput.addEventListener('return', onUpdateCredentials);
    usernameInput.addEventListener('return', onUpdateCredentials);
    
    resetPassword.addEventListener('click', onResetPassword);
    
    settingsTable = Ti.UI.createTableView(app.styles.settingsTable);
    settingsTable.setData([credentialsGroup]);
    if (app.models.deviceProxy.isAndroid()) {
    	settingsTable.top = titleBar.view.top + titleBar.view.height;
    }
    win.add(settingsTable);

    Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], resetFormOrientation);
};

function resetFormOrientation (e) {
    if (usernameInput) usernameInput.width = app.styles.settingsUsernameInput.width;
    if (passwordInput) passwordInput.width = app.styles.settingsPasswordInput.width;
}

function onResetPassword (e) {
    Ti.Platform.openURL(app.config.FORGOT_PASSWORD_URL);
}

function onUpdateCredentials (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { usernameInput.blur(); }
    if (app.models.deviceProxy.checkNetwork()) {
        if (usernameInput.value === '') {
            if (win.visible || app.models.deviceProxy.isIOS()) {
                Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.enterAUserName, buttonNames: [app.localDictionary.OK]
                    }).show();
            }
        }
        else {
            wasFormSubmitted = true;
            activityIndicator.saveLoadingMessage(app.localDictionary.loggingIn);
            activityIndicator.view.show();
            app.models.userProxy.saveCredentials({
                username: usernameInput.value, 
                password: passwordInput.value 
            });
            app.models.loginProxy.establishNetworkSession();
        }
    }
    else {
        Ti.App.fireEvent(app.events['NETWORK_ERROR']);
    }
}

function onSaveButtonPress (e) {
    saveButton.backgroundGradient = app.styles.contentButton.backgroundGradientPress;
}

function onSaveButtonUp (e) {
    if (saveButton) { saveButton.backgroundGradient = app.styles.contentButton.backgroundGradient; }
}

function onLogOutButtonClick (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { /*usernameInput.blur();*/ }
    app.models.userProxy.saveCredentials({
        username: '', 
        password: ''
    });
    usernameInput.value = '';
    passwordInput.value = '';
    app.models.loginProxy.clearSession();
    wasLogOutClicked = true;
    activityIndicator.view.show();
}

function onLogOutButtonPress (e) {
    logOutButton.backgroundGradient = app.styles.contentButton.backgroundGradientPress;
}

function onLogOutButtonUp (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { /*usernameInput.blur();*/ }
    if (logOutButton) { logOutButton.backgroundGradient = app.styles.contentButton.backgroundGradient; }
}

function onWindowBlur (e) {
    passwordInput.blur();
}

//LoginProxy events
function onSessionSuccess (e) {
    var _toast;
    activityIndicator.view.hide();

    if(app.models.windowManager.retrieveCurrentWindow() === app.config.SETTINGS_KEY && (wasFormSubmitted || wasLogOutClicked)) {
        if (e.user === usernameInput.value) {
            logOutButton.show();
            if (app.models.deviceProxy.isAndroid()) {
                _toast = Titanium.UI.createNotification({
                    duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                    message: app.localDictionary.authenticationSuccessful
                });
                _toast.show();
            }
            else {
                try {
                    Titanium.UI.createAlertDialog({ title: app.localDictionary.success,
                        message: app.localDictionary.authenticationSuccessful, buttonNames: [app.localDictionary.OK]
                        }).show();
                }
                catch (e) {
                    Ti.API.error("Couldn't fire alert. Window is probably closed.");
                }
            }
        }
        else if (e.user === 'guest' && wasLogOutClicked) {
            if (app.models.deviceProxy.isAndroid()) {
                _toast = Titanium.UI.createNotification({
                    duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                    message: app.localDictionary.logOutSuccessful
                });
                _toast.show();
            }
            else {
                try {                     
                    Titanium.UI.createAlertDialog({ title: app.localDictionary.success,
                        message: app.localDictionary.logOutSuccessful, buttonNames: [app.localDictionary.OK]
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
                Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                    message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
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
    wasLogOutClicked = false;
}

function onPortalProxyPortletsLoaded (e) {
    if (wasFormSubmitted && e.user === credentials.username) {
        app.models.windowManager.openWindow(app.config.HOME_KEY);
        wasFormSubmitted = false;
        wasLogOutClicked = false;
    }
    else {
        Ti.API.debug("The portlets loaded are for " + e.user + " and not for " + credentials.username);
        onSessionError(e);
    }
}

function onSessionError (e) {
    activityIndicator.view.hide();
    
    //If we at least received a user layout back from the service
    if (e.user && e.user != app.models.userProxy.retrieveCredentials().username && wasFormSubmitted) {
        try {
            Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                message: app.localDictionary.authenticationFailed, buttonNames: [app.localDictionary.OK]
                }).show();
        }
        catch (e) {
            Ti.API.error("Couldn't fire alert. Window is probably closed.");
        }
    }
    else if (wasFormSubmitted) {
        try {
            Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
                message: app.localDictionary.couldNotLoginToPortal, buttonNames: [app.localDictionary.OK]
                }).show();
        }
        catch (e) {
            Ti.API.error("Couldn't fire alert. Window is probably closed.");
        }
    }
    
    wasFormSubmitted = false;
    wasLogOutClicked = false;
}