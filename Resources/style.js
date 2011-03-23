/*
This is a javascript dictionary for application styles, in lieu of a stylesheet. (Titanium's JSS is not a suitable option, due to Android bugs and lack of support)
It is attached to the facade singleton that's shared with the entire application.
Right now, it's unsophisticated with only one level of encapsulation. titleBarButton.
To apply styles to elements
*/

Ti.include('lib.js');

var styles = {
    titleBar: {
        top: 0,
    	left: 0,
    	height: 40,
    	backgroundColor: '#000',
    	width: Titanium.Platform.displayCaps.platformWidth
    },
    //Titanium.UI.Button implemented in the GenericTitleBar
    titleBarButton: {
        left: 10,
        width: 50,
        height: 30,
    	backgroundImage: 'none',
    	backgroundColor: '#333',
    	color: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#333',
    	font: {
    	    fontSize: '24px'
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
    //Titanium.UI.View with home icon implemented in GenericTitleBar
    titleBarHomeButton: {
        image: UPM.getResourcePath("icons/tab-home.png"),
        width: 18,
        height: 18,
        left: 10
    },
    //
    titleBarSettingsButton: {
	    height: 18,
	    width: 18,
	    image: UPM.getResourcePath("icons/tab-settings.png"),
	    left: Ti.Platform.displayCaps.platformWidth - 28
	}
};