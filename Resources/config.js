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
 

Ti.include('js/ApplicationFacade.js');
Titanium.include('style.js');
Titanium.include('localization.js');
Titanium.include('js/gibberish-aes.js');
Titanium.include('js/models/MapProxy.js');
Titanium.include('js/models/DirectoryProxy.js');
Titanium.include('js/models/LoginProxy.js');
Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/GlobalActivityIndicator.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/PersonDetailTableView.js');
Titanium.include('js/views/SecondaryNavBar.js');
Titanium.include('js/controllers/DirectoryDetailController.js');
Titanium.include('js/controllers/MapDetailViewController.js');

var UPM, facade;

Titanium.App.Properties.setString('locale','en_US');

UPM = UPM || {};

UPM.getResourcePath = function (file) {
    //File path should be passed in as a relative path loaded from the root of the Resources directory. 
    //Should not contain a forward slash at beginning of path.
    if(Titanium.Platform.osname === ('iphone' || 'ipad')) {
        Ti.API.info("getResourcePath is iOS");
        return file;
    } 
    else if (Titanium.Platform.osname === 'android') {
        Ti.API.info("getResourcePath is Android");
        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory + "/" + file);
    }
    else {
        return file;
    }
};


facade = new ApplicationFacade();
facade.registerMember('UPM', UPM);
facade.registerMember('styles', new Styles());
facade.registerMember('GibberishAES', GibberishAES);
facade.registerMember('localDictionary', localDictionary[Titanium.App.Properties.getString('locale')]);

facade.registerModel('mapService', new MapService(facade));
facade.registerModel('directoryProxy', new DirectoryProxy(facade));
facade.registerModel('loginProxy', new LoginProxy(facade));

facade.registerView('MapDetailTop', MapDetailTop);
facade.registerView('GenericTitleBar', GenericTitleBar);
facade.registerView('PersonDetailTableView', PersonDetailTableView);
facade.registerView('GlobalActivityIndicator', new GlobalActivityIndicator(facade));
facade.registerView('SecondaryNavBar', SecondaryNavBar);


//------- PORTAL LOCATION -------

// Base url of the portal, which should be of the format
// http[s]://server[:port][/context]. This URL is *not* expected to contain a 
// trailing slash.
UPM.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
// UPM.BASE_PORTAL_URL = 'http://172.16.67.78:8080';
UPM.PORTAL_CONTEXT = '/uPortal';

//------- AUTHENTICATION -------

UPM.SERVER_SESSION_TIMEOUT = 29 * 60;
//UPM.LOGIN_METHOD = UPM.doCASLogin;
UPM.LOGIN_METHOD = facade.models.loginProxy.doLocalLogin;
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

UPM.directoryEmergencyContacts = [];
UPM.directoryEmergencyContacts.push({ displayName: ["Campus Police"], telephoneNumber: ['555 555 5555'] });
UPM.directoryEmergencyContacts.push({ displayName: ["Campus Ambulance"], telephoneNumber: ['555 555 5555'] });




