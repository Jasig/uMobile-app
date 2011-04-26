/*
This is a javascript dictionary for application styles, in lieu of a stylesheet. (Titanium's JSS is not a suitable option, due to Android bugs and lack of support)
It is attached to the facade singleton that's shared with the entire application.
Right now, it's unsophisticated with only one level of encapsulation. titleBarButton.
To apply styles to elements
*/

var Styles = function (app) {
    var defaults, stylesheet, OS = Ti.Platform.osname;
    defaults = {
        TITLEBAR_HEIGHT: 40,
        SEARCHBAR_HEIGHT: 40,
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
        SECONDARY_BAR_BTN_DOWN_BG: {
            type: 'linear',
            colors: ['#294D6B','#4682B4']
        },
        SECONDARY_BAR_COLOR: "#fff"
    };
    
    stylesheet = {
        backgroundColor: '#fff',
        view: {
            backgroundColor: '#fff',
            top: defaults.TITLEBAR_HEIGHT
        },
        portletView: {
            top: defaults.TITLEBAR_HEIGHT
        },
        textField: {
            height: OS === 'iphone' ? 35 : 45,
        	width: 150,
        	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
        },
        textFieldLabel: {
            height:35,
            width:'auto',
            color: '#000'
        },
        contentButton: {
            font: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            height: 40,
            width: 100,
            backgroundGradient: {
                
            },
            backgroundGradientPress: {
            },
            color: '#333',
            selectedColor: '#333'
        },
        //Global search bar properties
        searchBar: {
            top: defaults.TITLEBAR_HEIGHT,
            height: defaults.SEARCHBAR_HEIGHT,
            backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
            barColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
            backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
            showCancel: OS === 'android' ? false : true,
            width: Ti.Platform.displayCaps.platformWidth
        },
        secondaryBar: {
            top: defaults.TITLEBAR_HEIGHT,
            height: defaults.TITLEBAR_HEIGHT,
            barColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
            backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
        },
        secondaryBarButton: {
            style: Titanium.UI.iPhone.SystemButtonStyle.PLAIN,
            left: 10,
            width: 50,
            height: 30,
        	backgroundImage: 'none',
        	color: '#fff',
            borderWidth: 1,
            borderRadius: 5,
            borderColor: '#333',
        	font: {
        	    fontSize: 14
        	},
        	backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
        	backgroundGradientPress: defaults.SECONDARY_BAR_BTN_DOWN_BG
        },
        //Styles for GenericTitleBar.js
        titleBar: {
            top: 0,
        	left: 0,
        	height: defaults.TITLEBAR_HEIGHT,
            backgroundGradient: defaults.PRIMARY_BAR_BACKGROUND_GRADIENT,
        	width: Titanium.Platform.displayCaps.platformWidth,
        	zIndex: 1
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
        titleBarHomeContainer: {
            width: 40,
            height: 30,
            borderRadius: 5,
            backgroundColor: 'transparent',
            backgroundColorPressed: "#999",
            left: 5
        },
        //Titanium.UI.View with home icon implemented in GenericTitleBar on left-hand side
        titleBarHomeButton: {
            image: app.models.resourceProxy.getResourcePath("icons/tab-home.png"),
            width: 18,
            height: 18
        },
        //Titanium.UI.View with settings icon implemented in GenericTitleBar on right-hand side
        titleBarSettingsContainer: {
            width: 40,
            height: 30,
            borderRadius: 5,
            backgroundColor: 'transparent',
            backgroundColorPressed: "#999",
            left: Ti.Platform.displayCaps.platformWidth - 40 - 5
        },
        titleBarSettingsButton: {
    	    height: 18,
    	    width: 18,
    	    image: app.models.resourceProxy.getResourcePath("icons/tab-settings.png")
    	},
    	secondaryNavBar: {
            top: 0,
        	left: 0,
        	height: defaults.TITLEBAR_HEIGHT,
        	backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
        	backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT,
        	width: Titanium.Platform.displayCaps.platformWidth
        },
        secondaryNavBarButton: {
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
        	    fontSize: 14,
        	    fontWeight: 'bold'
        	},
        	backgroundGradient: defaults.SECONDARY_BAR_BACKGROUND_GRADIENT
        },
        secondaryNavBarLabel: {
            textAlign: "center",
            color: '#fff',
            font: {
                fontWeight: "bold"
            }
        },
        //PORTAL VIEW STYLES
        homeGrid: {
            top: defaults.TITLEBAR_HEIGHT,
            numColumns: 3,
            color: "#fff",
            contentHeight:'auto',
            backgroundImage: '../../images/home-background.png',
            zIndex: 1
        },
        gridIcon: {
            width: 32,
            height: 32
        },
        gridItem: {
            width: 80,
            height: 80,
            padding: 10,
            pressOpacity: 0.5
        },
        gridItemLabel: {
            textAlign: "center",
            shadowColor: "#000",
            shadowOffset: { x:0 , y:1 },
            font: { 
                size: 10,
                family: 'HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,sans-serif'
            },
            top: 80 - 20,
            color: "#fff",
            touchEnabled: false

        },
        gridBadgeBackground: {
            top: 15, 
            right: 15,
            height: 20,
            width: 20
        },
        gridBadgeNumber: {
            textAlign: "center",
            color: "#fff",
            height: 16,
            width: 16,
            font: { 
                fontSize: 12,
                fontWeight: "bold"
            },
            top: 16, //Magic number, consider constant or another approach
            right: 17,
            touchEnabled: false

        },
    	//DIRECTORY STYLES
    	contactDetailView: {
    	    backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
            visible: false,
    	    top: defaults.TITLEBAR_HEIGHT,
            height: Ti.Platform.displayCaps.platformHeight - defaults.TITLEBAR_HEIGHT,
            width: Ti.Platform.displayCaps.platformWidth
    	},
    	directoryDetailNameLabel: {
            left: 70,
            width: Ti.Platform.displayCaps.platformWidth - (70 * 2),
            height: defaults.TITLEBAR_HEIGHT,
            color: defaults.SECONDARY_BAR_COLOR,
            textAlign: "center",
            font: {
                fontSize: 14,
                fontWeight: 'bold'
            }
    	},
    	directoryDetailAttributeTable: {
    	    top: defaults.TITLEBAR_HEIGHT
    	},
    	directoryDetailRow: {
    	    backgroundColor: "#fff",
    	    color: '#333',
    	    textAlign: 'center',
    	    fontSize: 14,
    	    fontWeight: 'bold'
    	},
    	directoryDetailRowLabel: {
    	    font: {
    	        fontWeight: 'bold',
    	        fontSize: 14
    	    },
    	    textAlign: 'right',
    	    color: '#333',
    	    left: 10,
    	    width: 75
    	},
    	directoryLinkLabel: {
    	    color: "#4365af"
    	},
    	directoryDetailRowValue: {
    	    color: '#f00',
    	    font: {
    	        fontSize: 14
    	    },
    	    left: 75 + 10 + 10,
    	    width: Ti.Platform.displayCaps.platformWidth - 100 - 10 - 10 - 10
    	},
    	directoryDetailValueNoLabel: {
    	    font: {
    	        fontSize: 14,
    	        fontWeight: 'normal'
    	    },
    	    color: '#333',
    	    textAlign: 'center',
    	    left: 10,
    	    width: Ti.Platform.displayCaps.platformWidth - (10 * 2)
    	},
    	// MAP STYLES
    	mapView: {
            top: defaults.TITLEBAR_HEIGHT + defaults.SEARCHBAR_HEIGHT,
            height: Ti.Platform.displayCaps.platformHeight - (defaults.TITLEBAR_HEIGHT + defaults.SEARCHBAR_HEIGHT),
            mapType: Titanium.Map.STANDARD_TYPE,
            regionFit: Titanium.Platform.osname === 'android' ? false : true,
            animate: true,
            userLocation: false
    	},
    	mapAnnotation: {
    	    
    	},
    	mapButtonBar: {
    	     labels: ['+', '-'],
    	     color: '#fff',
               backgroundColor: defaults.SECONDARY_BAR_BACKGROUND_COLOR,
               style: Titanium.UI.iPhone.SystemButtonStyle.BAR,
               top: Ti.Platform.displayCaps.platformHeight - 140,
               width: 100,
               height: 35
    	},
    	mapDetailTopView: {
    	    top: defaults.TITLEBAR_HEIGHT,
            left: 0,
            backgroundColor: defaults.DETAIL_TOP_BACKGROUND_COLOR,
            height: 120
    	},
    	mapDetailLocationTitle: {
    	    left: 10,
    	    top: 10,
            height: 30,
    	    font: {
                fontSize: 24,
                fontWeight: 'bold'
            },
            color: "#000",
            textAlign: "left"
    	},
    	mapDetailLocationAddress: {
    	    left: 10,
    	    top: 40,
            height: 30,
    	    font: {
                fontSize: 18,
                fontWeight: 'bold'
            },
            color: "#333",
            textAlign: "left"
    	},
    	mapDetailLocationPhoto: {
    	    width: Titanium.Platform.displayCaps.platformWidth,
            top: defaults.TITLEBAR_HEIGHT + 120,
            height: 241
    	},
    	// ACTIVITY INDICATOR STYLING
    	globalActivityIndicator: {
    	    top: defaults.TITLEBAR_HEIGHT,
    	    width: Ti.Platform.displayCaps.platformWidth,
    	    height: Ti.Platform.displayCaps.platformHeight - defaults.TITLEBAR_HEIGHT,
    	    color: '#fff',
    	    zIndex: 100
    	}
    };
    //iPhone-specific overrides
    if (Ti.Platform.osname === 'iphone') {
        stylesheet.directoryDetailAttributeTable.style = Titanium.UI.iPhone.TableViewStyle.PLAIN;
        stylesheet.globalActivityIndicator.backgroundImage = app.models.resourceProxy.getResourcePath('images/bgActivityIndicator.png');
        stylesheet.globalActivityIndicator.width = Ti.Platform.displayCaps.platformWidth;
        stylesheet.globalActivityIndicator.height = Ti.Platform.displayCaps.platformHeight;
        stylesheet.globalActivityIndicator.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
        stylesheet.contentButton = {
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
            borderRadius: (OS === 'iphone') ? 10 : 0,
            borderColor: '#999',
            borderWidth: 1,
            color: '#333',
            selectedColor: '#333'
        };
        stylesheet.mapAnnotation.pincolor = Titanium.Map.ANNOTATION_RED;
    }
    if(Ti.Platform.osname === 'android') {
        stylesheet.titleBar.backgroundImage = '/images/titlebarbg.png';
        stylesheet.secondaryBar.backgroundImage = '/images/secondarybarbg.png';
        stylesheet.mapAnnotation.image = '/images/mapPin.png';
    }
    Ti.API.info("OS is: " + OS + " and contentButton borderRadius is" + stylesheet.contentButton.borderRadius);
    return stylesheet;
};
