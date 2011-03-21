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

/**
 * settings_window.js contains setup information for the
 * user settings tab.
 */

Ti.API.info("Directory Window Opened");

(function () {
    var win = Titanium.UI.currentWindow,
        app = win.app,
        self = {},
        directoryProxy = app.models.directoryProxy,
        // Data and variables
        peopleResult = [],
        defaultTableData,
        initialized = false,
        //UI Elements
        peopleGroup,
        titleBar,
        searchBar,
        noSearchResultsSection,
        noSearchResultsRow,
        contentScrollView,
        peopleListTable,
        emergencyContactSection,
        phoneDirectorySection,
        phoneDirectoryRow,
        contactDetailWindow,
        //Methods
        searchSubmit,
        openContactDetail,
        blurSearch,
        displaySearchResults,
        //Event Handlers
        onSearchCancel,
        onPhoneDirectoryClick,
        onSearchSubmit,
        onSearchChange,
        onContactRowClick,
        onProxySearching,
        onProxySearchComplete,
        onProxySearchError;
    
    self.init = function () {
        Ti.API.debug("DirectoryWindowController.init()");
        win.backgroundColor = '#fff';
        win.initialized = true;
        
        //Create a title bar from the generic title bar partial view
        titleBar = new win.app.views.GenericTitleBar({
            app: app,
            title: app.localDictionary.directory,
            homeButton: true,
            settingsButton: false,
            windowKey: win.key
        });
        win.add(titleBar);
        
        //Create and add a search bar at the top of the table to search for contacts
        searchBar = Titanium.UI.createSearchBar({
            top: titleBar.size.height,
            height:50,
            barColor: "#333",
            // clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
            showCancel: true,
            hintText: app.localDictionary.directorySearchHintText
        });
        win.add(searchBar);
        searchBar.addEventListener('cancel', onSearchCancel);
        searchBar.addEventListener('return',onSearchSubmit);
        searchBar.addEventListener('change', onSearchChange);

        //Create an array to hold the initial data passed into the Directory
        //Initial Data includes phone directory and emergency contacts
        defaultTableData = [];
        
        //Create a section to display emergency contact numbers
        if(directoryProxy.getEmergencyContacts) {
            emergencyContactSection = Titanium.UI.createTableViewSection();
            emergencyContactSection.headerTitle =  app.localDictionary.emergencyContacts;
            for (var i=0, iLength = directoryProxy.getEmergencyContacts().length; i<iLength; i++) {
                var _contact = directoryProxy.getEmergencyContacts()[i],
                _emergencyContactRow = Titanium.UI.createTableViewRow({
                    title: _contact.name,
                    hasChild: true,
                    data: _contact
                });
                emergencyContactSection.add(_emergencyContactRow);
                _emergencyContactRow.addEventListener('click',onContactRowClick);
            }
            defaultTableData.push(emergencyContactSection);            
        }
        
        //Create the section and one row to display the phone number for the phone directory
        phoneDirectorySection = Titanium.UI.createTableViewSection();
        phoneDirectorySection.headerTitle = app.localDictionary.phoneDirectory;
        phoneDirectoryRow = Titanium.UI.createTableViewRow({
            title: app.localDictionary.phoneDirectoryNumber
        });
        phoneDirectoryRow.addEventListener('click',onPhoneDirectoryClick);
        phoneDirectorySection.add(phoneDirectoryRow);
        defaultTableData.push(phoneDirectorySection);
            
        //Create the main table
        peopleListTable = Titanium.UI.createTableView({
            data: defaultTableData,
            top: searchBar.size.height + searchBar.top,
            style: Titanium.UI.iPhone.TableViewStyle.GROUPED
        });
        win.add(peopleListTable);
        peopleListTable.addEventListener('touchstart', blurSearch);
        peopleListTable.addEventListener('move', blurSearch);
        
        //Create the contact detail window but don't show it yet.
        contactDetailWindow = Titanium.UI.createWindow({
            url: win.app.UPM.getResourcePath('/js/controllers/DirectoryDetailController.js'),
            app: app,
            key: 'directorydetailcontroller',
            initialized: false,
            update: function(){}
        });
        
        initialized = true;
    };
    
    displaySearchResults = function () {
        var _peopleTableData = [], _people;
                
        //Get array of people from search results from proxy
        _people = directoryProxy.getPeople();

        if(_people.length > 0) {
            // peopleListTable.show();
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                var _contactRow = Titanium.UI.createTableViewRow({
                    title: _people[i].name,
                    hasChild: true,
                    data: _people[i]
                });
                _peopleTableData.push(_contactRow);
                _contactRow.addEventListener('click',onContactRowClick);
            }
            peopleListTable.setData(_peopleTableData);
        }
        else {
            Ti.API.debug("Not more than 0 results");
            if(defaultTableData[0].headerTitle != app.localDictionary.noSearchResults) {
                noSearchResultsSection = Titanium.UI.createTableViewSection();
                noSearchResultsSection.headerTitle = app.localDictionary.noSearchResults;

                defaultTableData.splice(0,0,noSearchResultsSection);
                
                                
            }
            peopleListTable.setData(defaultTableData);
        }
    };
    
    openContactDetail = function (person) {
        Ti.API.info("openContactDetail" + JSON.stringify(person));
        contactDetailWindow.contact = person;
        if (contactDetailWindow.initialized) {
            Ti.API.debug('contactDetailWindow is initialized');
            contactDetailWindow.update(person);
            contactDetailWindow.show();
        }
        else {
            Ti.API.debug('contactDetailWindow is not initialized');
            contactDetailWindow.open();
        }

    };
    
    blurSearch = function () {
        searchBar.blur();
    };
    
    // Controller Events
    // Search Events
    onPhoneDirectoryClick = function (e) {
        Ti.API.debug("Clicked the phone directory button");
        Ti.Platform.openURL('tel:' + app.localDictionary.phoneDirectoryNumber);
    };
    
    onSearchSubmit = function(e) {
        searchBar.blur();
        directoryProxy.search(searchBar.value);
    };
    
    onSearchCancel = function (e) {
        directoryProxy.clear();
        blurSearch();
        displaySearchResults();
    };
    onSearchChange = function (e) {
        if(searchBar.value == '') {
            directoryProxy.clear();
            displaySearchResults();
        }
    };
    
    //Contact Events
    onContactRowClick = function (e) {
        Ti.API.debug("Contact clicked:" + JSON.stringify(e.source.data));
        openContactDetail(e.source.data);
    };
    
    //Proxy events

    onProxySearching = function (e) {
        Ti.API.info("Searching...");
    };
    
    onProxySearchComplete = function (e) {
        Ti.API.info("Directory Search Complete");
        displaySearchResults();
    };
    
    onProxySearchError = function (e) {
        Ti.API.info("Directory Proxy Search Error");
    };
    
    //Listene for events, mostly fired from models.DirectoryProxy
    Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
    Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
    Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
    Titanium.App.addEventListener('showWindow', blurSearch);
    
    if(initialized === false) {
        self.init();        
    }

    return self;
})();