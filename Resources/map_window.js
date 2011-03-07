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

/* map_window.js contains setup information for the
 * map tab.
 */

// library includes
Titanium.include('lib.js');
Titanium.include('skin.js');


var win, mapView, createTitleBar, createMapView;

win = Titanium.UI.currentWindow;

createTitleBar = function () {
    var bar, title, homeButton;
    
    // create the view container for the title bar
    bar = Titanium.UI.createView({
        backgroundColor: UPM.TITLEBAR_BACKGROUND_COLOR,
        top: 0,
        height: UPM.TITLEBAR_HEIGHT
    });    
    win.add(bar);

    // add a title to the bar
    title = Titanium.UI.createLabel({
        textAlign: "center",
        text: "Map",
        color: UPM.TITLEBAR_TEXT_COLOR,
        font: { fontWeight: "bold" }
    });
    bar.add(title);
    
    // add a navigation button to allow users to return to the home screen
    homeButton = Titanium.UI.createImageView({
        image: "icons/tab-home.png",
        height: 18,
        width: 18,
        left: 10
    });
    bar.add(homeButton);

    // add an event listener for the home button
    homeButton.addEventListener('click', function (e) {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'settings',
                newWindow: 'home'
            }
        );
    });

};

createMapView = function () {
    var annotations, buttonBar;
    
    // wire up some sample annotations
    // TODO: we need real data here, as well as making some changes so that
    // this code runs successfully on Android
    annotations = [
       Titanium.Map.createAnnotation({
           latitude:47.661009,
           longitude:-122.312894,
           title:"UW Bookstore",
           subtitle:'Books and t-shirts',
           pincolor:Titanium.Map.ANNOTATION_PURPLE
       }),
       Titanium.Map.createAnnotation({
           latitude:47.653233,
           longitude:-122.305856,
           title:"CSE Department",
           subtitle:'Paul G. Allen Center',
           pincolor:Titanium.Map.ANNOTATION_GREEN
       })
   ];

   // create the map view
   mapView = Titanium.Map.createView({
       top: UPM.TITLEBAR_HEIGHT,
       mapType: Titanium.Map.STANDARD_TYPE,
       region:{
           latitude:UPM.DEFAULT_LATITUDE, 
           longitude:UPM.DEFAULT_LONGITUDE, 
           latitudeDelta:0.002, 
           longitudeDelta:0.002
       },
       regionFit:true,
       userLocation:true,
       annotations:annotations
   });
   win.add(mapView);

   // create controls for zoomin / zoomout
   buttonBar = Titanium.UI.createButtonBar({
       labels:['+', '-'], 
       backgroundColor:'#336699', 
       style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
       top: Ti.Platform.displayCaps.platformHeight - 130,
       width: 100,
       height: 25
   });
   mapView.add(buttonBar);

   // add event listeners for the zoom buttons
   buttonBar.addEventListener('click', function (e) {
       if (e.index == 0) {
           mapView.zoom(1);
       } else {
           mapView.zoom(-1);
       }
   });

};

createTitleBar();
createMapView();
