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

var Config = function (app) {
    var UPM = {};

    Titanium.App.Properties.setString('locale','en_US');
    
    //------- PORTAL LOCATION -------

    // Base url of the portal, which should be of the format
    // http[s]://server[:port][/context]. This URL is *not* expected to contain a 
    // trailing slash.
    // UPM.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
    UPM.BASE_PORTAL_URL = 'https://umobile.unicon.net';
    UPM.PORTAL_CONTEXT = '/uPortal';

    //------- AUTHENTICATION -------

    // UPM.SERVER_SESSION_TIMEOUT = 29 * 60;
    UPM.SERVER_SESSION_TIMEOUT = 5 * 60;
    UPM.LOGIN_METHOD = LoginProxy.loginMethods.LOCAL_LOGIN; //References value of LoginProxy.loginMethods constant. Would be ideal to implement a static object in LoginProxy instead of using a literal here.
    UPM.CAS_URL = UPM.BASE_PORTAL_URL + '/cas';
    UPM.ENCRYPTION_KEY = 'um0b1le';
    UPM.FORGOT_PASSWORD_URL = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/p/forgot-password';

    //------- MAP SERVICE -------

    UPM.MAP_SERVICE_URL = UPM.BASE_PORTAL_URL + '/MapPortlet/api/locations.json';


    //------- DIRECTORY SERVICE -------

    UPM.DIRECTORY_SERVICE_URL = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/api/people.json';
    UPM.DIRECTORY_SERVICE_SEARCH_FIELDS = [
        'given',
        'sn',
        'organization'
    ];
    UPM.DIRECTORY_SERVICE_RESULT_FIELDS = {
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
    
    UPM.LOCAL_MODULES = [];
    UPM.LOCAL_MODULES.map = {
        title: 'map',
        iconUrl: 'icons/map.png',
        fname: 'map',
        window: 'map'
    };
    
    UPM.LOCAL_MODULES.directory = {
        title: 'directory',
        fname: 'directory',
        iconUrl: 'icons/directory.png',
        doesRequireLayout: true,
        window: 'directory'
    };
    UPM.LOCAL_MODULES.twitter = {
        title: 'Twitter',
        fname: 'twitter',
        url: 'http://mobile.twitter.com/searches?q=jasig11+OR+sakai11',
        externalModule: true
    };
    
    UPM.getLocalModules = function () {
        return UPM.LOCAL_MODULES;
    };

    UPM.GLOBAL_STYLES = {
        textFieldGradient: {
            type:'linear',
            colors:['#ccc','#fff']
        },
        primaryBarColor: "#000",
        secondaryBarColor: "#333",
        windowBackgroundColor: "#fff",
        tableBackgroundColor: "#fff"
    };
    
    UPM.DEFAULT_MAP_REGION = {
        latitude: 39.890822,
        longitude: -105.064509,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
    };
    
    UPM.nativeIcons = {
        videos: 'icons/youtube.png',
        news: 'icons/feed.png',
        calendar: 'icons/calendar.png',
        map: 'icons/map.png',
        directory: 'icons/directory.png',
        twitter: 'icons/twitter.png',
        weather: 'icons/weather.png'
    };

    UPM.directoryEmergencyContacts = [
        { 
            displayName: ["Jasig Hotel"],
            telephoneNumber: ['(866) 716-8137'],
            postalAddress: ['10600 Westminster Boulevard$Westminster, CO 80020'],
            url: ['http://www.westindenverboulder.com/']
        },
        { 
            displayName: ["Sakai Hotel"],
            telephoneNumber: ['(213) 624-1000'],
            postalAddress: ['404 South Figueroa Street$Los Angeles , CA 90071'],
            url: ['http://www.thebonaventure.com/']
        }
    ];
    
    UPM.phoneDirectoryNumber = false;
    
    return UPM;
};