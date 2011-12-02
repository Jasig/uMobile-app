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
This is a javascript dictionary for application styles, in lieu of a stylesheet. (Titanium's JSS is not a suitable option, due to Android bugs and lack of support)
It is attached to the facade singleton that's shared with the entire application.
Right now, it's unsophisticated with only one level of encapsulation. titleBarButton.
To apply styles to elements
*/


var defaults, OS = Ti.Platform.osname;

function getPlatformWidth () {
    return Ti.Platform.displayCaps.platformWidth;
}

function getPlatformHeight () {
    return Ti.Platform.displayCaps.platformHeight;
}

defaults = {
    TITLEBAR_HEIGHT: 40,
    STATUSBAR_HEIGHT: OS === 'android' ? 25 : 20,
    SEARCHBAR_HEIGHT: OS === 'android' ? 48 : 40,
    DETAIL_TOP_TITLE_COLOR: '#333',
    DETAIL_TOP_BACKGROUND_COLOR: '#eee',
    PRIMARY_BAR_BACKGROUND_COLOR: "#000",
    SECONDARY_BAR_BACKGROUND_COLOR: "#38678F",
    PRIMARY_BAR_BACKGROUND_GRADIENT: {
        type:'linear',
        colors:['#3E4650','#121416']
    },
    SECONDARY_BAR_BACKGROUND_GRADIENT: {
        type:'linear',
        colors:['#4682B4','#294D6B']
    },
    SECONDARY_BAR_BTN_BACKGROUND_GRADIENT: {
        type:'linear',
        colors:['#4682b4','#294d6b']
    },
    SECONDARY_BAR_BTN_DOWN_BG: {
        type: 'linear',
        colors: ['#294D6B','#4682B4']
    },
    SECONDARY_BAR_COLOR: "#fff"
};
    
    
exports.backgroundColor = '#fff';
exports.view = {
    backgroundColor: '#fff',
    top: defaults.TITLEBAR_HEIGHT
};
exports.portletView= {
    top: defaults.TITLEBAR_HEIGHT,
    height: getPlatformHeight() - defaults.TITLEBAR_HEIGHT
};
exports.portletWindow= {
    // url: 'js/views/WindowContext.js',
    key: 'portlet',
    backgroundColor: "#fff",
    exitOnClose: false,
    navBarHidden: true,
    orientationModes: [
    	Titanium.UI.PORTRAIT,
    	Titanium.UI.UPSIDE_PORTRAIT,
    	Titanium.UI.LANDSCAPE_LEFT,
    	Titanium.UI.LANDSCAPE_RIGHT
    ]
};
exports.textField= {
    height: OS === 'iphone' ? 35 : 45,
	width: 150,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
};
exports.textFieldLabel= {
    height:35,
    width:'auto',
    color: '#000'
};
exports.settingsTable= {
    top: defaults.TITLEBAR_HEIGHT,
    style: Titanium.UI.iPhone.TableViewStyle.GROUPED
};
//Settings Properties
exports.settingsPasswordInput= {
    height: OS === 'iphone' ? 35 : 45,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
    passwordMask: true,
    left: 100,
    width: getPlatformWidth() - 100 - 30,
    autocapitalization: Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
    autocorrect: false
};
exports.settingsPasswordLabel= {
    height:35,
    width:'auto',
    color: '#000',
    left: 10
};
exports.settingsUsernameInput= {
    height: OS === 'iphone' ? 35 : 45,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
    left: 100,
    width: getPlatformWidth() - 100 - 30,
    autocapitalization: Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
    autocorrect: false
};
exports.settingsUsernameLabel= {
    height:35,
    width:'auto',
    color: '#000',
    left: 10
};
exports.settingsResetPasswordLabel= {
    font: {
        fontSize: 12
    },
    left: 10,
    height: 40,
    color: "#036",
    textDecoration: 'underline'
};
exports.contentButton= {
    font: {
        fontSize: 14,
        fontWeight: 'bold'
    },
    height: 40,
    width: 100,
    backgroundGradient: {},
    backgroundGradientPress: {}
};
//Global search bar properties
exports.searchBar= {
    top: defaults.TITLEBAR_HEIGHT,
    height: defaults.SEARCHBAR_HEIGHT,
    backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
    barColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
    backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
    showCancel: OS === 'android' ? false : true,
    width: getPlatformWidth()
};
exports.searchBarInput= {
    width: getPlatformWidth() - 5 - 5,
    height: defaults.SEARCHBAR_HEIGHT - 7,
    top: 5,
    borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
    softKeyboardOnFocus: Titanium.Platform.osname === 'android' ? Titanium.UI.Android.SOFT_KEYBOARD_DEFAULT_ON_FOCUS : false
};
//Styles for TitleBar
exports.titleBar= {
    top: 0,
	left: 0,
	height: defaults.TITLEBAR_HEIGHT,
    backgroundGradient: defaults.PRIMARY_BAR_BACKGROUND_GRADIENT,
	width: OS === 'android' ? 'auto' : Titanium.Platform.displayCaps.platformWidth,
	zIndex: 1
};
//Titanium.UI.Button implemented in the GenericTitleBar
exports.titleBarButton= {
    style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
    left: 10,
    width: 50,
    height: 30,
	backgroundImage: 'none',
	color: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#000',
	font: {
	    fontSize: 14
	},
	backgroundGradient: {
	    backFillStart: false,
	    type:'linear',
        colors:['#666','#333']
	}
};
//Titanium.UI.Label implemented in GenericTitleBar
exports.titleBarLabel= {
	textAlign: "center",
    color: '#fff',
    font: {
        fontWeight: "bold",
        fontSize: 18
    }
};
exports.titleBarHomeContainer= {
    width: 40,
    height: 30,
    borderRadius: 5,
    backgroundColor: 'transparent',
    backgroundColorPressed: "#999",
    left: 5
};
exports.titleBarInfoContainer= {
    width: 40,
    height: 30,
    borderRadius: 5,
    backgroundColor: 'transparent',
    backgroundColorPressed: '#999',
    left: 5
};
exports.titleBarInfoButton= {
    image: "images/tab-info.png",
    width: 20,
    height: 20
};
//Titanium.UI.View with home icon implemented in GenericTitleBar on left-hand side
exports.titleBarHomeButton= {
    image: "images/tab-home.png",
    width: 18,
    height: 18
};
//Titanium.UI.View with settings icon implemented in GenericTitleBar on right-hand side
exports.titleBarSettingsContainer= {
    width: 40,
    height: 30,
    borderRadius: 5,
    backgroundColor: 'transparent',
    backgroundColorPressed: "#999",
    left: getPlatformWidth() - 40 - 5
};
exports.titleBarSettingsButton= {
    height: 18,
    width: 18,
    image: "images/tab-settings.png"
};
exports.secondaryNavBar= {
    top: 0,
	left: 0,
	height: defaults.TITLEBAR_HEIGHT,
	backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
	backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
	width: OS === 'android' ? 'auto' : Titanium.Platform.displayCaps.platformWidth
};

exports.secondaryNavBarLabel= {
    width: getPlatformWidth() - 70 * 2 - 10 * 4,
    left: 10,
    buttonLeftFloat: 70 + 10 * 2,
    height: defaults.TITLEBAR_HEIGHT,
    color: defaults.SECONDARY_BAR_COLOR,
    textAlign: "center",
    ellipsize: true,
    wordWrap: false,
    minimumFontSize: 14,
    font: {
        fontSize: 14,
        fontWeight: 'bold'
    }
};
// Styles for new prototype in v1.1, views/SecondaryNav.js
exports.secondaryNavLabel= {
    width: getPlatformWidth() - 70 * 2 - 10 * 4,
    left: 70 + 10 * 2,
    height: defaults.TITLEBAR_HEIGHT,
    color: defaults.SECONDARY_BAR_COLOR,
    textAlign: "center",
    ellipsize: true,
    wordWrap: false,
    minimumFontSize: 14,
    font: {
        fontSize: 14,
        fontWeight: 'bold'
    }
};
/*secondaryBar= {
    top: defaults.TITLEBAR_HEIGHT,
    width: getPlatformWidth(),
    height: defaults.TITLEBAR_HEIGHT,
    barColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
    backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
};*/
exports.secondaryNavBarButton= {
    style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
    left: getPlatformWidth() - 50 - 10,
    leftFloat: 10,
    width: 50,
    height: 30,
    optionalImage: 'img/back-icon.png',
	backgroundImage: 'img/secondarybarbtnbg.png',
	backgroundSelectedImage: 'img/secondarybarbtnbg_press.png',
	color: '#fff',
	selectedColor: "#fff",
    borderRadius: 10,
    borderColor: '#294D6B',
    borderWidth: 1,
	font: {
	    fontSize: 12,
	    fontWeight: "bold"
	}
};
// Styles for new prototype for v1.1, views/SecondaryNav.js
exports.secondaryNavButton= {
    style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
    left: 10,
    width: 50,
    height: 30,
    optionalImage: 'img/back-icon.png',
	backgroundImage: 'img/secondarybarbtnbg.png',
	backgroundSelectedImage: 'img/secondarybarbtnbg_press.png',
	color: '#fff',
	selectedColor: "#fff",
    borderRadius: 10,
    borderColor: '#294D6B',
    borderWidth: 1,
	font: {
	    fontSize: 12,
	    fontWeight: "bold"
	}
};
//PORTAL VIEW STYLES
exports.portalWindow= {
    // url: 'js/views/WindowContext.js',
    navBarHidden: true,
    exitOnClose: true,
    fullScreen: false,
    orientationModes: [
    	Titanium.UI.PORTRAIT,
    	Titanium.UI.UPSIDE_PORTRAIT,
    	Titanium.UI.LANDSCAPE_LEFT,
    	Titanium.UI.LANDSCAPE_RIGHT
    ]
};
exports.portalContentLayer= {
    top: defaults.TITLEBAR_HEIGHT,
    width: OS === 'android' ? 'auto' : getPlatformWidth(),
    height: getPlatformHeight() - defaults.TITLEBAR_HEIGHT - 20,
    backgroundColor: "#2A4F95"
};
exports.homeGrid= {
    top: 0,
    height: getPlatformHeight() - defaults.TITLEBAR_HEIGHT - OS === 'iphone' || OS === 'ipad' ? 20 : 0,
    color: "#fff",
    contentHeight:'auto',
    zIndex: 1
};
exports.homeGuestNote= {
    height: 40,
    backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
};
exports.homeGuestNoteLabel= {
    color: "#fff",
    textAlign: 'center',
    font: {
        fontSize: 12
    }
};
exports.gridIcon= {
    top: 0,
    canScale: false,
    width: OS === 'ipad' ? 72 : 57,
    height: OS === 'ipad' ? 72 : 57,
    type: 'gridIcon'
};
exports.gridItem= {
    width: OS === 'ipad' ? 768 / 4 - 50 : 80,
    height: OS === 'ipad' ? 72 + 20 : 57 + 20,
    padding: 10,
    pressOpacity: 0.5,
    type: 'gridItem'
};
exports.gridItemLabel= {
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { x:0 , y:1 },
    font: { 
        size: 10,
        family: 'HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,sans-serif'
    },
    top: OS === 'ipad' ? 72 : 57,
    color: "#fff",
    touchEnabled: false

};
exports.gridBadgeBackground= {
    top: 0, 
    right: 11,
    height: 20,
    width: 20,
    image: 'images/badgeBackground.png'
};
exports.gridBadgeNumber= {
    textAlign: "center",
    color: "#fff",
    height: 16,
    width: 16,
    font: { 
        fontSize: 12,
        fontWeight: "bold"
    },
    top: 1, //Magic number, consider constant or another approach
    right: 13,
    touchEnabled: false

};
//DIRECTORY STYLES
exports.contactDetailView= {
    backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
    visible: false,
    top: defaults.TITLEBAR_HEIGHT,
    height: getPlatformHeight() - defaults.TITLEBAR_HEIGHT,
    width: OS === 'android' ? getPlatformWidth() : 'auto',
    modal: true
};

exports.directoryDetailAttributeTable= {
    top: defaults.TITLEBAR_HEIGHT,
    width: getPlatformWidth()
};
exports.directoryDetailRow= {
    backgroundColor: "#fff",
    color: '#333',
    fontColor: "#333",
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold'
};
exports.directoryDetailRowLabel= {
    font: {
        fontWeight: 'bold',
        fontSize: 14,
        color: "#333",
        fontColor: "#333"
    },
    textAlign: 'right',
    color: '#333',
    left: 10,
    width: 75
};
exports.directoryLinkLabel= {
    color: "#4365af"
};
exports.directoryDetailRowValue= {
    color: '#000',
    font: {
        fontSize: 14
    },
    left: 75 + 10 + 10,
    width: getPlatformWidth() - 100 - 10 - 10 - 10
};
exports.directoryDetailValueNoLabel= {
    font: {
        fontSize: 14,
        fontWeight: 'normal'
    },
    color: '#333',
    textAlign: 'center',
    left: 10,
    width: getPlatformWidth() - (10 * 2)
};
// MAP STYLES
exports.mapView= {
    top: defaults.TITLEBAR_HEIGHT + defaults.SEARCHBAR_HEIGHT,
    height: getPlatformHeight() - (defaults.TITLEBAR_HEIGHT + defaults.SEARCHBAR_HEIGHT + defaults.STATUSBAR_HEIGHT + 50 /*mapNavView.height*/),
    mapType: Titanium.Map.STANDARD_TYPE,
    regionFit: true,
    animate: true,
    userLocation: false
};
exports.mapAnnotation= {
    
};
exports.mapCategoryRow= {
    font: {
        fontSize: 12
    },
    hasChild: true
};
exports.mapCategoryCount= {
    backgroundColor:'#ccc',
    width: OS === 'iphone' ? 30 : 50, 
    height:30, 
    right: 15, 
    borderRadius: 5, 
    fontWeight: 'bold',
    font: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    textAlign: 'center'
};
exports.mapNavView= {
    top: getPlatformHeight() - 50 - defaults.STATUSBAR_HEIGHT,
    height              : 50,
    backgroundGradient  : defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
};
exports.mapButtonBar= {
    color: '#fff',
    backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
    style: OS === "iphone" ? Titanium.UI.iPhone.SystemButtonStyle.BAR : "",
    height: OS === "iphone" ? 35 : 50
};
exports.mapDetailTopView= {
    top: defaults.TITLEBAR_HEIGHT,
    left: 0,
    backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
    height: 206
};
exports.mapDetailTableView= {
    top: defaults.TITLEBAR_HEIGHT,
    style: Titanium.UI.iPhone.TableViewStyle.GROUPED
};
exports.mapDetailImageRow= {
    height: 220
};
exports.mapDetailLocationTitle= {
    left: 10,
    top: 10,
    height: 72,
    font: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    color: "#000",
    textAlign: "left"
};
exports.mapDetailLocationAddress= {
    left: 10,
    top: 82,
    height: 74,
    font: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    color: "#333",
    textAlign: "left"
};
exports.mapDetailLocationPhoto= {
    width: Titanium.Platform.displayCaps.platformWidth,
    top: defaults.TITLEBAR_HEIGHT + 206,
    height: 241
};
// ACTIVITY INDICATOR STYLING
exports.globalActivityIndicator= {
    top: defaults.TITLEBAR_HEIGHT,
    width: getPlatformWidth(),
    height: getPlatformHeight() - defaults.TITLEBAR_HEIGHT,
    color: '#fff',
    zIndex: 1000,
    backgroundImage: 'img/bgActivityIndicator.png'
};
exports.activityIndicatorDialog= {
    width: getPlatformWidth() > 480 ? 360 : Math.round(getPlatformWidth() * 0.75),
    height: 75,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundImage: 'img/bgActivityIndicatorDialog.png'
};
exports.activityIndicatorMessage= {
    textAlign: 'center',
    fontSize: 18,
    color: "#fff",
    font: {
        fontWeight: 'bold'
    }
};
    
//iPhone-specific overrides
if (OS === 'iphone' || OS === 'ipad') {
    exports.directoryDetailAttributeTable.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;
    exports.contentButton = {
        style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
        height: 30,
        width: 100,
        backgroundGradient: {
            backFillStart: false,
            type: 'linear',
            colors: ['#fff','#ccc']
        },
        backgroundGradientPress: {
            backFillStart: false,
            type: 'linear',
            colors: ['#ccc', '#fff']
        },
        font: {
            fontSize: 14,
            fontWeight: 'bold'
        },
        borderRadius: 10,
        borderColor: '#999',
        borderWidth: 1,
        color: '#333',
        selectedColor: '#333'
    };
    exports.mapAnnotation.pincolor = Titanium.Map.ANNOTATION_RED;
    exports.secondaryNavBarButton.image = exports.secondaryNavBarButton.optionalImage;
    exports.secondaryNavBarButton.width = 70;
}

if(OS === 'android') {
    exports.titleBar.backgroundImage = '/img/titlebarbg.png';
    exports.searchBar.backgroundImage = '/img/secondarybarbg.png';
    exports.mapNavView.backgroundImage = '/img/secondarybarbg.png';
    exports.secondaryNavBar.backgroundImage = '/img/secondarybarbg.png';
    exports.homeGuestNote.backgroundImage = '/img/secondarybarbg.png';
    exports.mapAnnotation.image = '/img/mapPin.png';
}