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
 
var UPM = UPM || {};


// Base url of the portal, which should be of the format
// http[s]://server[:port][/context]. This URL is *not* expected to contain a 
// trailing slash.
UPM.BASE_PORTAL_URL = Titanium.Platform.name == 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
UPM.MAP_SERVICE_URL = UPM.BASE_PORTAL_URL + '/uPortal/services/map-test-data.json';
UPM.PORTAL_CONTEXT = '/uPortal';

// Default latitude and longitude for map.  This location
// will be used for map initialization if the user's location
// cannot be determined or if the user declines to grant 
// GPS access to the application.
UPM.DEFAULT_LATITUDE = 41.3104425;
UPM.DEFAULT_LONGITUDE = -72.9254028;

UPM.LOCAL_MODULES = [
     {
         title: 'map',
         iconUrl: 'icons/map.png',
         window: 'map'
     }
];
