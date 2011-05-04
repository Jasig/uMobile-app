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

var DirectoryWindowController = function (facade) {
    var win, app = facade, self = {}, directoryProxy = app.models.directoryProxy,
        // Data and variables
        initialized, peopleResult = [], defaultTableData = [], 
        contactDetailViewOptions, searchBarOptions,
        //UI Elements
        peopleGroup, titleBar, searchBar, noSearchResultsSection, noSearchResultsRow, contentScrollView, peopleListTable, emergencyContactSection, phoneDirectorySection, phoneDirectoryRow, contactDetailView, activityIndicator,
        //Methods
        drawDefaultView, resetHome, searchSubmit, openContactDetail, blurSearch, displaySearchResults,
        //Event Handlers
        onSearchCancel, onPhoneDirectoryClick, onSearchSubmit, onSearchChange, onContactRowClick, onWindowBlur, onProxySearching, onProxySearchComplete, onProxySearchError;
    
    init = function () {
        Ti.API.debug("DirectoryWindowController.init()");
        checkNetwork();
        self.key = 'directory';
        
        Ti.App.addEventListener('showWindow', onWindowBlur);
        
        initialized = true;
    };
    
    self.open = function () {
        if (!win) {
            win = Titanium.UI.createWindow({
                backgroundColor: app.styles.backgroundColor,
                title: app.localDictionary.directory,
                exitOnClose: false,
                navBarHidden: true,
                modal: true
            });
            if (Ti.Platform.osname === 'iphone') {
                win.top = 20;
            }
            win.open();
        }
        else {
            win.open();
            resetHome();
            onSearchCancel();
        }
        drawDefaultView();
    };
    
    self.close = function () {
        win.close();
    };
    
    checkNetwork = function () {
        var alertDialog;
        if (!Ti.Network.online) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.error,
                message: app.localDictionary.networkConnectionRequired,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
        }
    };
    
    drawDefaultView = function () {
        Ti.API.debug("Adding titleBar in DirectoryWindowController");
        if(!titleBar) {
            //Create a title bar from the generic title bar partial view
            titleBar = new app.views.GenericTitleBar({
                app: app,
                title: app.localDictionary.directory,
                homeButton: true,
                settingsButton: false
            });
            win.add(titleBar);            
        }
        
        Ti.API.debug("Adding phoneDirectorySection in DirectoryWindowController");
        if (!phoneDirectorySection) {
            //Create the section and one row to display the phone number for the phone directory
            phoneDirectorySection = Titanium.UI.createTableViewSection();
            phoneDirectorySection.headerTitle = app.localDictionary.phoneDirectory;
            phoneDirectoryRow = Titanium.UI.createTableViewRow({
                title: app.localDictionary.phoneDirectoryNumber
            });
            phoneDirectoryRow.addEventListener('click',onPhoneDirectoryClick);
            phoneDirectorySection.add(phoneDirectoryRow);
            defaultTableData.push(phoneDirectorySection);
        }
        
        
        Ti.API.info("Emergency Contacts? " + directoryProxy.getEmergencyContacts());
        
        if (!emergencyContactSection) {
            //Create a section to display emergency contact numbers
            if(directoryProxy.getEmergencyContacts().length > 0) {
                emergencyContactSection = Titanium.UI.createTableViewSection();
                emergencyContactSection.headerTitle =  app.localDictionary.emergencyContacts;
                for (var i=0, iLength = directoryProxy.getEmergencyContacts().length; i<iLength; i++) {
                    var _contact = directoryProxy.getEmergencyContacts()[i],
                    _emergencyContactRow = Titanium.UI.createTableViewRow({
                        title: _contact.displayName[0],
                        hasChild: true,
                        data: _contact
                    });
                    emergencyContactSection.add(_emergencyContactRow);
                    _emergencyContactRow.addEventListener('click',onContactRowClick);
                }
                defaultTableData.push(emergencyContactSection);            
            }
            else {
                Ti.API.info("There aren't any emergency contacts");
            }
        }
        
        Ti.API.debug("Adding peopleListTable in DirectoryWindowController");
        if (!peopleListTable) {
            //Create the main table
            peopleListTable = Titanium.UI.createTableView({
                data: defaultTableData,
                top: app.styles.titleBar.height + app.styles.searchBar.height
            });
            if (Titanium.Platform.osname === 'iphone') {
                peopleListTable.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;
            }
            win.add(peopleListTable);
            peopleListTable.addEventListener('touchstart', blurSearch);
            peopleListTable.addEventListener('move', blurSearch);            
        }
        
        Ti.API.debug("Adding searchBar in DirectoryWindowController");
        if (!searchBar) {
            searchBarOptions = app.styles.searchBar;
            searchBarOptions.top = app.styles.titleBar.height;
            // searchBarOptions.hintText = app.localDictionary.directorySearchHintText;
            //Create and add a search bar at the top of the table to search for contacts
            searchBar = Titanium.UI.createSearchBar(searchBarOptions);

            win.add(searchBar);
            searchBar.addEventListener('cancel', onSearchCancel);
            searchBar.addEventListener('return', onSearchSubmit);
            searchBar.addEventListener('change', onSearchChange);
        }

        if (!contactDetailView) {
            //Create the contact detail view but don't show it yet.
            contactDetailViewOptions = app.styles.contactDetailView;
            contactDetailView = new app.controllers.DirectoryDetailController(app, contactDetailViewOptions);

            Ti.API.debug('created contactDetailView');
            win.add(contactDetailView);
        }

        if (!activityIndicator) {
            activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
            activityIndicator.resetDimensions();
            
            win.add(activityIndicator);
            activityIndicator.hide();
        }
    };
    
    resetHome = function () {
        Ti.API.debug("resetHome() in DirectoryWindowController");
        blurSearch();
        if (searchBar) { searchBar.value = ''; }
        if (directoryProxy) { directoryProxy.clear(); }
        if (peopleListTable) { peopleListTable.setData(defaultTableData); }
        if (contactDetailView) { contactDetailView.hide(); }
        if (activityIndicator) { activityIndicator.hide(); }
    };
    
    displaySearchResults = function () {
        var _peopleTableData = [], _people, alertDialog;
                
        //Get array of people from search results from proxy
        _people = directoryProxy.getPeople();

        if(_people.length > 0) {
            Ti.API.info(_people);
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                var _contactRow = Titanium.UI.createTableViewRow({
                    title: _people[i].displayName[0],
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
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.noResults,
                message: app.localDictionary.noSearchResults,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
            peopleListTable.setData(defaultTableData);
        }
    };
    
    openContactDetail = function (person) {
        Ti.API.debug('openContactDetail called in DirectoryWindowController');
        Ti.API.debug(contactDetailView);
        Ti.API.debug(person);
        activityIndicator.hide();
        contactDetailView.update(person);
        contactDetailView.show();
    };
    
    blurSearch = function () {
        if (searchBar) {
            searchBar.blur();
        }
    };
    
    // Controller Events
    onWindowBlur = function (e) {
        blurSearch();
    };
    // Search Events
    onPhoneDirectoryClick = function (e) {
        Ti.API.debug("Clicked the phone directory button");
        Ti.Platform.openURL('tel:' + app.localDictionary.phoneDirectoryNumber);
    };
    
    onSearchSubmit = function(e) {
        Ti.API.debug('onSearchSubmit');
        searchBar.blur();
        directoryProxy.search(searchBar.value);
    };
    
    onSearchChange = function (e) {
        if(searchBar.value === '') {
            directoryProxy.clear();
            peopleListTable.setData(defaultTableData);
        }
    };

    onSearchCancel = function (e) {
        Ti.API.debug('onSearchCancel');
        resetHome();
    };
    
    //Contact Events
    onContactRowClick = function (e) {
        Ti.API.debug("Contact clicked:" + JSON.stringify(e.source.data));
        openContactDetail(e.source.data);
    };
    
    //Proxy events

    onProxySearching = function (e) {
        activityIndicator.loadingMessage(app.localDictionary.searching + '...');
        activityIndicator.show();
        Ti.API.info("Searching...");
    };
    
    onProxySearchComplete = function (e) {
        var alertDialog;
        
        activityIndicator.hide();
        Ti.API.info("Directory Search Complete");
        
        if (!e.error) {
            displaySearchResults();
        }
        else {
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.error,
                message: e.error,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
        }
    };
    
    onProxySearchError = function (e) {
        activityIndicator.loadingMessage(app.localDictionary.errorPerformingSearch);
        t = setTimeout(function() {
            activityIndicator.hide();
            }, 3000);
        Ti.API.info("Directory Proxy Search Error");
    };
    
    //Listene for events, mostly fired from models.DirectoryProxy
    Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
    Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
    Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
    Titanium.App.addEventListener('showWindow', blurSearch);
    
    if(!initialized) {
        init();
    }

    return self;
};