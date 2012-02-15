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
portlets = [], //Portlet model: {fname:"unique", title:"Human Readable", url: "portal_url", description: "...", newItemCount: 0, iconUrl: "/path/on/portal.png", folders: ["id1","id2"]};
folders = []; //Folder model: {id: "u12345", title: "Campus", numChildren: 2 }

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

exports.retrievePortlets = function (folder) {
    Ti.API.debug('retrievePortlets() in PortalProxy. Portlets: '+JSON.stringify(portlets));
    if (folder) {
        //Let's iterate through all of the portlets and find which ones 
    }
    return portlets;
};

exports.getFolderList = function () {
    /*
        This method returns a list of folders, so the home view can 
        let the user choose which portlets they want to see.
    */
    return folders;
};

function _processFolderLayout (layout) {
    var _folders = layout[0]["folders"], _portlets = {};
    //First, we'll populate the module's folders array
    var l = _folders.length, i=0, _currentFolder, _currentPortlet, j, pLength;
    var perfTimer = new Date().getTime();
    while (i++ != l) {
        _currentFolder = _folders[i-1];
        j = 0;
        pLength = _currentFolder.portlets.length;
        folders.push({
            id: _currentFolder.id, 
            title: _currentFolder.title, 
            numChildren: pLength
        });
        //Let's add this folder's portlets to the _portlets Object. 
        //We'll worry about sorting later.
        Ti.API.debug('Iterating through folder\'s portlets. '+JSON.stringify(_currentFolder.portlets));
        while (j++ != pLength) {
            _currentPortlet = _currentFolder.portlets[j-1];
            if (_currentPortlet.fname in _portlets) {
                _portlets[_currentPortlet.fname].folders.push(_currentFolder.id);
            }
            else {
                _portlets[_currentPortlet.fname] = _currentPortlet;
                _portlets[_currentPortlet.fname].folders = [_currentFolder.id];
            }
        }
    }
    
    //Now we'll arrange the portlets in a sorted array.
    //First we'll create a new array, and add each portlet.
    portlets = [];
    for (var _portlet in _portlets) {
        if (_portlets.hasOwnProperty(_portlet)) {
            portlets.push(_portlets[_portlet]);
        }
    }
    
    portlets.sort(_sortPortlets);
    Ti.API.debug('Final folders: '+JSON.stringify(folders));
    Ti.API.debug('Final portlets: '+JSON.stringify(portlets));
    
    //Set the state of the portal proxy. Assume local portlets only if layout.length < 1
    exports.saveState(exports.states[layout.length > 0 ? 'PORTLETS_LOADED' : 'PORTLETS_LOADED_LOCAL']);
    Ti.App.fireEvent(app.portalEvents['PORTLETS_LOADED'], { state: exports.retrieveState() });
}

function _processFlatLayout (layout) {
    Ti.API.debug('_processFlatLayout() in PortalProxy. layout: '+JSON.stringify(layout));
    /*
        This method is called if the app is configured to to accept a layout
        from the portal without any folders, eg layout: [{portlet},{portlet}]
    */
    var nativeModules = config.retrieveLocalModules(), module;

    /* [Jeff Cross] Since nativeModules is now a local variable, updated each time
    this method is called, it seems that this loop isn't necessary.*/
    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {
            nativeModules[module].added = false;
        }
    }
    
    /* Here we want to override any portlets from the portal with
    native modules if there is a matching fname */
    for (var i = 0, iLength = layout.length; i<iLength; i++ ) {
        if(nativeModules[layout[i].fname]) {
            layout[i] = nativeModules[layout[i].fname];
            nativeModules[layout[i].fname].added = true;
        }
    }

    for (module in nativeModules) {
        if (nativeModules.hasOwnProperty(module)) {
            if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                // As long as the module has a title, hasn't already been added, and doesn't 
                // require the fname for the module to be returned in the personalized layout.
                layout.push(nativeModules[module]);
            }
        }
    }

    layout.sort(_sortPortlets);
    
    //Set the state of the portal proxy. Assume local portlets only if layout.length < 1
    exports.saveState(exports.states[layout.length > 0 ? 'PORTLETS_LOADED' : 'PORTLETS_LOADED_LOCAL']);
    portlets = layout;
    Ti.App.fireEvent(app.portalEvents['PORTLETS_LOADED'], { state: exports.retrieveState() });
}

exports.savePortlets = function (_portlets) {
    Ti.API.debug('savePortlets() in PortalProxy');
    if ("folders" in _portlets[0]) {
        Ti.API.debug('We are dealing with a nested layout.');
        _processFolderLayout(_portlets);
    }
    else {
        Ti.API.debug('We are dealing with a flat layout.');
        _processFlatLayout(_portlets);
    }
};

exports.retrievePortletByFName = function (fname) {
	for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
		if (portlets[i].fname === fname) {
			return portlets[i];
		}
	}
	return false;
};

function _sortPortlets (a, b) {
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
    if (resourceProxy.retrievePortletIcon(p.fname)) return resourceProxy.retrievePortletIcon(p.fname);
    if (p.iconUrl && p.iconUrl.indexOf('/') == 0)  return config.BASE_PORTAL_URL + p.iconUrl;
    if (p.iconUrl) return pathToRoot + p.iconUrl;
    return config.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
};

exports.retrieveIsPortalReachable = function () {
    return isPortalReachable;
};

exports.saveIsPortalReachable = function (newval) {
    if (typeof newval == "boolean") return isPortalReachable = newval;
    Ti.API.error("Couldn't set value of _isPortalReachable, wasn't type 'boolean' but was type: " + typeof newval);
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