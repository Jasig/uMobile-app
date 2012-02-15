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

var win, isOpen, credentials, usernameLabel, usernameInput, passwordLabel, passwordInput, saveButton, logOutButton, activityIndicator, titlebar, settingsTable, credentialsGroup, 
app, userProxy, styles, localDictionary, config, deviceProxy, _,
wasFormSubmitted = false, 
wasLogOutClicked = false;

exports.open = function () {
    isOpen = true;
    app = require('/js/Constants');
    _ = require('/js/libs/underscore-min');
    userProxy = require('/js/models/UserProxy');
    styles = require('/js/style');
    config = require('/js/config');
    deviceProxy = require('/js/models/DeviceProxy');
    localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];
    
    Ti.App.addEventListener(app.loginEvents['NETWORK_SESSION_SUCCESS'], onSessionSuccess);
    Ti.App.addEventListener(app.loginEvents['NETWORK_SESSION_FAILURE'], onSessionError);
    Ti.App.addEventListener(app.portalEvents['PORTLETS_LOADED'], onPortalProxyPortletsLoaded);
    
    credentials = userProxy.retrieveCredentials();
    
    win = Titanium.UI.createWindow({
        exitOnClose: false, 
        backgroundColor: styles.backgroundColor,
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
    
    titleBar = require('/js/views/UI/TitleBar').createTitleBar();
    titleBar.addHomeButton();
    titleBar.updateTitle(localDictionary.settings);
    
    win.add(titleBar.view);

    createCredentialsForm();
    
    activityIndicator = require('/js/views/UI/ActivityIndicator').createActivityIndicator();
    
    win.add(activityIndicator.view);
    activityIndicator.resetDimensions();
    activityIndicator.view.hide();
};

exports.close = function (options) {
    isOpen = false;
    Ti.App.removeEventListener(app.loginEvents['NETWORK_SESSION_SUCCESS'], onSessionSuccess);
    Ti.App.removeEventListener(app.loginEvents['NETWORK_SESSION_FAILURE'], onSessionError);
    Ti.App.removeEventListener(app.portalEvents['PORTLETS_LOADED'], onPortalProxyPortletsLoaded);
    
    logOutButton.removeEventListener('click', onLogOutButtonClick);
    saveButton.removeEventListener('click', onUpdateCredentials);
    passwordInput.removeEventListener('return', onUpdateCredentials);
    usernameInput.removeEventListener('return', onUpdateCredentials);
    resetPassword.removeEventListener('click', onResetPassword);
    Titanium.App.removeEventListener(app.events['DIMENSION_CHANGES'], resetFormOrientation);
    
    app = null;
    userProxy = null;
    styles = null;
    localDictionary = null;
    config = null;
    deviceProxy = null;
    
    win.close();
    onWindowBlur();
    win = null;
};

exports.alert = function (title, message) {
    if (win.visible || deviceProxy.isIOS()) {
        Titanium.UI.createAlertDialog({ title: title,
            message: message, buttonNames: [localDictionary.OK]
            }).show();
    }
    else {
        Ti.API.error('Could not show alert in Settings Window');
    }
};

function createCredentialsForm () {
    var usernameLabelOpts = _.clone(styles.settingsUsernameLabel),
        usernameInputOpts = _.clone(styles.settingsUsernameInput),
        passwordLabelOpts = _.clone(styles.settingsPasswordLabel),
        passwordInputOpts = _.clone(styles.settingsPasswordInput),
        saveButtonOpts = _.clone(styles.contentButton),
        resetPasswordOpts = _.clone(styles.settingsResetPasswordLabel),
        logOutButtonOpts = _.clone(styles.contentButton);

    var credentialsGroup = Ti.UI.createTableViewSection({
        headerTitle: localDictionary.accountSettings
    });
    
    var usernameRow = Ti.UI.createTableViewRow({
        className: "inputRow"
    });
    
    // create the username label and input field
    usernameLabelOpts.text = localDictionary.username;
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
    
    passwordLabelOpts.text = localDictionary.password;
    passwordLabel = Titanium.UI.createLabel(passwordLabelOpts);
    passwordRow.add(passwordLabel);

    passwordInputOpts.value = credentials.password;
    
    passwordInput = Titanium.UI.createTextField(passwordInputOpts);
    passwordRow.add(passwordInput);
    
    credentialsGroup.add(passwordRow);
    
    
    var buttonRow = Ti.UI.createTableViewRow();
    // create the save button and configure it to persist
    // the new credentials when pressed
    saveButtonOpts.title = localDictionary.update;
    saveButtonOpts.left = 10 + 'dp';
    saveButton = Titanium.UI.createButton(saveButtonOpts);

    buttonRow.add(saveButton);
    
    logOutButtonOpts.left = 100 + 10*2 + 'dp';
    logOutButtonOpts.title = localDictionary.logOut;
    logOutButton = Ti.UI.createButton(logOutButtonOpts);
    
    buttonRow.add(logOutButton);
    
    credentialsGroup.add(buttonRow);
    
    var resetPasswordRow = Ti.UI.createTableViewRow();
    
    resetPassword = Ti.UI.createLabel(resetPasswordOpts);
    resetPassword.text = localDictionary.resetPasswordLink + config.FORGOT_PASSWORD_URL;
    resetPasswordRow.add(resetPassword);
    
    credentialsGroup.add(resetPasswordRow);
    
    logOutButton.addEventListener('click', onLogOutButtonClick);
    if(deviceProxy.isIOS()) {
        logOutButton.addEventListener('touchstart', onLogOutButtonPress);
        logOutButton.addEventListener('touchend', onLogOutButtonUp);
    }
    saveButton.addEventListener('click', onUpdateCredentials);
    if(deviceProxy.isIOS()) {
        saveButton.addEventListener('touchstart', onSaveButtonPress);
        saveButton.addEventListener('touchend', onSaveButtonUp);
    }
    passwordInput.addEventListener('return', onUpdateCredentials);
    usernameInput.addEventListener('return', onUpdateCredentials);
    
    resetPassword.addEventListener('click', onResetPassword);
    
    settingsTable = Ti.UI.createTableView(styles.settingsTable);
    settingsTable.setData([credentialsGroup]);
    if (deviceProxy.isAndroid()) {
    	settingsTable.top = styles.titleBar.top + styles.titleBar.height;
    }
    win.add(settingsTable);

    Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], resetFormOrientation);
};

function resetFormOrientation (e) {
    if (usernameInput) usernameInput.width = styles.settingsUsernameInput.width;
    if (passwordInput) passwordInput.width = styles.settingsPasswordInput.width;
}

function onResetPassword (e) {
    Ti.Platform.openURL(config.FORGOT_PASSWORD_URL);
}

function onUpdateCredentials (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { usernameInput.blur(); }
    if (deviceProxy.checkNetwork()) {
        if (usernameInput.value === '') {
            exports.alert(localDictionary.error, localDictionary.enterAUserName);
        }
        else {
            wasFormSubmitted = true;
            activityIndicator.setLoadingMessage(localDictionary.loggingIn);
            activityIndicator.view.show();
            userProxy.saveCredentials({
                username: usernameInput.value, 
                password: passwordInput.value 
            });
            Ti.App.fireEvent(app.loginEvents['ESTABLISH_NETWORK_SESSION']);
        }
    }
    else {
        Ti.App.fireEvent(app.events['NETWORK_ERROR']);
    }
}

function onSaveButtonPress (e) {
    saveButton.backgroundGradient = styles.contentButton.backgroundGradientPress;
}

function onSaveButtonUp (e) {
    if (saveButton) { saveButton.backgroundGradient = styles.contentButton.backgroundGradient; }
}

function onLogOutButtonClick (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { /*usernameInput.blur();*/ }
    userProxy.saveCredentials({
        username: '', 
        password: ''
    });
    usernameInput.value = '';
    passwordInput.value = '';
    Ti.App.fireEvent(app.loginEvents['CLEAR_SESSION']);
    wasLogOutClicked = true;
    activityIndicator.view.show();
}

function onLogOutButtonPress (e) {
    logOutButton.backgroundGradient = styles.contentButton.backgroundGradientPress;
}

function onLogOutButtonUp (e) {
    if (passwordInput) { passwordInput.blur(); }
    if (usernameInput) { /*usernameInput.blur();*/ }
    if (logOutButton) { logOutButton.backgroundGradient = styles.contentButton.backgroundGradient; }
}

function onWindowBlur (e) {
    passwordInput.blur();
}

//LoginProxy events
function onSessionSuccess (e) {
    Ti.API.debug('onSessionSuccess() in SettingsWindowController. e.user: '+e.user);
    var _toast;
    activityIndicator.view.hide();
    if (!isOpen || (!wasFormSubmitted && !wasLogOutClicked)) return;

    if (e.user === usernameInput.value) {
        logOutButton.show();
        if (deviceProxy.isAndroid()) {
            _toast = Titanium.UI.createNotification({
                duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                message: localDictionary.authenticationSuccessful
            });
            _toast.show();
        }
        else {
            exports.alert(localDictionary.success, localDictionary.authenticationSuccessful);
        }
    }
    else if (e.user === 'guest' && wasLogOutClicked) {
        if (deviceProxy.isAndroid()) {
            _toast = Titanium.UI.createNotification({
                duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
                message: localDictionary.logOutSuccessful
            });
            _toast.show();
        }
        else {
            exports.alert(localDictionary.success, localDictionary.logOutSuccessful);
        }
    }
    else if (e.user === 'guest') {
        wasFormSubmitted = false;
        logOutButton.hide();
        exports.alert(localDictionary.error, localDictionary.authenticationFailed);
    }
    else {
        Ti.API.error("Logout must not've worked, user: " + e.user);
    }

    wasLogOutClicked = false;
}

function onPortalProxyPortletsLoaded (e) {
    Ti.API.debug('onPortalProxyPortletsLoaded() in SettingsWindowController');
    if (!wasFormSubmitted) return onSessionError(e);;
    Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.HOME_KEY});
    wasFormSubmitted = false;
    wasLogOutClicked = false;

}

function onSessionError (e) {
    Ti.API.debug('onSessionError() in SettingsWindowController');
    activityIndicator.view.hide();
    
    //If we at least received a user layout back from the service
    if (e.user && e.user != userProxy.retrieveCredentials().username && wasFormSubmitted) {
        exports.alert(localDictionary.error, localDictionary.authenticationFailed);
    }
    else if (wasFormSubmitted) {
        exports.alert(localDictionary.error, localDictionary.couldNotLoginToPortal);
    }
    
    wasFormSubmitted = false;
    wasLogOutClicked = false;
}