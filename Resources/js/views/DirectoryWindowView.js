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

exports.events = {
    SEARCH_SUBMIT   : 'DirectoryWindowSearchSubmit',
    SEARCH_CHANGE   : 'DirectoryWindowSearchChange'
};

var defaultTableData=[], tableData = [], _viewModel, directoryDetailView,
win, peopleGroup, titleBar, searchBar, noSearchResultsSection, noSearchResultsRow, contentScrollView, peopleListTable, emergencyContactSection, phoneDirectorySection, phoneDirectoryRow, activityIndicator;

exports.open = function (viewModel) {
    _viewModel = viewModel;
    directoryDetailView = require('/js/views/DirectoryDetailView');
    win = Titanium.UI.createWindow({
        // url: 'js/views/WindowContext.js',
        backgroundColor: app.styles.backgroundColor,
        exitOnClose: false,
        navBarHidden: true,
        orientationModes: [
        	Titanium.UI.PORTRAIT,
        	Titanium.UI.UPSIDE_PORTRAIT,
        	Titanium.UI.LANDSCAPE_LEFT,
        	Titanium.UI.LANDSCAPE_RIGHT,
        	Titanium.UI.FACE_UP,
        	Titanium.UI.FACE_DOWN
        ]
    });
    win.open();
    
    if (app.models.deviceProxy.isAndroid()) win.addEventListener('android:search', onAndroidSearch);
    
    drawDefaultView();
};

exports.close = function () {
    blurSearch();
    directoryDetailView = null;
    
    if (win && app.models.deviceProxy.isAndroid()) win.removeEventListener('android:search', onAndroidSearch);
    
    win.close();
};

exports.reset = function () {
    blurSearch();
    if (searchBar) { searchBar.input.value = ''; }
    directoryDetailView.hide();
    if (peopleListTable) { peopleListTable.setData(_viewModel.emergencyContacts || defaultTableData); }
    if (activityIndicator) { activityIndicator.view.hide(); }
};

exports.showDetail = function (person) {
    directoryDetailView.render(person);
};

exports.alert = function (attributes) {
    if (win.visible || app.models.deviceProxy.isIOS()) {
        try {
            var alertDialog = Titanium.UI.createAlertDialog({
                title: attributes.title,
                message: attributes.message,
                buttonNames: [app.localDictionary.OK]
            });
            activityIndicator.view.hide();
            alertDialog.show();
        }
        catch (e) {
            Ti.API.error("Couldn't show alert in DirectoryWindowView " + e);
        }
    }
};

exports.showActivityIndicator = function (message) {
    if (message) { activityIndicator.saveLoadingMessage(message); }
    activityIndicator.view.show();
};

exports.updateTable = function (newTableData) {
    tableData = newTableData;
    peopleListTable.setData(tableData);
};

exports.displaySearchResults = function (results) {
    var _peopleTableData = [], _people, alertDialog;

    activityIndicator.view.hide();
    
    //Get array of people from search results from proxy
    _people = results;

    if(_people.length > 0) {
        Ti.API.info(_people);
        for (var i=0, iLength=_people.length; i<iLength; i++) {
            var _contactRow = Titanium.UI.createTableViewRow({
                title: _people[i].displayName[0],
                hasChild: true,
                data: _people[i],
                className: 'ContactRow'
            });
            _peopleTableData.push(_contactRow);
            _contactRow.addEventListener('click', onContactRowClick);
        }
        peopleListTable.setData(_peopleTableData);
    }
    else {
        if (win.visible || app.models.deviceProxy.isIOS()) {
            try {
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.noResults,
                    message: app.localDictionary.noSearchResults,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
            }
            catch (e) {
                Ti.API.error("Couldn't show alert in DirectoryWindowView: " + e);
            }
        }
        peopleListTable.setData(defaultTableData);
    }
};

function drawDefaultView () {
    if (win) {
        titleBar = require('/js/views/UI/TitleBar');
        titleBar.updateTitle(app.localDictionary.directory);
        titleBar.addHomeButton();
        
        win.add(titleBar.view);

        createDefaultGroups();

        //Create the main table
        peopleListTable = Titanium.UI.createTableView({
            data: defaultTableData,
            top: app.styles.titleBar.height + app.styles.searchBar.height
        });

        peopleListTable.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;

        win.add(peopleListTable);
        peopleListTable.addEventListener('touchstart', blurSearch);
        peopleListTable.addEventListener('move', blurSearch);

        //Create and add a search bar at the top of the table to search for contacts
        searchBar = require('/js/views/UI/SearchBar');
        searchBar.createSearchBar({
            cancel: onSearchCancel,
            submit: onSearchSubmit,
            change: onSearchChange
        });
        win.add(searchBar.container);

        win.add(directoryDetailView.retrieveDetailView());

        activityIndicator = require('/js/views/UI/ActivityIndicator');
        activityIndicator.resetDimensions();
        win.add(activityIndicator.view);
        activityIndicator.view.hide();
    }
    else {
        Ti.API.error("No win in drawDefaultView() in DirectoryWindowController");
    }
};

function createDefaultGroups () {
    defaultTableData = [];
    if (_viewModel.defaultNumber) {
        //Create the section and one row to display the phone number for the phone directory
        phoneDirectorySection = Titanium.UI.createTableViewSection({
            headerTitle: app.localDictionary.phoneDirectory
        });
        phoneDirectoryRow = Titanium.UI.createTableViewRow({
            title: _viewModel.defaultNumber
        });
        phoneDirectoryRow.addEventListener('click', onPhoneDirectoryClick);
        phoneDirectorySection.add(phoneDirectoryRow);
        defaultTableData.push(phoneDirectorySection);
    }

    //Create a section to display emergency contact numbers

    if (_viewModel.emergencyContacts.length > 0) {
        emergencyContactSection = Titanium.UI.createTableViewSection();
        emergencyContactSection.headerTitle =  app.localDictionary.emergencyContacts;
        for (var i=0, iLength = _viewModel.emergencyContacts.length; i<iLength; i++) {
            var _contact = _viewModel.emergencyContacts[i],
            _emergencyContactRow = Titanium.UI.createTableViewRow({
                title: _contact.displayName[0],
                hasChild: true,
                data: _contact
            });
            emergencyContactSection.add(_emergencyContactRow);
            _emergencyContactRow.addEventListener('click', onContactRowClick);
        }
        defaultTableData.push(emergencyContactSection);
    }
    else {
        Ti.API.info("There aren't any emergency contacts");
    }
};

//Contact Events
function onContactRowClick (e) {
    exports.showDetail(e.source.data);
};

function onPhoneDirectoryClick (e) {
    Ti.Platform.openURL('tel:' + _viewModel.defaultNumber);
};

function onSearchCancel (e) {
    exports.reset();
};

function onSearchSubmit (e) {
    blurSearch();
    Ti.App.fireEvent(exports.events['SEARCH_SUBMIT'], {value: searchBar.input.value});
};

function onSearchChange (e) {
    Ti.App.fireEvent(exports.events['SEARCH_CHANGE'], {value: searchBar.input.value});
    if(searchBar.input.value === '') {
        exports.updateTable(_viewModel.emergencyContacts);
        if (peopleListTable) {
            peopleListTable.setData(defaultTableData);
        }
    }
};

function onAndroidSearch (e) {
	if (searchBar && searchBar.input) searchBar.input.focus();
	if (directoryDetailView) directoryDetailView.hide();
};

function blurSearch () {
    if (searchBar) searchBar.input.blur();
};