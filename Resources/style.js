/*
This is a javascript dictionary for application styles, in lieu of a stylesheet. (Titanium's JSS is not a suitable option, due to Android bugs and lack of support)
It is attached to the facade singleton that's shared with the entire application.
Right now, it's unsophisticated with only one level of encapsulation. titleBarButton.
To apply styles to elements
*/

Ti.include('lib.js');
var TITLEBAR_HEIGHT = 40,
DETAIL_TOP_TITLE_COLOR = '#fff',
DETAIL_TOP_BACKGROUND_COLOR = '#333',
styles = {
    view: {
        backgroundColor: '#fff'
    },
    //Global search bar properties
    searchBar: {
        height:50,
        barColor: "#333",
        showCancel: true
    },
    //Styles for GenericTitleBar.js
    titleBar: {
        top: 0,
    	left: 0,
    	height: 40,
    	backgroundColor: '#000',
    	backgroundGradient: {
    	    type:'linear',
            colors:['#333','#000']
    	},
    	width: Titanium.Platform.displayCaps.platformWidth
    },
    //Titanium.UI.Button implemented in the GenericTitleBar
    titleBarButton: {
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
	}
};