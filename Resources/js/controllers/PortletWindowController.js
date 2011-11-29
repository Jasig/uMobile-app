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

var PortletWindowController = function (facade) {
    var _self = this;

    //Pseudo private variables
    this._initialized;
    this._activePortlet;
    this._homeURL;
    this._currentURL;
    this._homeFName;
    this._lastVideoOpened = '';
    this._isListeningForAndroidBack = false;
    this._app = facade;
    
    //Pseudo private views
    this._win;
    this._activityIndicator;
    this._titleBar;
    this._navBar;
    this._webView;

    this._init = function () {
        _self.key = 'portlet';
        _self._initialized = true;
    };
    
    this.close = function () {
        //Set the webview to blank.html if Android, otherwise leave it.
        try {
            _self._webView.removeEventListener('load', _self._onPortletLoad);
            _self._webView.removeEventListener('beforeload', _self._onPortletBeforeLoad);
            Titanium.App.removeEventListener(app.events['DIMENSION_CHANGES'], _self._onDimensionChanges);
        }
        catch (e) {
            Ti.API.error("Couldn't remove events.");
        }
    	_self._removeAndroidBackListener();
    	_self._destroyView();
        _self._win.close();
    };
    
    this.open = function (portlet) {
        /*
            The open method is concerned with creating the UI for viewing web-based portlets.
            This method isn't called until the user has selected a webview-based portlet
            from the home screen.
        */
        if (portlet) {
            _self._activePortlet = portlet;
        }
        else {
            _self._app.models.windowManager.openWindow(_self._app.controllers.portalWindowController.key);
            return;
        }
        
        _self._createView(portlet);
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], _self._onDimensionChanges);
        
        _self._includePortlet(_self._activePortlet);
    };
    
    this._createView = function (portlet) {
        /*
            This method creates and arranges the view for the Controller, to keep the 
            open() method simpler and more focused on business logic than view logic.
        */
        _self._win = Titanium.UI.createWindow(_self._app.styles.portletWindow);
        _self._win.open();
        
        _self._titleBar = require('/js/views/UI/TitleBar');
        _self._titleBar.updateTitle(portlet.title);
        _self._titleBar.addHomeButton();
        _self._titleBar.addSettingsButton();
        
        // initialize navigation bar for URLs outside the portal
        _self._navBar = _self._app.UI.createDisposableSecondaryNavBar({
            backButton: true,
            backButtonHandler: _self._onBackBtnPress,
            btnFloatLeft: true
        });
        _self._navBar.view.top = 40;
        _self._navBar.view.visible = false;

        _self._activityIndicator = _self._app.UI.createDisposableActivityIndicator();
        _self._activityIndicator.view.hide();

        _self._win.add(_self._titleBar.view);
        _self._win.add(_self._navBar.view);
        
        if (_self._app.models.deviceProxy.isIOS() && typeof _self._webView === "undefined") {
            _self._webView = Titanium.UI.createWebView(_self._app.styles.portletView);
            _self._win.add(_self._webView);
            _self._webView.addEventListener('load', _self._onPortletLoad);
            _self._webView.addEventListener('beforeload', _self._onPortletBeforeLoad);
        }
        else {
            _self._webView = Titanium.UI.createWebView(_self._app.styles.portletView);
            _self._win.add(_self._webView);
            _self._webView.addEventListener('load', _self._onPortletLoad);
            _self._webView.addEventListener('beforeload', _self._onPortletBeforeLoad);
        }
        _self._webView.scalePageToFit = true;
        _self._webView.validatesSecureCertificate = false;
        
        _self._webView.hide();

        
        
        _self._win.add(_self._activityIndicator.view);
        
    };
    this._destroyView = function () {
        _self._navBar.destroy();
        _self._navBar = null;
        _self._activityIndicator.destroy();
        _self._activityIndicator = null;
        _self._titleBar.destroy();
        _self._titleBar = null;
    };
    
    this._includePortlet = function (portlet) {
        /*
            This is the primary method for beginning the process of loading
            any web-based module. It sets some local variables based on the
            portlet to be included, and sets the url property of the webView
            to start it loading the page.
        */
        var _isValidSession;
        
        Ti.API.debug("includePortlet() in PortletWindowController. Portlet: " + JSON.stringify(portlet));
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.loading);
        _self._activityIndicator.view.show();
        
        _self._homeURL = _self._webView.url = _self._currentURL = _self._getAbsoluteURL(portlet.url);
        _self._homeFName = _self.getFNameFromURL(portlet.url);
        
        _self._titleBar.updateTitle(portlet.title);
    };
    
    this.getFNameFromURL = function (url) {
    	if (url.indexOf('/' === 0 || url.indexOf(_self._app.config.BASE_PORTAL_URL))) {
    		var _urlParts = url.split('/');
    		for (var i = 0, iLength = _urlParts.length; i<iLength; i++) {
    			if (_urlParts[i] === 'p') {
    				return _urlParts[i+1].split('.')[0];
    			}
    		}
    	}
    	return false;
    };
    
    this._getLocalUrl = function (url) {
        var localUrl, isValidSession;
        Ti.API.debug("getLocalUrl() in SharedWebView");
        /*
        This method determines if a session is valid for the webview, and will
        either modify the URL and load, or will load the URL as-is if session is active.
        This method only returns a URL, doesn't actually set the url property of the webview.
        */

        if (!_self._app.models.deviceProxy.checkNetwork()) {
            return false;
        }

        if (url.indexOf('/') === 0) {
            Ti.API.info("Index of / in URL is 0");
            var newUrl = _self._app.config.BASE_PORTAL_URL + url;
            Ti.API.info(newUrl);
            localUrl = newUrl;
        }
        else {
            Ti.API.info("Index of / in URL is NOT 0");
            localUrl = url;
        }
        
        return localUrl;
    };
    
    this._getAbsoluteURL = function (url) {
        /*
            This method is used when accessing portal links that require authentication,
            to determine (based on session timers in the app) if the user is already 
            logged in or if they need to be automatically logged in again.
            
            It does its best to abstract different login methods, by asking the loginProxy
            what the Login URL should be. However, to automate the process, there will need
            to be some process-specific logic in this controller.
        */
        Ti.API.debug("getQualifiedURL() in PortletWindowController");
        var _url;
        if (url.indexOf('/') == 0) {
            _url = _self._getLocalUrl(url);
            _self._webView.externalModule = false;
            _self._webView.top = _self._titleBar.view.height;
        }
        else {
            _url = url;
            _self._webView.externalModule = true;
        }
        
        return _url;
    };
    
    this.getHomeFName = function () {
        return _self._homeFName;
    };
    
    this._onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + _self._webView.url);

        //We want to make sure we don't need to re-establish a session.
        if (_self._webView.url !== _self._getAbsoluteURL(_self._webView.url)) {
            _self._webView.stopLoading();
            _self._webView.url = _self._getAbsoluteURL(_self._webView.url);
        }
        else if (e.url.indexOf('http://m.youtube.com') === 0 && _self._app.models.deviceProxy.isAndroid()) {
            /*
                Android had/has a bug that won't play youTube videos inside of a webView,
                so we want to broadcast an intent outside of our app for the OS to handle
                the url. This will usually give a choice between opening the video in the
                native YouTube app or the Browser.
            */
        	var _URLToOpen = e.url, _params = e.url.split('?')[1].split('&');
        	_self._webView.stopLoading();

        	for (var i=0, iLength = _params.length; i<iLength; i++) {
        		Ti.API.info("iterating through url params");
        		if (_params[i].indexOf('desktop_uri') > -1) {
        			Ti.API.info("Found the desktop URI:" + _params[i]);
        			_URLToOpen = _params[i].split('=', 2)[1];
        			_URLToOpen = decodeURIComponent(_URLToOpen);
        			break;
        		}
        	}
        	Ti.API.info("Opening: " + _URLToOpen);
        	if (_URLToOpen !== _self._lastVideoOpened) {
        	    _self._webView.stopLoading();
                Ti.Platform.openURL(_URLToOpen);
                //Set the last video to this, so that it doesn't try to broadcast the intent twice.
                _self._lastVideoOpened = _URLToOpen;
        	}
        	if (e.url.indexOf('http://m.youtube.com') === 0) {
        	    Ti.API.debug("The WebView is YouTube: " + e.url);
        	    if (_self._homeFName === 'videos') {
        	        Ti.API.debug("_homeFName is 'videos', so loading the videos home URL");
        	        _self._webView.url = _self._homeURL;
        	    }
        	}
        	else {
        	    Ti.API.debug("The WebView isn't youtube: " + e.url);
        	}
        }
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.loading);
        _self._activityIndicator.view.show();
    };
    
    this._onDimensionChanges = function (e) {
        // Handle device rotation changes
        if (_self._isHome()) {
            Ti.API.info("Webview is home, can't go back");
            _self._navBar.view.visible = false;
            _self._webView.top = _self._titleBar.view.height;
            _self._webView.height = _self._win.height - _self._titleBar.view.height;
        }
        else {
            _self._navBar.view.visible = true;
            _self._webView.top = _self._titleBar.view.height + _self._navBar.view.height;
            _self._webView.height = _self._win.height - _self._titleBar.view.height - _self._navBar.view.height;
        }
    };
    
    this._onBackBtnPress = function (e) {
        _self._webView.goBack();
    };
    
    this._onAndroidBack = function (e) {
        // Responds to hardware back button press
    	_self._webView.goBack();
    };
    
    this._onPortletLoad = function (e) {
        /*
            Once the webView is done loading, we want to take care of some business,
            such as determining whether to reset the webview session timer,
            and show the nav bar with back button
        */
        Ti.API.debug("onPortletLoad() in PortletWindowController");
        var portalIndex = e.url.indexOf(_self._app.config.BASE_PORTAL_URL);

        _self._webView.show();
        _self._currentURL = e.url;
        
        _self._activityIndicator.view.hide();
        
        if (portalIndex >= 0) {
            Ti.API.debug("Visiting a portal link");
            Ti.App.fireEvent(app.events['SESSION_ACTIVITY'], {context: LoginProxy.sessionTimeContexts['WEBVIEW']});
            //We want to be able to open any video now, so we'll clear the YouTube workaround variable
            _self._lastVideoOpened = '';
            _self._webView.externalModule = false;
            _self._navBar.view.visible = false;
            _self._webView.top = _self._titleBar.view.height;
            _self._webView.height = _self._win.height - _self._titleBar.view.height;
            if (_self._isHome()) {
                _self._removeAndroidBackListener();
            }
        }
        else {
            Ti.API.debug("Visiting an external link. Webview.url = " + _self._webView.url + " & e.url = " + e.url);
            _self._webView.externalModule = true;
            if (!_self._isHome()) {
                _self._navBar.view.visible = true;
                _self._webView.top = _self._titleBar.view.height + _self._navBar.view.height;
                _self._webView.height = _self._win.height - _self._titleBar.view.height - _self._navBar.view.height;
                _self._addAndroidBackListener();
            }
            else {
                Ti.API.info("Webview can't go back");
                _self._webView.top = _self._titleBar.view.height;
                _self._webView.height = _self._win.height - _self._titleBar.view.height;
                _self._removeAndroidBackListener();
            }
        }
    };
    
    this._isHome = function () {
        /*
            This private method is used to determine if the current URL of the
            webView is the home URL (the url that was first loaded when the user
            opened the module/portlet). This is primarily used to determine if the
            back button should be displayed or not.
        */
        Ti.API.debug('isHome() in PortletWindowController');

        var _newURL, treatAsLocalhost;
        
        /*
            For the iOS simulator, the e.url and webView.url don't 
            consistently contain localhost, so we need to work around it.
        */
        treatAsLocalhost = function (_url) {
        	return _url.replace('file://', 'file://localhost');
        };
        /*
            New URL will ideally be the event object url (more consistent)
            If localhost is in the base URL (simulator), we will use webview.url 
            because the e object doesn't contain localhost in the path.
        */
        _newURL = (_self._homeURL.indexOf('file://') > -1 && _self._app.models.deviceProxy.isIOS()) ? treatAsLocalhost(_self._currentURL) : _self._currentURL;
        
        /*
            It's either a portlet (with an fname) or not
            If _homeFName is defined, we'll see if the user is viewing the portlet
            otherwise we'll check the URL for a match
        */
                
    	if ((_self._homeFName && _self.getFNameFromURL(_newURL) === _self._homeFName) || (!_self._homeFName && _newURL === _self._homeURL)) {
			return true;
		}
    	return false;
    };
    
    this._addAndroidBackListener = function () {
        // Add listener for Android hardware back button
    	if (!_self._isListeningForAndroidBack && _self._app.models.deviceProxy.isAndroid()) {
    		_self._win.addEventListener('android:back', _self._onAndroidBack);
    		_self._isListeningForAndroidBack = true;
    	}
    };
    
    this._removeAndroidBackListener = function () {
    	if (_self._isListeningForAndroidBack && _self._app.models.deviceProxy.isAndroid()) {
    		try {
	            _self._win.removeEventListener('android:back', _self._onAndroidBack);
				_self._isListeningForAndroidBack = false;
			}
			catch (e) {
				Ti.API.error("Couldn't remove android:back event listener in onPortletLoad()");
			}
    	}
    };
    
    if (!_self._initialized) {
        _self._init();
    }
};