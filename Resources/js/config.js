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
var Config = function (app) {
    Titanium.App.Properties.setString('locale','en_US');
    
    //------- PORTAL LOCATION -------

    // Base url of the portal, which should be of the format
    // http[s]://server[:port][/context]. This URL is *not* expected to contain a 
    // trailing slash.
    // this.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
    this.BASE_PORTAL_URL = 'https://umobile.unicon.net';
    this.PORTAL_CONTEXT = '/uPortal';

    //------- AUTHENTICATION -------

    this.SERVER_SESSION_TIMEOUT = 2 * 60 * 60;//in seconds = two hours
    this.LOGIN_METHOD = LoginProxy.loginMethods.LOCAL_LOGIN; //References value of LoginProxy.loginMethods constant. Would be ideal to implement a static object in LoginProxy instead of using a literal here.
    this.CAS_URL = this.BASE_PORTAL_URL + '/cas';
    this.ENCRYPTION_KEY = 'um0b1le';
    this.FORGOT_PASSWORD_URL = this.BASE_PORTAL_URL + this.PORTAL_CONTEXT + '/p/forgot-password';

    //------- MAP SERVICE -------

    this.MAP_SERVICE_URL = this.BASE_PORTAL_URL + '/MapPortlet/api/locations.json';


    //------- DIRECTORY SERVICE -------

    this.DIRECTORY_SERVICE_URL = this.BASE_PORTAL_URL + this.PORTAL_CONTEXT + '/api/people.json';
    this.DIRECTORY_SERVICE_SEARCH_FIELDS = [
        'given',
        'sn',
        'organization'
    ];
    this.DIRECTORY_SERVICE_RESULT_FIELDS = {
        fullName: 'displayName',
        nickname: 'nickname',
        URL: 'url',
        homeAddress: 'postalAddress',
        homeEmail: 'mail',
        homePhone: 'telephoneNumber',
        firstName: 'givenName',
        lastName: 'sn',
        jobTitle: 'title',
        department: 'department',
        organization: 'organization'
    };
    
    this.LOCAL_MODULES = [];
    this.LOCAL_MODULES.map = {
        title: 'map',
        iconUrl: 'icons/map.png',
        fname: 'map',
        window: 'map'
    };
    
    this.LOCAL_MODULES.directory = {
        title: 'directory',
        fname: 'directory',
        iconUrl: 'icons/directory.png',
        doesRequireLayout: true,
        window: 'directory'
    };
    this.LOCAL_MODULES.transit = {
        title: 'Transit',
        fname: 'transit',
        url: 'http://m.metro.net/',
        externalModule: true
    };
    this.LOCAL_MODULES.twitter = {
        title: 'Twitter',
        fname: 'twitter',
        url: 'http://mobile.twitter.com/searches?q=sakai11',
        externalModule: true
    };
    
    this.getLocalModules = function () {
        return this.LOCAL_MODULES;
    };

    this.GLOBAL_STYLES = {
        textFieldGradient: {
            type:'linear',
            colors:['#ccc','#fff']
        },
        primaryBarColor: "#000",
        secondaryBarColor: "#333",
        windowBackgroundColor: "#fff",
        tableBackgroundColor: "#fff"
    };
    
    this.DEFAULT_MAP_REGION = {
        latitude: 34.052234,
        longitude: -118.243685,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
    };
    
    this.nativeIcons = {
        videos: 'icons/youtube.png',
        news: 'icons/feed.png',
        calendar: 'icons/calendar.png',
        map: 'icons/map.png',
        directory: 'icons/directory.png',
        twitter: 'icons/twitter.png',
        transit: 'icons/transit.png',
        weather: 'icons/weather.png',
        stats: 'icons/stats.png'
        
    };

    this.directoryEmergencyContacts = [
        { 
            displayName: ["Westin Bonaventure Hotel"],
            telephoneNumber: ['(866) 716-8137'],
            postalAddress: ['404 South Figueroa Street$Los Angeles, CA 90071'],
            url: ['http://www.starwoodhotels.com/westin/search/hotel_detail.html?propertyID=1004']
        }
    ];
    
    this.phoneDirectoryNumber = false;
};
