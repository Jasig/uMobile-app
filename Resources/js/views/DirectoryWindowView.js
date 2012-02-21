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
win, peopleGroup, titleBar, searchBar, noSearchResultsSection, noSearchResultsRow, contentScrollView, peopleListTable, emergencyContactSection, phoneDirectorySection, phoneDirectoryRow, activityIndicator,
styles, localDictionary, deviceProxy;

exports.open = function (viewModel) {
    styles = styles ? styles.updateStyles() : require('/js/style').updateStyles();
    localDictionary = localDictionary || require('/js/localization')[Ti.App.Properties.getString('locale')];
    deviceProxy = deviceProxy || require('/js/models/DeviceProxy');
    
    _viewModel = viewModel;
    
    win = Titanium.UI.createWindow({
        // url: 'js/views/WindowContext.js',
        backgroundColor: styles.backgroundColor,
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
    
    if (deviceProxy.isAndroid()) win.addEventListener('android:search', onAndroidSearch);
    
    drawDefaultView();
};

exports.close = function () {
    blurSearch();
    directoryDetailView = null;
    
    if (peopleListTable) {
        peopleListTable.addEventListener('touchstart', blurSearch);
        peopleListTable.addEventListener('move', blurSearch);
    }
    
    if (win && deviceProxy.isAndroid()) win.removeEventListener('android:search', onAndroidSearch);
    
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
    directoryDetailView = require('/js/views/DirectoryDetailView');
    win.add(directoryDetailView.retrieveDetailView());
    directoryDetailView.render(person, win);
};

exports.alert = function (attributes) {
    var alertDialog = Titanium.UI.createAlertDialog({
        title: attributes.title,
        message: attributes.message,
        buttonNames: [localDictionary.OK]
    });
    activityIndicator.view.hide();
    alertDialog.show();
};

exports.showActivityIndicator = function (message) {
    if (message) { activityIndicator.setLoadingMessage(message); }
    activityIndicator.view.show();
};

exports.hideActivityIndicator = function () {
    activityIndicator.view.hide();
};

exports.updateTable = function (newTableData) {
    tableData = newTableData;
    peopleListTable.setData(tableData);
};

exports.displaySearchResults = function (results) {
    var _peopleTableData = [], _people, alertDialog;

    activityIndicator.view.hide();

    if(results.length > 0) {
        for (var i=0, iLength=results.length; i<iLength; i++) {
            var _contactRow = Titanium.UI.createTableViewRow({
                title: results[i].displayName[0],
                hasChild: true,
                data: results[i],
                className: 'ContactRow'
            });
            _peopleTableData.push(_contactRow);
            _contactRow.addEventListener('click', onContactRowClick);
        }
        peopleListTable.setData(_peopleTableData);
    }
    else {
        exports.alert({
            title: localDictionary.noResults,
            message: localDictionary.noSearchResults
        });
        
        peopleListTable.setData(defaultTableData);
    }
};

function drawDefaultView () {
    if (!win) return Ti.API.error("No win in drawDefaultView() in DirectoryWindowController");
    
    createDefaultGroups();
    
    //Create the main table
    peopleListTable = Titanium.UI.createTableView({
        data: defaultTableData,
        top: styles.titleBar.height + styles.searchBar.getHeight + 'dp'
    });
    
    peopleListTable.style = deviceProxy.isIOS() ? Titanium.UI.iPhone.TableViewStyle.GROUPED : 0;
    
    win.add(peopleListTable);
    peopleListTable.addEventListener('touchstart', blurSearch);
    peopleListTable.addEventListener('move', blurSearch);
    
    //Create and add a search bar at the top of the table to search for contacts
    searchBar = require('/js/views/UI/SearchBar').createSearchBar({
        cancel: onSearchCancel,
        submit: onSearchSubmit,
        change: onSearchChange
    });
    win.add(searchBar.container);
    
    activityIndicator = require('/js/views/UI/ActivityIndicator').createActivityIndicator();
    win.add(activityIndicator.view);
    activityIndicator.view.hide();
    
    titleBar = require('/js/views/UI/TitleBar').createTitleBar();
    titleBar.updateTitle(localDictionary.directory);
    titleBar.addHomeButton();
    win.add(titleBar.view);
    titleBar.view.show();
};

function createDefaultGroups () {
    defaultTableData = [];
    if (_viewModel.defaultNumber) {
        //Create the section and one row to display the phone number for the phone directory
        phoneDirectorySection = Titanium.UI.createTableViewSection({
            headerTitle: localDictionary.phoneDirectory
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
        emergencyContactSection.headerTitle =  localDictionary.emergencyContacts;
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