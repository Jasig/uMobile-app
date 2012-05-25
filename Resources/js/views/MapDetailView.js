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

var mapDetailTableView, locationDetailTitleBar, locationDetailMap, locationDetail, locationPhoto, topDetailView, onBackBtnClick,
_ = require('/js/libs/underscore-min'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')],
styles = require('/js/style');

exports.detailView = Titanium.UI.createView(styles.view);

exports.render = function (viewModel) {
    var mapImageGroup, mapGroupAddress, directionsButton, directionsButtonRow, detailImageRow, detailImage,
    _tableViewData = [], directionsButtonOptions;
    if (mapDetailTableView) {
        mapDetailTableView.setData([]);
        try {
            exports.detailView.remove(mapDetailTableView);
        }
        catch (e) {
            Ti.API.error("Couldn't remove mapDetailTableView from detailView");
        }
    }
    
    locationDetailTitleBar = require('/js/views/UI/SecondaryNav').createSecondaryNav();
    locationDetailTitleBar.view.top = 0;
    locationDetailTitleBar.titleLabel.text = viewModel.title;
    locationDetailTitleBar.leftButton.addEventListener('click', onBackBtnClick);
    locationDetailTitleBar.rightButton.hide();
    locationDetailTitleBar.rightButton.visible = false;
    exports.detailView.add(locationDetailTitleBar.view);
    
    mapGroupAddress = Ti.UI.createTableViewSection({
        headerTitle: localDictionary.locationDetails
    });
    
    mapGroupAddress.add(Ti.UI.createTableViewRow({
        title: viewModel.title || localDictionary.titleNotAvailable
    }));
    
    mapGroupAddress.add(Ti.UI.createTableViewRow({
        title: viewModel.address || localDictionary.noAddressAvailable
    }));
    
    var viewOnMapButton, viewOnMapButtonOptions, viewOnMapRow;
    viewOnMapButtonOptions = _.clone(styles.contentButton);
    viewOnMapButtonOptions.width = '150dp';
    viewOnMapButtonOptions.title = localDictionary.viewOnMap;
    
    viewOnMapButton = Ti.UI.createButton(viewOnMapButtonOptions);
    
    viewOnMapRow = Ti.UI.createTableViewRow();
    viewOnMapRow.add(viewOnMapButton);
    mapGroupAddress.add(viewOnMapRow);
    viewOnMapButton.addEventListener("click", function (e) {
        Ti.App.fireEvent(exports.events["VIEW_ON_MAP_CLICK"], {title: viewModel.title});
    });
    viewOnMapButton.addEventListener('touchstart', function (e) {
        viewOnMapButton.backgroundGradient = styles.contentButton.backgroundGradientPress;
    });
    viewOnMapButton.addEventListener('touchend', function (e) {
        viewOnMapButton.backgroundGradient = styles.contentButton.backgroundGradient;
    });
    
    if(viewModel.address) {
        directionsButtonOptions = _.clone(styles.contentButton);
        directionsButtonOptions.width = '150dp';
        directionsButtonOptions.title = localDictionary.getDirections;
        directionsButton = Titanium.UI.createButton(directionsButtonOptions);
        // directionsButton.width = 'auto';
        directionsButtonRow = Ti.UI.createTableViewRow();
        directionsButtonRow.add(directionsButton);
        mapGroupAddress.add(directionsButtonRow);

        directionsButton.addEventListener("click", function (e) {
            Ti.Platform.openURL('http://maps.google.com/maps?daddr='+ viewModel.address +','+ viewModel.zip +'&ie=UTF8&t=h&z=16');
        });
        directionsButton.addEventListener('touchstart', function (e) {
            directionsButton.backgroundGradient = styles.contentButton.backgroundGradientPress;
        });

        directionsButton.addEventListener('touchend', function (e) {
            directionsButton.backgroundGradient = styles.contentButton.backgroundGradient;
        });
    }
    
    _tableViewData.push(mapGroupAddress);
    
    if (viewModel.img) {
        mapImageGroup = Ti.UI.createTableViewSection({
            headerTitle: localDictionary.locationImage
        });
        detailImageRow = Ti.UI.createTableViewRow(styles.mapDetailImageRow);
        detailImage = Titanium.UI.createImageView({
            height: '200dp', 
            image: viewModel.img.replace(/\/thumbnail\//,'/photo/')
        });
        detailImageRow.add(detailImage);
        mapImageGroup.add(detailImageRow);
        _tableViewData.push(mapImageGroup);
    }

    mapDetailTableView = Ti.UI.createTableView(styles.mapDetailTableView);
    exports.detailView.add(mapDetailTableView);
    mapDetailTableView.setData(_tableViewData);
};

exports.events = {
    VIEW_ON_MAP_CLICK   : "MapDetailViewViewOnMapClick"
};

exports.hide = function () {
    exports.detailView.hide();
};

onBackBtnClick = function (e) {
    exports.detailView.hide();
};