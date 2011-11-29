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
var UI = function (facade) {
    var _self = this, app=facade, init, Device, Styles, SettingsWindow, PortalWindow, PortletWindow, LocalDictionary;
    
    init = function () {
        Device = app.models.deviceProxy;
        Config = app.config;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        Ti.App.addEventListener(app.events['STYLESHEET_UPDATED'], function (e) {
            Styles = app.styles;
        });
    };
    
    this.createSecondaryNavBar = function (opts) {
        var _secondaryNavBar, _backBtnOptions, _navBackButton, _titleLabel;
        // Possible parameters: backBtnText:String, btnFloatLeft:Bool, title:String, backButtonHandler:Function
        // A partial view used in some views to place a nav bar just below the titleBar
        _secondaryNavBar = Titanium.UI.createView(Styles.secondaryNavBar);
        if (!opts) { opts = {}; }
        if(opts.backButtonHandler) {
            _backBtnOptions = _.clone(Styles.secondaryNavBarButton);
            _backBtnOptions.title = opts.backBtnText || LocalDictionary.back;

            _navBackButton = Titanium.UI.createButton(_backBtnOptions);
            _navBackButton.addEventListener('click', opts.backButtonHandler);
            _secondaryNavBar.add(_navBackButton);
            if (opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.leftFloat;
            }
        }
        
        _titleLabel = Titanium.UI.createLabel(Styles.secondaryNavBarLabel);
        _titleLabel.text = opts.title ? opts.title : ' ';
        if (opts.btnFloatLeft) {
            _titleLabel.left = Styles.secondaryNavBarLabel.buttonLeftFloat;
        }
        _secondaryNavBar.add(_titleLabel);
        _secondaryNavBar.updateTitle = function (newTitle) {
            _titleLabel.text = newTitle;
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            var _visibility = _secondaryNavBar.visible;
            Ti.API.debug("visibility of secondaryNavBar: " + _visibility);
            _titleLabel.width = Styles.secondaryNavBarLabel.width;
            if (_navBackButton && !opts.btnFloatLeft) {
                _navBackButton.left = Styles.secondaryNavBarButton.left;
            }
            _secondaryNavBar.width = Styles.secondaryNavBar.width;
            _secondaryNavBar.visible = _visibility || true;
        });
        
        return _secondaryNavBar;
    };
    
    this.createDisposableActivityIndicator = function () {
        var messageLabel, resetActivityIndicator,
            indicator = {view: Ti.UI.createView(Styles.globalActivityIndicator)},
            dialog = Ti.UI.createView(Styles.activityIndicatorDialog);

        indicator.view.add(dialog);
        
        messageLabel = Ti.UI.createLabel(Styles.activityIndicatorMessage);
        messageLabel.text = LocalDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.setLoadingMessage = function (m) {
            if (typeof m == 'string') {
                messageLabel.text = m;
            }
            else {
                Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.destroy = function () {
            Ti.API.debug("Destroy activity indicator");
            Ti.App.removeEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);
        };
        
        indicator.resetDimensions = function () {
            indicator.view.top = Styles.globalActivityIndicator.top;
            indicator.view.height = Styles.globalActivityIndicator.height;
            indicator.view.width = Styles.globalActivityIndicator.width;
            dialog.width = Styles.activityIndicatorDialog.width;
        };
        resetActivityIndicator = function (e) {
            indicator.resetDimensions();
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);
        
        return indicator;
    };
    
    this.createActivityIndicator = function () {
        var messageLabel,
            indicator = Ti.UI.createView(Styles.globalActivityIndicator),
            dialog = Ti.UI.createView(Styles.activityIndicatorDialog);

        indicator.add(dialog);
        
        messageLabel = Ti.UI.createLabel(Styles.activityIndicatorMessage);
        messageLabel.text = LocalDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.setLoadingMessage = function (m) {
            if (typeof m == 'string') {
                messageLabel.text = m;
            }
            else {
                Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.resetDimensions = function () {
            indicator.top = Styles.globalActivityIndicator.top;
            indicator.height = Styles.globalActivityIndicator.height;
            indicator.width = Styles.globalActivityIndicator.width;
            dialog.width = Styles.activityIndicatorDialog.width;
        };
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            indicator.resetDimensions();
        });
        
        return indicator;
    };
    
    this.onOrientationChange = function (e) {
        Device.setCurrentOrientation(e.orientation);
        app.styles = new Styles(app);
        Ti.App.fireEvent(app.events['STYLESHEET_UPDATED']);
        Ti.App.fireEvent(app.events['DIMENSION_CHANGES'], {orientation: e.orientation});
    };
    
    init();
};