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


var defaults, OS = Ti.Platform.osname, deviceProxy = require('/js/models/DeviceProxy');
exports.updateStyles = function () {
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
        top: defaults.TITLEBAR_HEIGHT + 'dp'
    };
    exports.tableView = {
        top: 0,
        bottom: 0,
        layout: 'vertical',
        contentHeight: 'auto'
    };
    exports.tableSectionHeader = {
        height: '40dp',
        width: '100%',
        backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
    };
    exports.tableSectionHeaderLabel = {
        left: '10dp',
        color: '#ffffff',
        textAlign: 'left',
        touchEnabled: false,
        font: {
            fontWeight: 'bold',
            fontSize: '14dp'
        }
    };
    exports.tableRowIcon = {
        left: '10dp',
        touchEnabled: false,
        width: OS === 'ipad' ? 72 : '57dp',
        height: OS === 'ipad' ? 72 : '57dp'
    };
    exports.tableRow = {
        width: '100%',
        height: OS === 'ipad' ? 82 : '67dp',
        rawHeight: OS === 'ipad' ? 82 : 67,
        backgroundColor: '#eee',
        backgroundGradient: {
            type: 'linear',
            colors: ['#fff', '#eee']
        }
    };
    exports.tableRowArrow = {
        width: '22dp',
        height: '22dp',
        right: '20dp',
        image: '/images/portlet-list-arrow.png',
        touchEnabled: false
    };
    exports.tableRowLabel = {
        left: OS === 'ipad' ? 92 : '77dp',
        color: '#333',
        textAlign: 'left',
        touchEnabled: false,
        font: {
            fontSize: '14dp'
        }
    };
    exports.portletView= {
        top: defaults.TITLEBAR_HEIGHT + 'dp',
        bottom: 0
        // height: deviceProxy.retrieveHeight(true) - defaults.TITLEBAR_HEIGHT - defaults.STATUSBAR_HEIGHT + 'dp',
        // heightWithSecondary: deviceProxy.retrieveHeight(true) - (defaults.TITLEBAR_HEIGHT * 2) - defaults.STATUSBAR_HEIGHT + 'dp'
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
    exports.textField = {
        height: OS === 'iphone' ? '35' : '45dp',
    	width: '150dp',
    	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
    };
    exports.textFieldLabel= {
        height: '35dp',
        width:'auto',
        color: '#000'
    };
    //Settings Properties
    exports.settingsTable= {
        top: defaults.TITLEBAR_HEIGHT + 'dp',
        style: OS === 'iphone' || OS === 'ipad' ? Titanium.UI.iPhone.TableViewStyle.GROUPED : 0
    };
    exports.settingsWindow = {
        backgroundColor: exports.backgroundColor,
        navBarHidden: true,
        fullScreen: false,
        orientationModes: [
        	Titanium.UI.PORTRAIT,
        	Titanium.UI.UPSIDE_PORTRAIT,
        	Titanium.UI.LANDSCAPE_LEFT,
        	Titanium.UI.LANDSCAPE_RIGHT,
        	Titanium.UI.FACE_UP,
        	Titanium.UI.FACE_DOWN
        ]
    };
    exports.settingsPasswordInput= {
      height: OS === 'iphone' ? '35' : '45dp',
    	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
        passwordMask: true,
        left: '100dp',
        width: OS === 'iphone' ? deviceProxy.retrieveWidth() - 100 - 30 : '190dp',
        autocapitalization: Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    };
    exports.settingsPasswordLabel= {
        height:'35dp',
        width:'auto',
        color: '#000',
        left: '10dp'
    };
    exports.settingsUsernameInput= {
        height: OS === 'iphone' ? 35 : '45dp',
    	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
        left: '100dp',
        width: OS === 'iphone' ? deviceProxy.retrieveWidth() - 100 - 30 : '190dp',
        autocapitalization: Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    };
    exports.settingsUsernameLabel= {
        height:'35dp',
        width:'auto',
        color: '#000',
        left: '10dp'
    };
    exports.settingsResetPasswordLabel= {
        font: {
            fontSize: '12dp'
        },
        left: '10dp',
        height: '40dp',
        color: "#036",
        textDecoration: 'underline'
    };
    exports.contentButton= {
        font: {
            fontSize: '14dp',
            fontWeight: 'bold'
        },
        height: '40dp',
        width: '100dp',
        backgroundGradient: {},
        backgroundGradientPress: {}
    };
    //Global search bar properties
    exports.searchBar= {
        top: defaults.TITLEBAR_HEIGHT +'dp',
        height: defaults.SEARCHBAR_HEIGHT + 'dp',
        getHeight: defaults.SEARCHBAR_HEIGHT,
        backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
        barColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
        backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
        showCancel: OS === 'android' ? false : true,
        width: '100%'
    };
    exports.searchBarInput= {
        width: '96%',
        height: defaults.SEARCHBAR_HEIGHT - 7 + 'dp',
        top: '5dp',
        borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE,
        softKeyboardOnFocus: Titanium.Platform.osname === 'android' ? Titanium.UI.Android.SOFT_KEYBOARD_DEFAULT_ON_FOCUS : false
    };
    //Styles for TitleBar
    exports.titleBar= {
        top: 0,
    	left: 0,
    	height: defaults.TITLEBAR_HEIGHT,
        backgroundGradient: defaults.PRIMARY_BAR_BACKGROUND_GRADIENT,
        width: '100%',
    	zIndex: 50
    };
    //Titanium.UI.Button implemented in the GenericTitleBar
    exports.titleBarButton= {
        style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
        left: '10dp',
        width: '50dp',
        height: '30dp',
    	backgroundImage: 'none',
    	color: '#fff',
        borderWidth: '1dp',
        borderRadius: '10dp',
        borderColor: '#000',
    	font: {
    	    fontSize: '14dp'
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
            fontSize: '18dp'
        }
    };
    exports.titleBarHomeContainer= {
        width: '40dp',
        height: '30dp',
        borderRadius: 5,
        backgroundColor: 'transparent',
        backgroundColorPressed: "#999",
        left: '5dp'
    };
    exports.titleBarInfoContainer= {
        width: '40dp',
        height: '30dp',
        borderRadius: 5,
        backgroundColor: 'transparent',
        backgroundColorPressed: '#999',
        left: '5dp'
    };
    exports.titleBarInfoButton= {
        image: "/images/tab-info.png",
        width: '20dp',
        height: '20dp',
        touchEnabled: false
    };
    //Titanium.UI.View with home icon implemented in GenericTitleBar on left-hand side
    exports.titleBarHomeButton= {
        image: "/images/tab-home.png",
        touchEnabled: false,
        width: '18dp',
        height: '18dp'
    };
    //Titanium.UI.View with settings icon implemented in GenericTitleBar on right-hand side
    exports.titleBarSettingsContainer= {
        width: '40dp',
        height: '30dp',
        borderRadius: 5,
        backgroundColor: 'transparent',
        backgroundColorPressed: "#999",
        // left: deviceProxy.retrieveWidth(true) - 40 - 5 + 'dp'
        right: '5dp'
    };
    exports.titleBarSettingsButton= {
        height: '18dp',
        width: '18dp',
        image: "/images/tab-settings.png",
        touchEnabled: false
    };
    exports.secondaryNavBar= {
    	left: 0,
    	height: defaults.TITLEBAR_HEIGHT + 'dp',
    	getHeight: defaults.TITLEBAR_HEIGHT,
    	backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
    	backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
    	width: '100%'
    };

    // Styles for new prototype in v1.1, views/SecondaryNav.js
    exports.secondaryNavLabel= {
        width: deviceProxy.retrieveWidth(true) - 70 * 2 - 10 * 4 + 'dp',
        height: defaults.TITLEBAR_HEIGHT + 'dp',
        color: defaults.SECONDARY_BAR_COLOR,
        textAlign: "center",
        ellipsize: true,
        wordWrap: false,
        minimumFontSize: '14dp',
        font: {
            fontSize: '14dp',
            fontWeight: 'bold'
        }
    };

    exports.secondaryNavButton= {
        style: OS === 'iphone' ? Titanium.UI.iPhone.SystemButtonStyle.PLAIN : 0,
        plainLeft: 10,
        width: '50dp',
        plainWidth: 50,
        height: '30dp',
        plainHeight: 30,
        optionalImage: '/images/back-icon.png',
    	backgroundImage: '/images/secondarybarbtnbg.png',
    	backgroundSelectedImage: '/images/secondarybarbtnbg_press.png',
    	color: '#fff',
    	selectedColor: "#fff",
        borderRadius: 10,
        borderColor: '#294D6B',
        borderWidth: 1,
    	font: {
    	    fontSize: '12dp',
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
        top: defaults.TITLEBAR_HEIGHT + 'dp',
        bottom: 0,
        bottomWithNote: '40dp',
        width: '100%',
        // height: deviceProxy.retrieveHeight(true) - defaults.TITLEBAR_HEIGHT - defaults.STATUSBAR_HEIGHT + 'dp',
        backgroundColor: "#2A4F95"
    };
    exports.homeGrid= {
        top: 0,
        // height: deviceProxy.retrieveHeight(true) - defaults.TITLEBAR_HEIGHT - defaults.STATUSBAR_HEIGHT + 'dp',
        // heightWithNote: deviceProxy.retrieveHeight(true) - defaults.TITLEBAR_HEIGHT - defaults.STATUSBAR_HEIGHT - 40 +'dp',
        heightWithNote: '100%',
        height: '100%',
        color: "#fff",
        contentHeight:'auto',
        width: '100%',
        zIndex: 1
    };
    exports.portalFolderView = {
        top: 0,
        backgroundColor: '#fff',
        width:'100%',
        height: '100%'
    };
    exports.portalRowContainer = {
        layout: 'vertical',
        height: '100%',
        contentHeight: 'auto',
        width: '100%'
    };
    exports.portalFolderHeader = {
        height: '40dp',
        width: '100%',
        backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
    };
    exports.portalFolderLabel = {
        left: '10dp',
        color: '#ffffff',
        textAlign: 'left',
        touchEnabled: false,
        font: {
            fontWeight: 'bold',
            fontSize: '14dp'
        }
    };
    exports.portletRowIcon = {
        left: '10dp',
        touchEnabled: false,
        width: OS === 'ipad' ? 72 : '57dp',
        height: OS === 'ipad' ? 72 : '57dp'
    };
    exports.portletRowBadgeBackground= {
        top: '3dp', 
        left: OS === 'ipad' ? 65 : '53dp',
        height: OS === 'ipad' ? 20 : '16dp',
        width: OS === 'ipad' ? 20 : '16dp',
        image: OS === 'ipad' ? '/images/badgeBackground_72.png' : '/images/badgeBackground.png'
    };
    exports.portletRowBadgeNumber= {
        textAlign: "center",
        color: "#fff",
        font: { 
            fontSize: OS === 'ipad' ? '12dp' : '10dp',
            fontWeight: "bold",
            textAlign: "center"
        },
        height: OS === 'ipad' ? 20 : '16dp',
        width: OS === 'ipad' ? 20 : '16dp',
        touchEnabled: false

    };
    exports.portletRow = {
        width: '100%',
        height: OS === 'ipad' ? 82 : '67dp',
        rawHeight: OS === 'ipad' ? 82 : 67,
        backgroundColor: '#eee',
        backgroundGradient: {
            type: 'linear',
            colors: ['#fff', '#eee']
        }
    };
    exports.portletRowArrow = {
        width: '22dp',
        height: '22dp',
        right: '20dp',
        image: '/images/portlet-list-arrow.png',
        touchEnabled: false
    };
    exports.portletRowLabel = {
        left: OS === 'ipad' ? 92 : '77dp',
        color: '#333',
        textAlign: 'left',
        touchEnabled: false,
        font: {
            fontSize: '14dp'
        }
    };
    
    exports.homeGuestNote = {
        height: '40dp',
        rawHeight: 40,
        bottom: 0,
        backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
        emergencyBackgroundImage: '/images/secondarybarbg-emergency.png',
        emergencyBackgroundGradient: {
            type:'linear',
                colors:['#cc0000','#aa0000']
        }
    };
    exports.homeGuestNoteLabel= {
        color: "#fff",
        textAlign: 'center',
        font: {
            fontSize: '14dp',
            fontWeight: 'bold'
        }
    };
    exports.gridIcon= {
        top: 0,
        canScale: false,
        width: OS === 'ipad' ? 72 : OS === 'iphone' ? 57 :'auto',
        height: OS === 'ipad' ? 72 : OS === 'iphone' ? 57 :'auto',
        type: 'gridIcon'
    };
    exports.gridItem= {
        width: OS === 'ipad' ? (768 / 4 - 50) : 80,
        height: OS === 'ipad' ? (72 + 20) : (57 + 20),
        padding: 10,
        pressOpacity: 0.5,
        type: 'gridItem'
    };
    exports.gridItemLabel= {
        textAlign: "center",
        shadowColor: "#000",
        shadowOffset: { x:0 , y:1 },
        font: { 
            fontSize: '14dp',
            family: 'HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,sans-serif'
        },
        top: OS === 'ipad' ? 72 : 57,
        color: "#fff",
        touchEnabled: false

    };
    exports.gridBadgeBackground= {
        top: 0, 
        right: OS === 'ipad' ? 35 : '11dp',
        height: OS === 'ipad' ? 20 : '16dp',
        width: OS === 'ipad' ? 20 : '16dp',
        image: OS === 'ipad' ? '/images/badgeBackground_72.png' : '/images/badgeBackground.png'
    };
    exports.gridBadgeNumber= {
        textAlign: "center",
        color: "#fff",
        font: { 
            fontSize: OS === 'ipad' ? '14dp' : '12dp',
            fontWeight: "bold",
            textAlign: "center"
        },
        top: 0,
        right: OS === 'ipad' ? 35 : '11dp',
        height: OS === 'ipad' ? 20 : '16dp',
        width: OS === 'ipad' ? 20 : '16dp',
        touchEnabled: false

    };
    //DIRECTORY STYLES
    exports.contactDetailView= {
        backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
        visible: false,
        top: defaults.TITLEBAR_HEIGHT + 'dp',
        bottom: 0,
        width: '100%',
        modal: true
    };

    exports.directoryDetailAttributeTable= {
        top: defaults.TITLEBAR_HEIGHT + 'dp',
        width: '100%'
    };
    exports.directoryDetailRow= {
        backgroundColor: "#fff",
        color: '#333',
        fontColor: "#333",
        textAlign: 'center',
        fontSize: '14dp',
        fontWeight: 'bold'
    };
    exports.directoryDetailRowLabel= {
        font: {
            fontWeight: 'bold',
            fontSize: '14dp',
            color: "#333",
            fontColor: "#333"
        },
        textAlign: 'right',
        color: '#333',
        left: '10dp',
        width: '75dp'
    };
    exports.directoryLinkLabel= {
        color: "#4365af"
    };
    exports.directoryDetailRowValue= {
        color: '#000',
        font: {
            fontSize: '14dp'
        },
        left: 75 + 10 + 10 + 'dp',
        width: deviceProxy.retrieveWidth(true) - 100 - 10 - 10 - 10 + 'dp'
    };
    exports.directoryDetailValueNoLabel= {
        font: {
            fontSize: '14dp',
            fontWeight: 'normal'
        },
        color: '#333',
        textAlign: 'center',
        left: '10dp',
        width: deviceProxy.retrieveWidth(true) - (10 * 2) + 'dp'
    };
    // MAP STYLES
    exports.mapWindow = {
        backgroundColor: exports.backgroundColor,
        exitOnClose: false,
        navBarHidden: true,
        orientationModes: [
            Titanium.UI.PORTRAIT,
            Titanium.UI.UPSIDE_PORTRAIT,
            Titanium.UI.LANDSCAPE_LEFT,
            Titanium.UI.LANDSCAPE_RIGHT
        ]
    };
    exports.mapView= {
        top: defaults.TITLEBAR_HEIGHT * 2 + 'dp',
        // height: deviceProxy.retrieveHeight(true) - (defaults.TITLEBAR_HEIGHT * 2 + defaults.STATUSBAR_HEIGHT + 50) + 'dp',
        bottom: '50dp',
        mapType: Titanium.Map.STANDARD_TYPE,
        regionFit: true,
        animate: true,
        userLocation: false
    };
    exports.mapAnnotation= {

    };
    exports.mapTableView = {
        top: defaults.TITLEBAR_HEIGHT * 2 + 'dp',
        bottom: '50dp',
        rowHeight: '50dp'
    };
    exports.mapCategoryRow= {
        font: {
            fontSize: '12dp'
        },
        hasChild: true
    };
    exports.mapCategoryCount= {
        backgroundColor:'#ccc',
        width: OS === 'iphone' ? 30 : '50dp', 
        height: '30dp', 
        right: '15dp', 
        borderRadius: 5, 
        fontWeight: 'bold',
        font: {
            fontSize: '12dp',
            fontWeight: 'bold'
        },
        textAlign: 'center'
    };
    exports.mapNavView= {
        bottom: 0,
        height : '50dp',
        backgroundGradient : defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
    };
    exports.mapButtonBar= {
        color: '#fff',
        backgroundColor: deviceProxy.isIOS() ? defaults.SECONDARY_BAR_BACKGROUND_COLOR : 'transparent',
        style: OS === "iphone" ? Titanium.UI.iPhone.SystemButtonStyle.BAR : "",
        height: OS === "iphone" || OS === "ipad" ? 35 : '50dp',
        getHeight: OS === "iphone" ? 35 : 50,
        layout: 'horizontal',
        width: deviceProxy.isAndroid() ? '100%' : 225
    };
    exports.tabbedBarButton = {
        color: "#fff",
        font: {
            fontSize: '14dp',
            fontWeight: 'bold'
        },
        height: '100%',
        top: 0,
        borderRadius: 0,
        backgroundImage: '/images/secondarybarbg.png',
        backgroundDisabledImage: '/images/secondarybarbtnbg_press.png'
    };
    exports.mapDetailView = {
        top: defaults.TITLEBAR_HEIGHT + defaults.TITLEBAR_HEIGHT +'dp'
    };
    exports.mapDetailTopView= {
        top: defaults.TITLEBAR_HEIGHT+'dp',
        left: 0,
        backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
        height: '206dp'
    };
    exports.mapDetailTableView= {
        style: OS === 'iphone' || OS === 'ipad' ? Titanium.UI.iPhone.TableViewStyle.GROUPED : 0,
        rowHeight: '50dp'
    };
    exports.mapDetailImageRow= {
        height: '220dp'
    };
    exports.mapDetailLocationTitle= {
        left: '10dp',
        top: '10dp',
        height: '72dp',
        font: {
            fontSize: '24dp',
            fontWeight: 'bold'
        },
        color: "#000",
        textAlign: "left"
    };
    exports.mapDetailLocationAddress= {
        left: '10dp',
        top: '82dp',
        height: '74dp',
        font: {
            fontSize: '18dp',
            fontWeight: 'bold'
        },
        color: "#333",
        textAlign: "left"
    };
    exports.mapDetailLocationPhoto= {
        width: '100%',
        top: defaults.TITLEBAR_HEIGHT + 206 + 'dp',
        height: '241dp'
    };
    // ACTIVITY INDICATOR STYLING
    exports.globalActivityIndicator= {
        top: 0,
        width: '100%',
        height: '100%',
        color: '#fff',
        backgroundImage: '/images/bgActivityIndicator.png',
        zIndex: 49
    };
    exports.activityIndicatorDialog= {
        width: (deviceProxy.retrieveWidth(true) > 480) ? '360dp' : '75%',
        height: '75dp',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#fff",
        backgroundImage: '/images/bgActivityIndicatorDialog.png'
    };
    exports.activityIndicatorMessage= {
        textAlign: 'center',
        color: "#fff",
        font: {
            fontSize: '14dp',
            fontWeight: 'bold'
        }
    };
    
    //iPhone-specific overrides
    if (OS === 'iphone' || OS === 'ipad') {
        exports.directoryDetailAttributeTable.style = OS === 'iphone' || OS === 'ipad' ? Titanium.UI.iPhone.TableViewStyle.GROUPED : 0;
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
        exports.mapAnnotation.rightButton = Titanium.UI.iPhone.SystemButtonStyle.BORDERED;
    }
    
    if (OS === 'android') {
        exports.portalFolderHeader.backgroundImage = '/images/secondarybarbg.png';
        exports.portletRow.backgroundImage = '/images/portlet-row.png';
        exports.titleBar.backgroundImage = '/images/titlebarbg.png';
        exports.searchBar.backgroundImage = '/images/secondarybarbg.png';
        exports.mapNavView.backgroundImage = '/images/secondarybarbg.png';
        exports.secondaryNavBar.backgroundImage = '/images/secondarybarbg.png';
        exports.homeGuestNote.backgroundImage = '/images/secondarybarbg.png';
        exports.mapAnnotation.pincolor = Titanium.Map.ANNOTATION_RED;
    }
    
    return exports;
};

exports.updateStyles();