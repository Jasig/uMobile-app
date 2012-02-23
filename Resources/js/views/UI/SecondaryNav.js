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
var styles = require('/js/style'),
deviceProxy = require('/js/models/DeviceProxy'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createSecondaryNav = function () {
    var navBar = {}, leftButton, rightButton, titleLabel;
    
    navBar.view = Titanium.UI.createView(styles.secondaryNavBar);

    leftButton = Titanium.UI.createButton(styles.secondaryNavButton);
    leftButton.left = styles.secondaryNavButton.plainLeft + 'dp';
    leftButton.title = localDictionary.back;
    navBar.view.add(leftButton);

    rightButton = Titanium.UI.createButton(styles.secondaryNavButton);
    rightButton.right = styles.secondaryNavButton.plainLeft + 'dp';
    navBar.view.add(rightButton);

    titleLabel = Titanium.UI.createLabel(styles.secondaryNavLabel);
    navBar.view.add(titleLabel);

    navBar.leftButton = leftButton;
    navBar.rightButton = rightButton;
    navBar.titleLabel = titleLabel;
    
    navBar.hide = function () {
        //Couldn't directly alias view method in Android
        navBar.view.hide();
    };
    
    navBar.show = function() {
        //Couldn't directly alias view method in Android
        navBar.view.show();
    };
    
    return navBar;
};