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


var _activePortlet, _homeURL, _currentURL, _homeFName, app, config, styles, deviceProxy, localDictionary,
_lastVideoOpened = '', 
_ = require('/js/libs/underscore-min'),
_isListeningForAndroidBack = false,
_win, _activityIndicator, _titleBar, _navBar,_webView;

exports.open = function (portlet) {
    /*
        The open method is concerned with creating the UI for viewing web-based portlets.
        This method isn't called until the user has selected a webview-based portlet
        from the home screen.
    */
    app = require('/js/Constants');
    config = require('/js/config');
    styles = require('/js/style');
    deviceProxy = require('/js/models/DeviceProxy');
    localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];
    
    if (portlet) {
        _activePortlet = portlet;
    }
    else {
        Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.HOME_KEY});
        return;
    }
    
    _createView(portlet);
    
    _includePortlet(_activePortlet);
};

exports.close = function () {
    //Set the webview to blank.html if Android, otherwise leave it.
    app = null;
    config = null;
    styles = null;
    deviceProxy = null;
    localDictionary = null;
    
    try {
        _webView.removeEventListener('load', _onPortletLoad);
        _webView.removeEventListener('beforeload', _onPortletBeforeLoad);
    }
    catch (e) {
        Ti.API.error("Couldn't remove events.");
    }
	_removeAndroidBackListener();
	_destroyView();
    _win.close();
};

exports.rotate = function (orientation) {
    
};

function _createView (portlet) {
    /*
        This method creates and arranges the view for the Controller, to keep the 
        open() method simpler and more focused on business logic than view logic.
    */
    _win = Titanium.UI.createWindow(styles.portletWindow);
    _win.open();

    _activityIndicator = require('/js/views/UI/ActivityIndicator').createActivityIndicator();
    _win.add(_activityIndicator.view);
    _activityIndicator.view.hide();

    _titleBar = require('/js/views/UI/TitleBar').createTitleBar();
    _titleBar.updateTitle(portlet.title);
    _titleBar.addHomeButton();
    _win.add(_titleBar.view);
    
    // initialize navigation bar for URLs outside the portal
    _navBar = require('/js/views/UI/SecondaryNav').createSecondaryNav();
    _navBar.leftButton.addEventListener('click', _onBackBtnPress);
    _navBar.rightButton.hide();
    _navBar.rightButton.visible = false;
    _navBar.view.top = '40dp';
    _navBar.view.visible = false;
    
    _win.add(_navBar.view);
    
    _webView = Titanium.UI.createWebView(styles.portletView);
    _win.add(_webView);
    _webView.addEventListener('load', _onPortletLoad);
    _webView.addEventListener('beforeload', _onPortletBeforeLoad);
    _webView.addEventListener('request', function (e) {
        if (e.url.indexOf('/s/') > -1) {
            //Check if the loading URL should be opened natively, if an intent has been registered for it.
            if (broadcastMessage(e.url)) _webView.stopLoading();
        }
    });
    
    _webView.scalePageToFit = true;
    _webView.validatesSecureCertificate = false;
    
    _webView.hide();

    
    
};
function _destroyView () {
    if (_navBar) _navBar.leftButton.removeEventListener('click', _onBackBtnPress);
    _navBar = null;
    _activityIndicator = null;
    _titleBar = null;
};

function _includePortlet (portlet) {
    /*
        This is the primary method for beginning the process of loading
        any web-based module. It sets some local variables based on the
        portlet to be included, and sets the url property of the webView
        to start it loading the page.
    */
    var _isValidSession;
    
    _activityIndicator.setLoadingMessage(localDictionary.loading);
    _activityIndicator.view.show();
    
    _homeURL = _webView.url = _currentURL = _getAbsoluteURL(portlet.url);
    _homeFName = exports.parseFNameFromURL(portlet.url);
    
    _titleBar.updateTitle(portlet.title);
};

exports.parseFNameFromURL = function (url) {
	if (url.indexOf('/' === 0 || url.indexOf(config.BASE_PORTAL_URL))) {
		var _urlParts = url.split('/');
		for (var i = 0, iLength = _urlParts.length; i<iLength; i++) {
			if (_urlParts[i] === 'p') {
				return _urlParts[i+1].split('.')[0];
			}
		}
	}
	return false;
};

function _getLocalUrl (url) {
    var localUrl, isValidSession;
    /*
    This method determines if a session is valid for the webview, and will
    either modify the URL and load, or will load the URL as-is if session is active.
    This method only returns a URL, doesn't actually set the url property of the webview.
    */
    
    if (!deviceProxy.checkNetwork()) return false;
    
    if (url.indexOf('/') === 0) {
        var newUrl = config.BASE_PORTAL_URL + url;
        localUrl = newUrl;
    }
    else {
        localUrl = url;
    }
    
    return localUrl;
};

function _getAbsoluteURL (url) {
    /*
        This method is used when accessing portal links that require authentication,
        to determine (based on session timers in the app) if the user is already 
        logged in or if they need to be automatically logged in again.
        
        It does its best to abstract different login methods, by asking the loginProxy
        what the Login URL should be. However, to automate the process, there will need
        to be some process-specific logic in this controller.
    */
    var _url;
    if (url.indexOf('/') == 0) {
        _url = _getLocalUrl(url);
        _webView.externalModule = false;
        _webView.top = styles.titleBar.height + 'dp';
    }
    else {
        _url = url;
        _webView.externalModule = true;
    }
    
    return _url;
};

function broadcastMessage (url) {
    /*
        This method is called when a link in the webview is clicked if
        if contains a special code indicating that the uMobile native
        application should handle the link natively.
        If no callback is registered for the intent, the broadcast 
        method returns false so the WebView can load the content itself.
    */
    var parameters = {},
    rawParamArray = url.split('?')[1].split('&');
    
    _.each(rawParamArray, function (item, index, list){
        parameters[item.split('=')[0]] = item.split('=')[1];
    });
    
    var intent = url.split('/s/')[1].split('?')[0];
    
    return require('/js/models/AppMessageManager').broadcast(intent, parameters);
}

function _onPortletBeforeLoad (e) {
    if (_webView.url !== _getAbsoluteURL(_webView.url)) {
        _webView.stopLoading();
        _webView.url = _getAbsoluteURL(_webView.url);
    }
    else if (e.url.indexOf('http://m.youtube.com') === 0 && deviceProxy.isAndroid()) {
        /*
            Android had/has a bug that won't play youTube videos inside of a webView,
            so we want to broadcast an intent outside of our app for the OS to handle
            the url. This will usually give a choice between opening the video in the
            native YouTube app or the Browser.
        */
    	var _URLToOpen = e.url, _params = e.url.split('?')[1].split('&');
    	_webView.stopLoading();

    	for (var i=0, iLength = _params.length; i<iLength; i++) {
    		if (_params[i].indexOf('desktop_uri') > -1) {
    			_URLToOpen = _params[i].split('=', 2)[1];
    			_URLToOpen = decodeURIComponent(_URLToOpen);
    			break;
    		}
    	}
    	if (_URLToOpen !== _lastVideoOpened) {
    	    _webView.stopLoading();
            Ti.Platform.openURL(_URLToOpen);
            //Set the last video to this, so that it doesn't try to broadcast the intent twice.
            _lastVideoOpened = _URLToOpen;
    	}
    	if (e.url.indexOf('http://m.youtube.com') === 0 && _homeFName === 'videos') _webView.url = _homeURL;
    }
    _activityIndicator.setLoadingMessage(localDictionary.loading);
    _activityIndicator.view.show();
};

function _onBackBtnPress (e) {
    _webView.goBack();
};

function _onAndroidBack (e) {
    // Responds to hardware back button press
	_webView.goBack();
};
function resizeAndPositionWebView () {
    _webView.externalModule = _isPortal() ? false : true;

    var _shouldNotShowBackBtn = _isHome() || _isPortal();
    if (_navBar) _navBar.view[_shouldNotShowBackBtn ? 'hide' : 'show']();
    _webView.top = _shouldNotShowBackBtn ? styles.titleBar.height + 'dp': styles.titleBar.height + styles.secondaryNavBar.getHeight + 'dp' ;
}
function _onPortletLoad (e) {
    /*
        Once the webView is done loading, we want to take care of some business,
        such as determining whether to reset the webview session timer,
        and show the nav bar with back button
    */
    _webView.show();
    
    _currentURL = e.url;
    
    if (_isPortal()) Ti.App.fireEvent(app.events['SESSION_ACTIVITY']);
    
    if (_isHome()) {
        _removeAndroidBackListener();
    } else {
        _addAndroidBackListener();
    }
    
    //We want to be able to open any video now, so we'll clear the YouTube workaround variable
    _lastVideoOpened = '';
    
    _activityIndicator.view.hide();
    resizeAndPositionWebView();
};
function _isPortal () { 
    /*
        This method is used to determine if the current URL is in the portal.
        Most commonly used to determine if a back button should be shown.
    */
    var _newURL, treatAsLocalhost;
    
    //See _isHome method for purpose of this method.
    treatAsLocalhost = function (_url) {
    	return _url.replace('file://', 'file://localhost');
    };
    _newURL = (_homeURL.indexOf('file://') > -1 && deviceProxy.isIOS()) ? treatAsLocalhost(_currentURL) : _currentURL;
    if (_newURL.indexOf(config.BASE_PORTAL_URL) > -1) {
		return true;
	}
	return false;
    
}
function _isHome () {
    /*
        This private method is used to determine if the current URL of the
        webView is the home URL (the url that was first loaded when the user
        opened the module/portlet). This is primarily used to determine if the
        back button should be displayed or not.
    */
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
    _newURL = (_homeURL.indexOf('file://') > -1 && deviceProxy.isIOS()) ? treatAsLocalhost(_currentURL) : _currentURL;
    
    /*
        It's either a portlet (with an fname) or not
        If _homeFName is defined, we'll see if the user is viewing the portlet
        otherwise we'll check the URL for a match
    */
            
	if ((_homeFName && exports.parseFNameFromURL(_newURL) === _homeFName) || (!_homeFName && _newURL === _homeURL)) {
		return true;
	}
	return false;
};

function _addAndroidBackListener () {
    // Add listener for Android hardware back button
	if (!_isListeningForAndroidBack && deviceProxy.isAndroid()) {
		_win.addEventListener('android:back', _onAndroidBack);
		_isListeningForAndroidBack = true;
	}
};

function _removeAndroidBackListener () {
	if (_isListeningForAndroidBack && deviceProxy.isAndroid()) {
		try {
            _win.removeEventListener('android:back', _onAndroidBack);
			_isListeningForAndroidBack = false;
		}
		catch (e) {
			Ti.API.error("Couldn't remove android:back event listener in onPortletLoad()");
		}
	}
};