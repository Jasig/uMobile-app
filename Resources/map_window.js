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


var win, annotations, mapView, zoomin, zoomout;

win = Titanium.UI.currentWindow;

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

mapView = Titanium.Map.createView({
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

// Zoom in control
zoomin = Titanium.UI.createButton({
	title:'+',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
zoomin.addEventListener('click',function() {
	mapView.zoom(1);
});

// Zoom out control
zoomout = Titanium.UI.createButton({
	title:'-',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
zoomout.addEventListener('click',function() {
	mapView.zoom(-1);
});

win.setToolbar([zoomin,zoomout]);