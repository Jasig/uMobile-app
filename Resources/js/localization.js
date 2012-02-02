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
//When possible, and if the use is general enough, try to use the literal English representation of the phrase.
//In some cases, it's better to give context, so that a translator can understand how the word will be used. Eg. activityIndicatorMessage
//If a phrase is too long, make it as short as it can be while still clear in meaning. Eg. errorPerformingSearch

exports.en_US = {
    //Global Text
    uMobile: "uMobile",
    homeTitle: "uMobile",
    search: "Search",
    go: "Go",
    back: "Back",
    info: "Info",
    error: "Error",
    OK: "OK",
    update: "Update",
    home: "Home",
    success: "Success",
    doneEditing: "Done Editing",
    loading: 'Loading',
    gettingPortlets: "Getting modules from server",
    failedToLoadPortlets: "Failed to connect to server to load portlets. Please try again later.",
    searching: "Searching",
    noResults: "No Results",
    noNetworkTitle: "No Network Connection",
    errorPerformingSearch: "There was an error while performing your search request.",
    searchResults: "Search Results",
    noSearchResults: "No results matched your search",
    activityIndicatorMessage: "Loading...",
    networkConnectionRequired: "A network connection is required to use this application. Please connect to the internet and come back to this application.",
    couldNotConnectToPortal: "Sorry, your portlets could not be loaded from the portal.",
    couldNotLoginToPortal: "Sorry, the portal couldn't be reached to log you in.",
    viewingGuestLayout: "Log In for Personal Content",
    portalNotReachable: "Your modules couldn't be loaded. Click here to try again.",
    notifications: "Notifications",
    emergencyNotification: "Emergency Notification",
    
    //Map Window & Map Detail Window
    map: "Map",
    browse: "Browse",
    favorites: "Favorites",
    list    : "List",
    viewOnMap   : "View on Map", 
    browseLocations : "Browse Locations",
    mapLoadingLocations: "Loading locations from server",
    mapProcessingLocations: "Processing locations",
    getDirections: "Get Directions",
    locationDetails: "Location Details",
    locationImage: "Location Image",
    noAddressAvailable: "No Address Available",
    titleNotAvailable: "Title Not Available",
    mapNoSearchResults: "No locations match your search",
    map_NETWORK_UNAVAILABLE: "There was an error loading locations for the map. Please check your internet connection and try again",
    map_REQUEST_TIMEOUT: "The request to load map locations timed out. Please try again later.",
    map_SERVER_ERROR: "There was an error loading map locations. Please try again later.",
    map_NO_DATA_RETURNED: "There was an error processing data for map. Search will only work with cached data at this time.",
    map_INVALID_DATA_RETURNED: "There was an error processing data for map. Search will only work with cached data at this time.",
    map_GENERAL_ERROR: "There was an error loading locations to search the map.",
    
    //Settings Window
    settings: "Settings",
    username: "Username",
    password: "Password",
    accountSettings: "Account Settings",
    logOut: "Sign Out",
    authenticationFailed: "Authentication failed. Please check your username and password and try again.",
    authenticationSuccessful: "You've successfully logged in.",
    logOutSuccessful: "You have successfully logged out.",
    enterAUserName: "Please enter a valid username.",
    resetPasswordTitle: "Reset Password",
    resetPasswordLink: "To set or reset your password, visit: ",
    loggingIn: "Logging in",
    
    //Directory Window
    directory: "Directory",
    directoryRequiresNetwork: "Directory search requires a network connection. Please connect to a network prior to searching.",
    gettingContactInfo: "Getting contact info for user.",
    couldNotLoadUser: "Information for that user could not be found.",
    noContactData: "No contact data is available.",
    directorySearchHintText: "John Doe, Jdoe@myschool.edu, 555 555 5555",
    phoneDirectory: "Phone Directory",
    phoneNumber: "Phone Number",
    emergencyContacts: "Emergency Contacts",
    contactDetail: "Contact Detail",
    email: "Email",
    phone: "Phone",
    title: "Title",
    organization:"Org",
    department: "Dept",
    address:"Address",
    url: "Url",
    emailAddress: "Email Address",
    emailAddresses: "Email Addresses",
    directoryErrorFetching: "There was an error fetching the results for your query. Please try a different query."
};
exports.retrieveLocale = function (locale) {
    return exports[locale] || exports['en_US'];
};