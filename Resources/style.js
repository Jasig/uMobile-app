/*
This is a javascript dictionary for application styles, in lieu of a stylesheet. (Titanium's JSS is not a suitable option, due to Android bugs and lack of support)
It is attached to the facade singleton that's shared with the entire application.
Right now, it's unsophisticated with only one level of encapsulation. titleBarButton.
To apply styles to elements
*/

Ti.include('lib.js');
var TITLEBAR_HEIGHT = 40,
DETAIL_TOP_TITLE_COLOR = '#333',
DETAIL_TOP_BACKGROUND_COLOR = '#eee',
PRIMARY_BAR_BACKGROUND_COLOR = "#000";
SECONDARY_BAR_BACKGROUND_COLOR = "#333";
styles = {
    view: {
        backgroundColor: '#fff',
        top: TITLEBAR_HEIGHT
    },
    portletView: {
        top: TITLEBAR_HEIGHT
    },
    contentButton: {
        style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
        height: 30,
        width: 100,
        backgroundGradient: {
            backFillStart: false,
            type: 'linear',
            colors: ['#fff','#ccc']
        },
        backgroundSelectedColor: '#eee',
        selectedColor: '#000',
        font: {
            fontSize: 14,
            fontWeight: 'bold'
        },
        borderRadius: 10,
        borderColor: '#999',
        borderWidth: 1,
        color: '#333'
    },
    textField: {
        height:35,
    	width:150,
    	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
    },
    textFieldLabel: {
        height:35,
        width:'auto',
        color: '#000'
    },
    //Global search bar properties
    searchBar: {
        top: TITLEBAR_HEIGHT,
        height: TITLEBAR_HEIGHT,
        backgroundColor: SECONDARY_BAR_BACKGROUND_COLOR,
        barColor: SECONDARY_BAR_BACKGROUND_COLOR,
        showCancel: true
    }, 
    //Styles for GenericTitleBar.js
    titleBar: {
        top: 0,
    	left: 0,
    	height: 40,
    	backgroundColor: PRIMARY_BAR_BACKGROUND_COLOR,
    	backgroundGradient: {
    	    type:'linear',
            colors:['#333','#000']
    	},
    	width: Titanium.Platform.displayCaps.platformWidth
    },
    //Titanium.UI.Button implemented in the GenericTitleBar
    titleBarButton: {
        style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
        left: 10,
        width: 50,
        height: 30,
    	backgroundImage: 'none',
    	color: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#000',
    	font: {
    	    fontSize: 14
    	},
    	backgroundGradient: {
    	    backFillStart: false,
    	    type:'linear',
            colors:['#666','#333']
    	}
    },
    //Titanium.UI.Label implemented in GenericTitleBar
    titleBarLabel: {
    	textAlign: "center",
        color: '#fff',
        font: {
            fontWeight: "bold"
        }
    },
    //Titanium.UI.View with home icon implemented in GenericTitleBar on left-hand side
    titleBarHomeButton: {
        image: UPM.getResourcePath("icons/tab-home.png"),
        width: 18,
        height: 18,
        left: 10
    },
    //Titanium.UI.View with settings icon implemented in GenericTitleBar on right-hand side
    titleBarSettingsButton: {
	    height: 18,
	    width: 18,
	    image: UPM.getResourcePath("icons/tab-settings.png"),
	    left: Ti.Platform.displayCaps.platformWidth - 28
	},
	secondaryNavBar: {
        top: 0,
    	left: 0,
    	height: TITLEBAR_HEIGHT,
    	backgroundColor: SECONDARY_BAR_BACKGROUND_COLOR,
    	width: Titanium.Platform.displayCaps.platformWidth
    },
    secondaryNavBarButton: {
        style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
        left: 10,
        width: 50,
        height: 30,
    	backgroundImage: 'none',
    	color: '#333',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#ccc',
    	font: {
    	    fontSize: 14
    	},
    	backgroundGradient: {
    	    backFillStart: false,
    	    type:'linear',
            colors:['#fff','#ccc']
    	}
    },
    secondaryNavBarLabel: {
        textAlign: "center",
        color: '#fff',
        font: {
            fontWeight: "bold"
        }
    },
	//DIRECTORY STYLES
	contactDetailView: {
	    backgroundColor: DETAIL_TOP_BACKGROUND_COLOR,
        visible: false,
	    top: 0,
        height: Ti.Platform.displayCaps.platformHeight,
        width: Ti.Platform.displayCaps.platformWidth
	},
	directoryDetailNameLabel: {
	    top: TITLEBAR_HEIGHT,
        left: 10,
        height: 85,
        color: DETAIL_TOP_TITLE_COLOR,
        font: {
            fontSize: 24,
            fontWeight: 'bold'
        }
	},
	directoryDetailAttributeTable: {
	    top: 125
	},
	// MAP STYLES
	mapView: {
	    top: TITLEBAR_HEIGHT * 2,
        mapType: Titanium.Map.STANDARD_TYPE,
        region:{
            latitude: 41.3104425,
            longitude: -72.9254028,
            latitudeDelta:0.01,
            longitudeDelta:0.01
        },
        regionFit:false,
        userLocation:true
	},
	mapButtonBar: {
	     labels: ['+', '-'],
	     color: '#fff',
           backgroundColor: SECONDARY_BAR_BACKGROUND_COLOR,
           style: Titanium.UI.iPhone.SystemButtonStyle.BAR,
           top: Ti.Platform.displayCaps.platformHeight - 140,
           width: 100,
           height: 35
	},
	mapDetailTopView: {
	    top: TITLEBAR_HEIGHT,
        left: 0,
        backgroundColor: DETAIL_TOP_BACKGROUND_COLOR,
        height: 100
	},
	mapDetailLocationAddress: {
	    left: 10,
	    top: 10,
        height: 36,
	    font: {
            fontSize: 24,
            fontWeight: 'bold'
        },
        color: "#333",
        textAlign: "left"
	},
	mapDetailLocationPhoto: {
	    width: Titanium.Platform.displayCaps.platformWidth,
        top: 140,
        height: 241
	},
	// ACTIVITY INDICATOR STYLING
	globalActivityIndicator: {
        width: Ti.Platform.displayCaps.platformWidth,
        height: Ti.Platform.displayCaps.platformHeight,
        backgroundImage: UPM.getResourcePath('images/bgActivityIndicator.png'),
        style: Titanium.UI.iPhone.ActivityIndicatorStyle.BIG
	}
};