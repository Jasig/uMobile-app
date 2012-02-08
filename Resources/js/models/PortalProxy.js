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

exports.states = {
    INITIALIZED             : "Initialized",
    PORTLETS_LOADED         : "PortletsLoaded",
    PORTLETS_LOADED_LOCAL   : "PortletsLoadedLocal",
    PORTLETS_LOADING        : "PortletsLoading"
};

var currentState = exports.states['INITIALIZED'],
isPortalReachable,
app = require('/js/Facade'),
config = require('/js/config'),
resourceProxy = require('/js/models/ResourceProxy'),
pathToRoot = '../../',
portlets = [];

Ti.App.addEventListener(app.portalEvents['PORTLETS_RETRIEVED_SUCCESS'], function (e) {
    exports.savePortlets(e.portlets);
});
Ti.App.addEventListener(app.loginEvents['NETWORK_SESSION_FAILURE'], function (e){
    exports.savePortlets([]);
});

Ti.App.addEventListener(app.portalEvents['PORTAL_REACHABLE'], function (e){
    Ti.API.debug('PORTAL_REACHABLE event received in PortalProxy. e: '+JSON.stringify(e));
    exports.saveIsPortalReachable(e.reachable);
});

exports.retrievePortlets = function () {
    Ti.API.debug('retrievePortlets() in PortalProxy. Portlets: '+JSON.stringify(portlets));
    return portlets;
};

exports.savePortlets = function (_portlets) {
    Ti.API.debug('savePortlets() in PortalProxy');
    var nativeModules = config.retrieveLocalModules(), module;

    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {
            nativeModules[module].added = false;
        }
    }
    for (var i = 0, iLength = _portlets.length; i<iLength; i++ ) {
        if(nativeModules[_portlets[i].fname]) {
            _portlets[i] = nativeModules[_portlets[i].fname];
            nativeModules[_portlets[i].fname].added = true;
        }
    }

    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {
            if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                // As long as the module has a title, hasn't already been added, and doesn't 
                // require the fname for the module to be returned in the personalized layout.
                _portlets.push(nativeModules[module]);
            }
        }
    }

    _portlets.sort(exports._sortPortlets);
    
    //Set the state of the portal proxy. Assume local portlets only if _portlets.length < 1
    exports.saveState(exports.states[_portlets.length > 0 ? 'PORTLETS_LOADED' : 'PORTLETS_LOADED_LOCAL']);
    portlets = _portlets;
    Ti.App.fireEvent(app.portalEvents['PORTLETS_LOADED'], { state: exports.retrieveState() });
};

exports.retrievePortletByFName = function (fname) {
	for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
		if (portlets[i].fname === fname) {
			return portlets[i];
		}
	}
	return false;
};

exports._sortPortlets = function(a, b) {
    if (!a.title || !b.title) {
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

    if (resourceProxy.retrievePortletIcon(p.fname)) {
        _iconUrl = resourceProxy.retrievePortletIcon(p.fname);
    }
    else if (p.iconUrl && p.iconUrl.indexOf('/') == 0) {
        _iconUrl = config.BASE_PORTAL_URL + p.iconUrl;
    } 
    else if (p.iconUrl) {
        _iconUrl = pathToRoot + p.iconUrl;
    } 
    else {
        _iconUrl = config.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
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