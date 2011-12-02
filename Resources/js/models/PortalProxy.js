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
//Implemented as a static object so other scripts can access before an instance of the proxy exists.
exports.events = {
    GETTING_PORTLETS            : 'PortalProxyGettingPortlets',
    PORTLETS_RETRIEVED_SUCCESS  : 'PortalProxyPortletsRetrievedSuccess',
    PORTLETS_RETRIEVED_FAILURE  : 'PortalProxyPortletsRetrievedFailure',
    PORTLETS_LOADED             : 'PortalProxyPortletsLoaded', //When portlets are sorted, organized, ready to use
    NETWORK_ERROR               : 'PortalProxyNetworkError'
};
exports.states = {
    INITIALIZED             : "Initialized",
    PORTLETS_LOADED         : "PortletsLoaded",
    PORTLETS_LOADED_LOCAL   : "PortletsLoadedLocal",
    PORTLETS_LOADING        : "PortletsLoading"
};

var currentState = exports.states['INITIALIZED'],
isPortalReachable = false,
portlets = [],
pathToRoot = '../../';

exports.retrieveShowPortletFunc = function (portlet) {
    //Returns a function to the PortalWindowController to open the appropriate window 
    //when an icon is clicked in the home screen grid.
    return function () {
        if (portlet.url) {
            app.models.windowManager.openWindow(app.config.PORTLET_KEY, portlet);
        } 
        else {
            app.models.windowManager.openWindow(portlet.window);
        }
    };
};

exports.retrievePortlets = function () {
    return portlets;
};

exports.savePortlets = function (_portlets) {
    var nativeModules = app.config.retrieveLocalModules(), module;
    portlets = _portlets;

    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {
            nativeModules[module].added = false;
        }
    }
    for (var i = 0, iLength = portlets.length; i<iLength; i++ ) {
        if(nativeModules[portlets[i].fname]) {
            portlets[i] = nativeModules[portlets[i].fname];
            nativeModules[portlets[i].fname].added = true;
        }
    }

    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {

            if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                // As long as the module has a title, hasn't already been added, and doesn't 
                // require the fname for the module to be returned in the personalized layout.
                portlets.push(nativeModules[module]);
            }
        }
    }

    portlets.sort(exports._sortPortlets);
    
    //Set the state of the portal proxy. Assume local portlets only if _portlets.length < 1
    exports.saveState(exports.states[_portlets.length > 0 ? 'PORTLETS_LOADED' : 'PORTLETS_LOADED_LOCAL']);
    Ti.App.fireEvent(exports.events['PORTLETS_LOADED'],{state: exports.retrieveState()});
};

exports.retrievePortletByFName = function (fname) {
	for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
		if (portlets[i].fname === fname) {
			return pathToRoot[i];
		}
	}
	return false;
};

exports._sortPortlets = function(a, b) {
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

exports.retrieveIconUrl = function (p) {
    var _iconUrl;

    if (app.models.resourceProxy.retrievePortletIcon(p.fname)) {
        _iconUrl = app.models.resourceProxy.retrievePortletIcon(p.fname);
    }
    else if (p.iconUrl && p.iconUrl.indexOf('/') == 0) {
        _iconUrl = app.config.BASE_PORTAL_URL + p.iconUrl;
    } 
    else if (p.iconUrl) {
        _iconUrl = pathToRoot + p.iconUrl;
    } 
    else {
        _iconUrl = app.config.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
    }

    return _iconUrl;
};

exports.retrieveIsPortalReachable = function () {
    return isPortalReachable;
};

exports.saveIsPortalReachable = function (newval) {
    if (typeof newval == "boolean") {
        isPortalReachable = newval;
    }
    else {
        Ti.API.error("Couldn't set value of _isPortalReachable, wasn't type 'boolean' but was type: " + typeof newval);
    }
};

exports.saveState = function (_state) {
    for (var state in exports.states) {
        if (exports.states.hasOwnProperty(state)) {
            if (exports.states[state] === _state) {
                currentState = _state;
            }
        }
    }
};

exports.retrieveState = function () {
    return currentState;
};