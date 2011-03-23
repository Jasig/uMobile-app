// Ti.include('config.js');

var GenericTitleBar = function (opts) {
    //Required: opts.app, opts.windowKey
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
    var title,
        backButton,
        homeButton,
        settingsButton,
        titleBar = Titanium.UI.createView(opts.app.styles.titleBar),
        labelStyle = opts.app.styles.titleBarLabel;
    if (opts.title) {
        //Places the title in the center of the titlebar...
        labelStyle.text = opts.title;
        title = Titanium.UI.createLabel(labelStyle);
        titleBar.add(title);
    }
    if (opts.backButton) {
        //This adds a button at the left of the title bar, presumably to go back to a previous view. Not limited to that, as there are no event listeners added here.
        //Expects a view object.
        //There should only be either a home button or backbutton, not both.
        backButton = opts.backButton;
        titleBar.add(backButton);
        
        //Manually add gradient changes for button toggle
        backButton.addEventListener("touchstart",function(e){
            e.source.backgroundGradient = opts.app.UPM.GLOBAL_STYLES.titleBarGradient;
        });
        backButton.addEventListener("touchend",function(e){
            e.source.backgroundGradient = opts.app.UPM.GLOBAL_STYLES.titleBarButtonGradient;
        });
    }
    if (opts.homeButton && !opts.backButton) {
        //Expects homeButton to be a boolean indicating whether or not to show the home button
        //There shouldn't be a home button and back button, as then the bar just gets too cluttered. Back button wins in a fight.
        homeButton = Titanium.UI.createImageView(opts.app.styles.titleBarHomeButton);
        titleBar.add(homeButton);
        
        homeButton.addEventListener('singletap', function() {
            Ti.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: opts.windowKey,
                    newWindow: 'home'
                }
            );
        });
    }
    if (opts.settingsButton) {
        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        settingsButton = Titanium.UI.createImageView(opts.app.styles.titleBarSettingsButton);
    	titleBar.add(settingsButton);
    	
    	settingsButton.addEventListener('singletap', function (e) {
            Ti.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: 'home',
                    newWindow: 'settings',
                    transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT 
                }
            );
        });
    }

    return titleBar;
};