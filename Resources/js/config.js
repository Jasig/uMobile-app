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

/* config.js contains useful configuration parameters
* for the mobile portal application.  This file is
* intended for use in abstracting out strings which
* may differ between deploying institutions.
*/
var constants = require('/js/Constants');
Titanium.App.Properties.setString('locale', 'en_US');

//------- PORTAL LOCATION -------

// Base url of the portal, which should be of the format
// http[s]://server[:port][/context]. This URL is *not* expected to contain a
// trailing slash.
//exports.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
exports.BASE_PORTAL_URL = 'https://mydev.uchicago.edu';
exports.PORTAL_CONTEXT = '';
exports.LAYOUT_URL = exports.BASE_PORTAL_URL + exports.PORTAL_CONTEXT + '/layout.json';
exports.LAYOUT_VIEW = constants.layoutTypes['GRID_LAYOUT'];

//------- AUTHENTICATION -------
Ti.App.Properties.setInt('SERVER_SESSION_TIMEOUT', parseInt((2 * 60 * 60 * 1000), 10));

//References value of LoginProxy.loginMethods constant.
//exports.LOGIN_METHOD = "Cas";
exports.LOGIN_METHOD = "Shibboleth";

exports.CAS_URL = exports.BASE_PORTAL_URL + '/cas';
exports.SHIB_URL = exports.BASE_PORTAL_URL + "/Shibboleth.sso/Login?target=" + exports.BASE_PORTAL_URL + exports.PORTAL_CONTEXT + "/Login";
exports.SHIB_BASE_URL = "https://shibboleth-dev2.uchicago.edu";
exports.SHIB_PROTECTED_URL = "https://mydev.uchicago.edu/shibboleth";
exports.SHIB_ECP_URL = exports.SHIB_BASE_URL + "/idp/profile/SAML2/SOAP/ECP";
/* our apache configuration to support the ecp exchange between uMobile and shibb.
 * our portal context is at the root / context in ROOT.war
 * 
 * ...
 * ProxyPass /shibboleth !
 * ...
 * <Location "/Login">
		AuthType shibboleth
		ShibRequireSession Off
		ShibUseHeaders On
		Require shibboleth
		Order Allow,Deny
		Allow from ...
		...
	</Location>
	<Location "/shibboleth">
		AuthType shibboleth
		ShibRequireSession On
		ShibUseHeaders On
		ShibRequestSetting target "https://mydev.uchicago.edu/Login?refUrl=/layout.json"
		...
	</Location>

 */
exports.ENCRYPTION_KEY = 'um0b1le';
exports.FORGOT_PASSWORD_URL = exports.BASE_PORTAL_URL + exports.PORTAL_CONTEXT + '/p/forgot-password';

//------- MAP SERVICE -------

exports.MAP_SERVICE_URL = exports.BASE_PORTAL_URL + exports.PORTAL_CONTEXT + '/p/map/resource.uP';

//-------- NOTIFICATIONS SERVICE ---------
exports.NOTIFICATIONS_ENABLED = false;
exports.NOTIFICATIONS_SERVICE = (Titanium.Platform.name == 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')+'/search/Notifications';


//------- DIRECTORY SERVICE -------

exports.DIRECTORY_SERVICE_URL = exports.BASE_PORTAL_URL + exports.PORTAL_CONTEXT + '/api/people.json';
exports.DIRECTORY_SERVICE_SEARCH_FIELDS = ['givenName', 'sn','uid','displayName',];
exports.DIRECTORY_SERVICE_RESULT_FIELDS = {
	fullName : 'displayName',
	nickname : 'nickname',
	URL : 'url',
	homeAddress : 'postalAddress',
	homeEmail : 'mail',
	homePhone : 'telephoneNumber',
	firstName : 'givenName',
	lastName : 'sn',
	jobTitle : 'title',
	department : 'department',
	organization : 'organization'
};
/* Local Module example: {
	title : "", // Req string, Shows at the top of the module window
	fname : "", // Req String, unique ID
	window : "", // Opt String, Key of native window associated with this module
	doesRequireLayout : false, // Opt Bool, Indicates if portlet with matching fname must be returned from portal for this to be displayed. Implies also that the module works when portal is down/unavailable.
	externalModule : false, // Opt Bool, Indicates if it's an external site. Requires url attribute as well.
	url : ""        // Opt String, URL of module. Uses PortletWindowController if set.
};*/

exports.LOCAL_MODULES = [];


exports.LOCAL_MODULES.map = {
	title : 'Map',
	fname : 'map',
	window : 'map'
};


exports.LOCAL_MODULES.directory = {
	title : 'Directory',
	fname : 'directory',
	doesRequireLayout : true,
	window : 'directory'
};


exports.LOCAL_MODULES.transit = {
	title : 'Transit',
	fname : 'transit',
	url : 'http://uchicago.transloc.com/m/',
	doesRequireLayout : true,
	externalModule : true
};

exports.LOCAL_MODULES.library = {
	title : "Library",
	fname : "library",
	url : 'http://mobile.lib.uchicago.edu/',
	doesRequireLayout : true,
	externalModule : true
};


exports.retrieveLocalModules = function() {
	return exports.LOCAL_MODULES;
};

exports.DEFAULT_MAP_REGION = {
	latitude : 34.052819,
	longitude : -118.256407,
	latitudeDelta : 0.005,
	longitudeDelta : 0.005
};

exports.WINDOW_CONTROLLERS = {
    portlet: 'PortletWindowController',
    home: 'PortalWindowController',
 //   map: 'MapWindowController',
    directory: 'DirectoryWindowController',
    settings: 'SettingsWindowController'
};
exports.HOME_KEY = 'home';
exports.PORTLET_KEY = 'portlet';
exports.SETTINGS_KEY = 'settings';

exports.nativeIcons = {
    athletics: 'athletics.png',
    announcements: 'bullhorn.png',
	calendar : 'calendar.png',
    "computer-labs" : 'computer_lab.png',
	courses: 'courses.png',
    dining : 'dining.png',
	directory : 'directory.png',
    laundry : 'laundry.png',
	library : 'library.png',
	map : 'map.png',
	news : 'feed.png',
	presentations : 'opencast.png',
	search: 'search.png',
	stats : 'stats.png',
	transit : 'transit.png',
	twitter : 'twitter.png',
	videos : 'youtube.png',
	weather : 'weather.png',
	info : 'default-icon.png'
};



exports.directoryEmergencyContacts = [
    {
	    displayName : ["OUPD"],
	    telephoneNumber : ['(740) 593-1911'],
	    postalAddress : ['135 Scott Quad$Athens, Ohio 45701'],
	    url : ['http://www.ohio.edu/police/alerts/']
    },
    {
	    displayName : ["Fire"],
	    telephoneNumber : ['911']
    },
    {
	    displayName : ["Counseling"],
	    telephoneNumber : ['(740) 593-1616'],
	    postalAddress : ['Hudson Health Center, 3rd Floor$2 Health Center Drive$Athens, Ohio 45701'],
	    url : ['http://www.ohio.edu/counseling/index.cfm']
    }
];

exports.phoneDirectoryNumber = "(740) 593-1000";
