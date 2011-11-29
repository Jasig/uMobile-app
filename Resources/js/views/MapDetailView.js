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
/* 
* @constructor
* @implements {IDetailView} 
*/
var MapDetailView = function (facade) {   
    var app = facade, _self = this, Device, Styles, LocalDictionary, UI, mapDetailTableView,
        _detailView, locationDetailTitleBar, locationDetailMap, locationDetail, locationPhoto, topDetailView,
        onBackBtnClick;
        
    init = function () {        
        //Declare pointers to facade modules
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        UI = app.UI;
        
        Ti.App.addEventListener(ApplicationFacade.events['STYLESHEET_UPDATED'], function (e) {
            Styles = app.styles;
        });
    };
    
    this.getDetailView = function () {
        if (!_detailView) {
            _detailView = Titanium.UI.createView(app.styles.view);
        }
        return _detailView;
    };
    
    this.render = function (viewModel) {
        var mapImageGroup, mapGroupAddress, directionsButton, directionsButtonRow, detailImageRow, detailImage,
        _tableViewData = [], directionsButtonOptions;
        Ti.API.debug("render() in MapDetailViewController");
        if (mapDetailTableView) {
            Ti.API.debug("mapDetailTableView defined, clearing it.");
            mapDetailTableView.setData([]);
            try {
                _detailView.remove(mapDetailTableView);
            }
            catch (e) {
                Ti.API.error("Couldn't remove mapDetailTableView from _detailView");
            }
        }
        else {
            Ti.API.debug("mapDetailTableView not defined.");
        }
        
        locationDetailTitleBar = UI.createSecondaryNavBar({ 
            backButtonHandler: onBackBtnClick,
            title: viewModel.title,
            btnFloatLeft: true
        });
        _detailView.add(locationDetailTitleBar);
        
        mapGroupAddress = Ti.UI.createTableViewSection({
            headerTitle: LocalDictionary.locationDetails
        });
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.title || LocalDictionary.titleNotAvailable
        }));
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.address || LocalDictionary.noAddressAvailable
        }));
        
        if(viewModel.address) {
            directionsButtonOptions = _.clone(Styles.contentButton);
            directionsButtonOptions.width = 150;
            directionsButtonOptions.title = LocalDictionary.getDirections;
            directionsButton = Titanium.UI.createButton(directionsButtonOptions);
            // directionsButton.width = 'auto';
            directionsButtonRow = Ti.UI.createTableViewRow();
            directionsButtonRow.add(directionsButton);
            mapGroupAddress.add(directionsButtonRow);
            
            directionsButton.addEventListener("click", function (e) {
                Ti.Platform.openURL('http://maps.google.com/maps?daddr='+ viewModel.address +','+ viewModel.zip +'&ie=UTF8&t=h&z=16');
            });
            directionsButton.addEventListener('touchstart', function (e) {
                directionsButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
            });
            directionsButton.addEventListener('touchend', function (e) {
                directionsButton.backgroundGradient = Styles.contentButton.backgroundGradient;
            });
        }
        
        _tableViewData.push(mapGroupAddress);
        
        if (viewModel.img) {
            mapImageGroup = Ti.UI.createTableViewSection({
                headerTitle: LocalDictionary.locationImage
            });
            detailImageRow = Ti.UI.createTableViewRow(app.styles.mapDetailImageRow);
            detailImage = Titanium.UI.createImageView({
                height: 200,
                image: viewModel.img.replace(/\/thumbnail\//,'/photo/')
            });
            detailImageRow.add(detailImage);
            mapImageGroup.add(detailImageRow);
            _tableViewData.push(mapImageGroup);
        }

        mapDetailTableView = Ti.UI.createTableView(Styles.mapDetailTableView);
        _detailView.add(mapDetailTableView);
        mapDetailTableView.setData(_tableViewData);
        
    };
    
    this.hide = function () {
        if (_detailView) {
            _detailView.hide();
        }
    };
    
    onBackBtnClick = function (e) {
        _detailView.hide();
    };
    
    init();
};