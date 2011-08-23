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
        Ti.API.debug("init() in PortletWindowController");
        _self.key = 'portlet';
        _self._initialized = true;
    };
    
    this.close = function () {
        Ti.API.info("close() in PortletWindowController");
        if (_self._webView && _self._app.models.deviceProxy.isAndroid()) {
            _self._webView.url = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/blank.html').nativePath;
        }
        if (_self._win) {
        	_self._removeAndroidBackListener();
            _self._win.close();
        }
    };
    
    this.open = function (portlet) {
        Ti.API.debug("open() in PortletWindowController");
        
        if (portlet) {
            _self._activePortlet = portlet;
        }
        else {
            Ti.API.error("No portlet was passed to includePortlet() in PortletWindowController");
            _self._app.models.windowManager.openWindow(_self._app.controllers.portalWindowController.key);
            return;
        }
        
        _self._win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            key: 'portlet',
            backgroundColor: _self._app.styles.backgroundColor,
            exitOnClose: false,
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
        _self._win.open();
        
        _self._titleBar = _self._app.UI.createTitleBar({
            title: portlet.title,
            settingsButton: false,
            homeButton: true
        });
        
        // initialize navigation bar for URLs outside the portal
        _self._navBar = _self._app.UI.createSecondaryNavBar({
            backButton: true,
            backButtonHandler: _self._onBackBtnPress,
            btnFloatLeft: true
        });
        _self._navBar.top = 40;
        _self._navBar.visible = false;

        _self._activityIndicator = _self._app.UI.createActivityIndicator();
        _self._activityIndicator.hide();

        _self._win.add(_self._titleBar);
        _self._win.add(_self._navBar);
        if (_self._app.models.deviceProxy.isIOS() || !_self._webView) {
            Ti.API.debug("The device is iOS or there isn't a webView yet");
            _self._webView = Titanium.UI.createWebView(_self._app.styles.portletView);
            _self._webView.scalePageToFit = true;
            _self._webView.addEventListener('load', _self._onPortletLoad);
            _self._webView.addEventListener('beforeload', _self._onPortletBeforeLoad);
            _self._webView.hide();
        }
        else {
            Ti.API.debug("It's Android and there's already a webview");
            try {
                _self._win.remove(_self._webView);
            }
            catch (e) {
                Ti.API.error("Couldn't remove webview: " + JSON.stringify(e));
            }
        }
        _self._webView.visible = false;
        _self._win.add(_self._webView);
        _self._win.add(_self._activityIndicator);
        
        _self._includePortlet(_self._activePortlet);

        Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], function (e) {
            if (!_self._isHome()) {
                _self._navBar.visible = true;
                _self._webView.top = _self._titleBar.height + _self._navBar.height;
                _self._webView.height = _self._win.height - _self._titleBar.height - _self._navBar.height;
            }
            else {
                Ti.API.info("Webview can't go back");
                _self._webView.top = _self._titleBar.height;
                _self._webView.height = _self._win.height - _self._titleBar.height;
            }
        });
    };
    
    this._includePortlet = function (portlet) {
        Ti.API.debug("includePortlet() in PortletWindowController");
        _self._webView.visible = false;
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.loading);
        _self._activityIndicator.show();
        
        _self._homeURL = _self._getQualifiedURL(portlet.url);
        _self._homeFName = _self._getFNameFromURL(portlet.url);
        Ti.API.debug("_homeFName in PortletWindowController is " + _self._homeFName);
        _self._webView.url = _self._homeURL;
        
        _self._titleBar.updateTitle(portlet.title);
    };
    
    this._getFNameFromURL = function (url) {
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

        //We only need to check the session if it's a link to the portal.
        isValidSession = _self._app.models.loginProxy.isValidWebViewSession();
        if (!isValidSession) {
            Ti.API.debug("!isValidSession in getLocalUrl()");
            _self._app.models.loginProxy.getLoginURL(url);
            localUrl = _self._app.models.loginProxy.getLoginURL(url);
        }
        else {
            Ti.API.debug("isValidSession in getLocalUrl()");
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
        }
        return localUrl;
    };
    
    this._getQualifiedURL = function (url) {
        Ti.API.debug("getQualifiedURL() in PortletWindowController");
        var _url;
        if (url.indexOf('/') == 0) {
            Ti.API.debug("Portlet URL is local");
            if (_self._app.models.sessionProxy.validateSessions()[LoginProxy.sessionTimeContexts.WEBVIEW]) {
                Ti.API.debug("Session is active in getQualifiedURL()");
                _url = _self._getLocalUrl(url);
            }
            else {
                Ti.API.debug("Session is NOT active in getQualifiedURL(): " + JSON.stringify(_self._app.models.sessionProxy.validateSessions()));
                _url = _self._app.models.loginProxy.getLoginURL(url);
            }
            _self._webView.externalModule = false;
            _self._webView.top = _self._titleBar.height;
        }
        else {
            Ti.API.debug("Portlet URL is external in getQualifiedURL()");
            _url = url;
            _self._webView.externalModule = true;
        }
        
        return _url;
    };
    
    this._onPortletBeforeLoad = function (e) {
        Ti.API.debug("onPortletBeforeLoad() in PortletWindowController" + _self._webView.url);

        if (_self._app.models.deviceProxy.isAndroid()) {
            _self._webView.hide();
        }
        //We want to make sure we don't need to re-establish a session.
        if (_self._webView.url !== _self._getQualifiedURL(_self._webView.url)) {
            _self._webView.stopLoading();
            _self._webView.url = _self._getQualifiedURL(_self._webView.url);
        }
        else if (e.url.indexOf('http://m.youtube.com') === 0 && _self._app.models.deviceProxy.isAndroid()) {
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
        _self._activityIndicator.show();
    };
    
    this._onBackBtnPress = function (e) {
        _self._webView.goBack();
    };
    
    this._onAndroidBack = function (e) {
    	Ti.API.debug("onAndroidBack() in PortletWindowController");
    	_self._webView.goBack();
    };
    
    this._onPortletLoad = function (e) {
        var portalIndex = e.url.indexOf(_self._app.config.BASE_PORTAL_URL);
        Ti.API.debug("onPortletLoad() in PortletWindowController, index: " + portalIndex);
        _self._webView.show();
        
        _self._activityIndicator.hide();
        
        if (portalIndex >= 0) {
            Ti.API.debug("Visiting a portal link");
            Ti.App.fireEvent(ApplicationFacade.events['SESSION_ACTIVITY'], {context: LoginProxy.sessionTimeContexts.WEBVIEW});
            //We want to be able to open any video now, so we'll clear the YouTube workaround variable
            _self._lastVideoOpened = '';
            _self._webView.externalModule = false;
            _self._navBar.visible = false;
            _self._webView.top = _self._titleBar.height;
            _self._webView.height = _self._win.height - _self._titleBar.height;
            _self._app.models.loginProxy.updateSessionTimeout(_self._app.models.loginProxy.sessionTimeContexts.WEBVIEW);
            if (_self._isHome()) {
                _self._removeAndroidBackListener();
            }
        }
        else {
            Ti.API.debug("Visiting an external link. Webview.url = " + _self._webView.url + " & e.url = " + e.url);
            _self._webView.externalModule = true;
            if (!_self._isHome(e)) {
                _self._navBar.visible = true;
                _self._webView.top = _self._titleBar.height + _self._navBar.height;
                _self._webView.height = _self._win.height - _self._titleBar.height - _self._navBar.height;
                _self._addAndroidBackListener();
            }
            else {
                Ti.API.info("Webview can't go back");
                _self._webView.top = _self._titleBar.height;
                _self._webView.height = _self._win.height - _self._titleBar.height;
                _self._removeAndroidBackListener();
            }
        }
        
        _self._webView.show();
        _self._activityIndicator.hide();
    };
    
    this._isHome = function (e) {
        Ti.API.debug('isHome() in PortletWindowController');
        var _newURL, treatAsLocalhost;
        
        //For the iOS simulator, the e.url and webView.url don't consistently contain localhost, so we need to work around it.
        treatAsLocalhost = function (_url) {
        	return _url.replace('file://', 'file://localhost');
        };
        
        // New URL will ideally be the event object url (more consistent)
        // If localhost is in the base URL (simulator), we will use webview.url because the
        // e object doesn't contain localhost in the path.
        _newURL = e ? (_self._homeURL.indexOf('file://') > -1 && _self._app.models.deviceProxy.isIOS()) ? treatAsLocalhost(e.url) : e.url : _self._webView.url;
        
        //It's either a portlet (with an fname) or not
        //If _homeFName is defined, we'll see if the user is viewing the portlet
        //otherwise we'll check the URL for a match
        
        Ti.API.debug(" Checking this condition: if ((_homeFName && getFNameFromURL(e ? e.url : webView.url) === _homeFName) || (!_homeFName && (e ? e.url : webView.url) === _homeURL))");
        Ti.API.debug('_homeFName: ' + _self._homeFName + ' & getFNameFromURL(): ' + _self._getFNameFromURL(_newURL) + ' & _newURL: ' + _newURL + ' & _homeURL: ' + _self._homeURL);
        
    	if ((_self._homeFName && _self._getFNameFromURL(_newURL) === _self._homeFName) || (!_self._homeFName && _newURL === _self._homeURL)) {
			return true;
		}
    	return false;
    };
    
    this._addAndroidBackListener = function () {
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