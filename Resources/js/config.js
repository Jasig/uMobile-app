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

/**
 * @constructor
 */
var ConfigModule = function(app) {
	var ILocalModule;
	Titanium.App.Properties.setString('locale', 'en_US');

	//------- PORTAL LOCATION -------

	// Base url of the portal, which should be of the format
	// http[s]://server[:port][/context]. This URL is *not* expected to contain a
	// trailing slash.
    this.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
    // this.BASE_PORTAL_URL = 'https://dev-uportal-showcase.unicon.net';
	this.PORTAL_CONTEXT = '/uPortal';

	//------- AUTHENTICATION -------

	this.SERVER_SESSION_TIMEOUT = 2 * 60 * 60;
	//in seconds = two hours
	this.LOGIN_METHOD = LoginProxy.loginMethods.CAS;
	//References value of LoginProxy.loginMethods constant. Would be ideal to implement a static object in LoginProxy instead of using a literal here.
	this.CAS_URL = this.BASE_PORTAL_URL + '/cas';
	this.ENCRYPTION_KEY = 'um0b1le';
	this.FORGOT_PASSWORD_URL = this.BASE_PORTAL_URL + this.PORTAL_CONTEXT + '/p/forgot-password';

	//------- MAP SERVICE -------

	this.MAP_SERVICE_URL = this.BASE_PORTAL_URL + '/MapPortlet/api/locations.json';

	//------- DIRECTORY SERVICE -------

	this.DIRECTORY_SERVICE_URL = this.BASE_PORTAL_URL + this.PORTAL_CONTEXT + '/api/people.json';
	this.DIRECTORY_SERVICE_SEARCH_FIELDS = ['given', 'sn'];
	this.DIRECTORY_SERVICE_RESULT_FIELDS = {
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
	ILocalModule = {
		title : "", // Req string, Shows at the top of the module window
		fname : "", // Req String, unique ID
		window : "", // Opt String, Key of native window associated with this module
		doesRequireLayout : false, // Opt Bool, Indicates if portlet with matching fname must be returned from portal for this to be displayed. Implies also that the module works when portal is down/unavailable.
		externalModule : false, // Opt Bool, Indicates if it's an external site. Requires url attribute as well.
		url : ""        // Opt String, URL of module. Uses PortletWindowController if set.
	};

	this.LOCAL_MODULES = [];

	this.LOCAL_MODULES.map = {
		title : 'map',
		fname : 'map',
		window : 'map'
	};

	this.LOCAL_MODULES.directory = {
		title : 'directory',
		fname : 'directory',
		doesRequireLayout : true,
		window : 'directory'
	};

	this.LOCAL_MODULES.transit = {
		title : 'Transit',
		fname : 'transit',
		url : 'http://uchicago.transloc.com/m/',
		externalModule : true
	};

	this.LOCAL_MODULES.library = {
		title : "Library",
		fname : "library",
		url : 'http://mobile.lib.uchicago.edu/',
		externalModule : true
	};

	// This module is called manually from the title bar on the home screen.
	// this.LOCAL_MODULES.info = {
	//  title: 'info',
	//  fname: 'info',
	//  url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/info.html?portal-url='+ this.BASE_PORTAL_URL).nativePath,
	//  externalModule: true
	// };

	this.getLocalModules = function() {
		return this.LOCAL_MODULES;
	};

	this.DEFAULT_MAP_REGION = {
		latitude : 34.052819,
		longitude : -118.256407,
		latitudeDelta : 0.005,
		longitudeDelta : 0.005
	};

	this.nativeIcons = {
		calendar : 'calendar.png',
		courses: 'courses.png',
		directory : 'directory.png',
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

	this.directoryEmergencyContacts = [
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

	this.phoneDirectoryNumber = "(740) 593-1000";
};
