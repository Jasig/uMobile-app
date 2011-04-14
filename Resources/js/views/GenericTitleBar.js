// Ti.include('config.js');

var GenericTitleBar = function (opts) {
    //Required: opts.app, opts.windowKey
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
    var title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, 
        titleBar = Titanium.UI.createView(opts.app.styles.titleBar),
        labelStyle = opts.app.styles.titleBarLabel,
        onSettingsClick, onSettingsPressDown, onSettingsPressUp, onHomeClick, onHomePressUp, onHomePressDown;
        
    function init() {
        if (opts.title) {
            //Places the title in the center of the titlebar...
            labelStyle.text = opts.title;
            title = Titanium.UI.createLabel(labelStyle);
            titleBar.add(title);
        }
        titleBar.updateTitle = function (t) {
            title.text = t;
        };
        if (opts.backButton) {
            //This adds a button at the left of the title bar, presumably to go back to a previous view. Not limited to that, as there are no event listeners added here.
            //Expects a view object.
            //There should only be either a home button or backbutton, not both.
            backButton = opts.backButton;
            titleBar.add(backButton);
        }
        if (opts.homeButton && !opts.backButton) {
            //Expects homeButton to be a boolean indicating whether or not to show the home button
            //There shouldn't be a home button and back button, as then the bar just gets too cluttered. Back button wins in a fight.
            homeButtonContainer = Titanium.UI.createView(opts.app.styles.titleBarHomeContainer);
            titleBar.add(homeButtonContainer);
            
            homeButton = Titanium.UI.createImageView(opts.app.styles.titleBarHomeButton);
            homeButtonContainer.add(homeButton);

            homeButtonContainer.addEventListener('singletap', onHomeClick);
            homeButtonContainer.addEventListener('touchstart', onHomePressDown);
            homeButtonContainer.addEventListener('touchend', onHomePressUp);
        }
        if (opts.settingsButton) {
            settingsButtonContainer = Titanium.UI.createView(opts.app.styles.titleBarSettingsContainer);
            titleBar.add(settingsButtonContainer);
            
            //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
            settingsButton = Titanium.UI.createImageView(opts.app.styles.titleBarSettingsButton);
        	settingsButtonContainer.add(settingsButton);

            settingsButtonContainer.addEventListener('singletap', onSettingsClick);
            settingsButtonContainer.addEventListener('touchstart', onSettingsPressDown);
            settingsButtonContainer.addEventListener('touchend', onSettingsPressUp);
        }
    }
    onHomeClick = function (e) {
        Ti.API.debug("Home button clicked in GenericTitleBar");
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: opts.windowKey,
                newWindow: 'home'
            }
        );
    };
    
    onHomePressDown = function (e) {
        homeButtonContainer.backgroundColor = opts.app.styles.titleBarHomeContainer.backgroundColorPressed;
    };
    
    onHomePressUp = function (e) {
        homeButtonContainer.backgroundColor = '';
    };
    onSettingsClick = function (e) {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'home',
                newWindow: 'settings',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT 
            }
        );
    };
    
    onSettingsPressDown = function (e) {
        settingsButtonContainer.backgroundColor = opts.app.styles.titleBarSettingsContainer.backgroundColorPressed;
    };
    
    onSettingsPressUp = function (e) {
        settingsButtonContainer.backgroundColor = '';
    };

    init();

    return titleBar;
};