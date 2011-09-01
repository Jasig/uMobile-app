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
/*
** @constructor
*/
var PortalProxy = function (facade) {
    var app = facade, _self = this;
    
    this._variables = {
        currentState: PortalProxy.states['INITIALIZED'],
        isGuestLayout: true,
        isPortalReachable: false,
        portlets: [],
        pathToRoot: '../../'
    };
    
    this.getShowPortletFunc = function (portlet) {
        //Returns a function to the PortalWindowController to open the appropriate window 
        //when an icon is clicked in the home screen grid.

        Ti.API.debug("getShowPortletFunc() in PortalProxy");
        return function () {
            if (portlet.url) {
                Ti.API.debug("portlet.url exists in getShowPortletFunc() in PortalProxy");
                app.models.windowManager.openWindow(app.controllers.portletWindowController.key, portlet);
            } 
            else {
                Ti.API.debug("portlet.url doesn't exist in getShowPortletFunc() in PortalProxy");
                app.models.windowManager.openWindow(portlet.window);
            }
        };
    };

    this.getPortlets = function () {
        Ti.API.debug("getPortlets() in PortalProxy");
        return _self._variables.portlets;
    };
    
    this.setPortlets = function (_portlets) {
        Ti.API.debug("setPortlets() in PortalProxy. Portlets: " + JSON.stringify(_portlets));
        var nativeModules = app.config.getLocalModules(), module;
        _self._variables.portlets = _portlets;

        for (module in nativeModules) {
            if (nativeModules.hasOwnProperty(module)) {
                nativeModules[module].added = false;
            }
        }
        for (var i = 0, iLength = _self._variables.portlets.length; i<iLength; i++ ) {
            if(nativeModules[_self._variables.portlets[i].fname]) {
                Ti.API.info("We have a match for " + _self._variables.portlets[i].fname + ", and it is: " + JSON.stringify(nativeModules[_self._variables.portlets[i].fname]));
                _self._variables.portlets[i] = nativeModules[_self._variables.portlets[i].fname];
                nativeModules[_self._variables.portlets[i].fname].added = true;
            }
        }

        for (module in nativeModules) {
            if (nativeModules.hasOwnProperty(module)) {
                Ti.API.info("Remaining module: " + JSON.stringify(nativeModules[module]));
                if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                    // As long as the module has a title, hasn't already been added, and doesn't 
                    // require the fname for the module to be returned in the personalized layout.
                    _self._variables.portlets.push(nativeModules[module]);
                }
                else {
                    Ti.API.debug("Ignoring this prototype artifact in nativeModules: " + JSON.stringify(nativeModules[module]));
                }                        
            }
        }

        _self._variables.portlets.sort(_self._sortPortlets);
        
        //Set the state of the portal proxy. Assume local portlets only if _portlets.length < 1
        _self.setState(PortalProxy.states[_portlets.length > 0 ? 'PORTLETS_LOADED' : 'PORTLETS_LOADED_LOCAL']);
        Ti.App.fireEvent(PortalProxy.events['PORTLETS_LOADED'],{state: _self.getState()});
    };

    this.getPortletByFName = function (fname) {
    	for (var i=0, iLength = _self._variables.portlets.length; i<iLength; i++ ) {
    		if (_self._variables.portlets[i].fname === fname) {
    			return _self._variables.portlets[i];
    		}
    	}
    	return false;
    };

    this._sortPortlets = function(a, b) {
        if (!a.title || !b.title) {
            Ti.API.error("Missing a title for one of these:" + JSON.stringify(a) + " & " + JSON.stringify(b));
            return -1;
        }
        // get the values for the configured property from 
        // each object and transform them to lower case
        var aprop = a.title.toLowerCase();
        var bprop = b.title.toLowerCase();

        // if the values are identical, indicate an equals
        if (aprop === bprop) {
            return 0;
        }

        // otherwise perform a normal alphabetic sort
        if (aprop > bprop) {
            return 1;
        } else {
            return -1;
        }

    };

    this.getIconUrl = function (p) {
        var _iconUrl;

        if (app.models.resourceProxy.getPortletIcon(p.fname)) {
            _iconUrl = app.models.resourceProxy.getPortletIcon(p.fname);
        }
        else if (p.iconUrl && p.iconUrl.indexOf('/') == 0) {
            _iconUrl = app.config.BASE_PORTAL_URL + p.iconUrl;
        } 
        else if (p.iconUrl) {
            _iconUrl = _self._variables.pathToRoot + p.iconUrl;
        } 
        else {
            _iconUrl = app.config.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
        }

        return _iconUrl;
    };

    this._loadPortletList = function() {
        Ti.API.debug('loadPortletList() in PortalProxy');
        var layoutUrl, layoutClient, layoutText,
            onRequestComplete, onRequestError, onGetPortletsComplete, onGetPortletsError;

            onGetPortletsComplete = function (e) {
                Ti.API.debug('onGetPortletsComplete with responseHeader: ' + layoutClient.getResponseHeader('Content-Type'));
                Ti.API.debug('Layout for user: ' + layoutClient.responseText);
                var responseJSON;
                _self.setIsPortalReachable(true);
                responseJSON = JSON.parse(layoutClient.responseText);
                if (responseJSON.user === app.models.userProxy.getCredentials().username || !app.models.userProxy.getCredentials().username) {
                    _self.setPortlets(responseJSON.layout);
                }
            };

            onGetPortletsError = function (e) {
                Ti.API.debug("onGetPortletsError() in PortalProxy");
                var nativeModules = app.config.getLocalModules(), module;
                
                Ti.App.fireEvent(PortalProxy.events['PORTLETS_RETRIEVED_FAILURE']);

                _self._variables.portlets = [];

                for (module in nativeModules) {
                    if (nativeModules.hasOwnProperty(module)) {
                        nativeModules[module].added = false;
                    }
                }

                for (module in nativeModules) {
                    if (nativeModules.hasOwnProperty(module)) {
                        Ti.API.info("Remaining module: " + JSON.stringify(nativeModules[module]));
                        if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                            // As long as the module has a title, hasn't already been added, and doesn't 
                            // require the fname for the module to be returned in the personalized layout.
                            _self._variables.portlets.push(nativeModules[module]);
                        }
                        else {
                            Ti.API.debug("Ignoring this prototype artifact in nativeModules: " + JSON.stringify(nativeModules[module]));
                        }                        
                    }
                }

                _self._variables.portlets.sort(_self._sortPortlets);
                Ti.App.fireEvent(PortalProxy.events['PORTLETS_LOADED'], {user: ''});
                _self.setIsPortalReachable(false);
                Ti.App.fireEvent(PortalProxy.events['NETWORK_ERROR'], {message: app.localDictionary.couldNotConnectToPortal});

            };

        // Send a request to uPortal's main URL to get a JSON representation of the
        // user layout
        layoutUrl = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + "/layout.json";
        layoutClient = Titanium.Network.createHTTPClient({
            onload: onGetPortletsComplete,
            onerror: onGetPortletsError
        });
        if (app.models.deviceProxy.isAndroid()) {
            layoutClient.timeout = 15000;
        }
        layoutClient.open('GET', layoutUrl, true);
        layoutClient.send();
    };

    this.getPortletsForUser = function() {
        var _portlets;

        Ti.App.fireEvent(PortalProxy.events['GETTING_PORTLETS']);

        // Get the module list for this user from the portal server and create a 
        // layout based on this list.
        _portlets = _self._loadPortletList();
    };

    this.getIsPortalReachable = function () {
        return _self._variables.isPortalReachable;
    };

    this.setIsPortalReachable = function (newval) {
        Ti.API.debug('setIsPortalReachable() in PortalProxy. val: ' + newval);
        if (typeof newval == "boolean") {
            _self._variables.isPortalReachable = newval;
        }
        else {
            Ti.API.error("Couldn't set value of _isPortalReachable, wasn't type 'boolean' but was type: " + typeof newval);
        }
    };
    
    this.setState = function (_state) {
        for (var state in PortalProxy.states) {
            if (PortalProxy.states.hasOwnProperty(state)) {
                if (PortalProxy.states[state] === _state) {
                    _self._variables.currentState = _state;
                }
            }
        }
        Ti.API.debug("PortalProxy state set to:" + _self.getState());
    };
    
    this.getState = function () {
        return _self._variables.currentState;
    };

};

//Implemented as a static object so other scripts can access before an instance of the proxy exists.
PortalProxy.events = {
    GETTING_PORTLETS            : 'PortalProxyGettingPortlets',
    PORTLETS_RETRIEVED_SUCCESS  : 'PortalProxyPortletsRetrievedSuccess',
    PORTLETS_RETRIEVED_FAILURE  : 'PortalProxyPortletsRetrievedFailure',
    PORTLETS_LOADED             : 'PortalProxyPortletsLoaded', //When portlets are sorted, organized, ready to use
    NETWORK_ERROR               : 'PortalProxyNetworkError'
};
PortalProxy.states = {
    INITIALIZED             : "Initialized",
    PORTLETS_LOADED         : "PortletsLoaded",
    PORTLETS_LOADED_LOCAL   : "PortletsLoadedLocal",
    PORTLETS_LOADING        : "PortletsLoading"
};