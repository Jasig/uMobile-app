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
    UPM.BASE_PORTAL_URL = 'http://umobile.unicon.net';
    UPM.PORTAL_CONTEXT = '/uPortal';

    //------- AUTHENTICATION -------

    // UPM.SERVER_SESSION_TIMEOUT = 29 * 60;
    UPM.SERVER_SESSION_TIMEOUT = 15; //Temporary override to test the timer.
    // UPM.LOGIN_METHOD = app.models.loginProxy.doCASLogin;
    UPM.LOGIN_METHOD = "LocalLogin"; //References value of LoginProxy.loginMethods constant. Would be ideal to implement a static object in LoginProxy instead of using a literal here.
    UPM.CAS_URL = UPM.BASE_PORTAL_URL + '/cas';
    UPM.ENCRYPTION_KEY = 'um0b1le';

    //------- MAP SERVICE -------

    UPM.MAP_SERVICE_URL = UPM.BASE_PORTAL_URL + '/MapPortlet/api/locations.json';


    //------- DIRECTORY SERVICE -------

    UPM.DIRECTORY_SERVICE_URL = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/api/people.json';
    UPM.DIRECTORY_SERVICE_SEARCH_FIELDS = [
        'given',
        'sn'
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
        organization: 'department'
    };

    UPM.LOCAL_MODULES = [
         {
             title: 'map',
             iconUrl: 'icons/map.png',
             window: 'map'
         },
         {
             title: 'directory',
             iconUrl: 'icons/directory.png',
             window: 'directory'
         }
    ];

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
        latitude: 41.3137919,
        longitude: -72.9234645,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
    };

    UPM.directoryEmergencyContacts = [];
    UPM.directoryEmergencyContacts.push({ displayName: ["Campus Police"], telephoneNumber: ['555 555 5555'] });
    UPM.directoryEmergencyContacts.push({ displayName: ["Campus Ambulance"], telephoneNumber: ['555 555 5555'] });
    
    return UPM;
};