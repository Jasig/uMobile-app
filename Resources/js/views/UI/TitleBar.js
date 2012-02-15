
    // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
var app = require('/js/Constants'),
styles = require('/js/style'),
config = require('/js/config'),
_ = require('/js/libs/underscore-min'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createTitleBar = function () {
    var title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, infoButton, infoButtonContainer, titleBarDefaults,
    titleBar = {};
    
    styles = styles.updateStyles();
    
    titleBarDefaults = _.clone(styles.titleBar);
    titleBarDefaults.left += 'dp';
    titleBarDefaults.height += 'dp';
    
    titleBarDefaults = _.clone(styles.titleBar);
    titleBarDefaults.left += 'dp';
    titleBarDefaults.height += 'dp';
    labelStyle = styles.titleBarLabel;
    
    titleBar = {view:Titanium.UI.createView(titleBarDefaults)};
    title = Titanium.UI.createLabel(labelStyle);
    titleBar.view.add(title);
    
    titleBar.updateTitle = function (t) {
        title.text = t;
    };
    
    titleBar.addHomeButton = function(){
        if (infoButtonContainer) infoButtonContainer.hide();
        if (settingsButtonContainer) settingsButtonContainer.hide();
        
        homeButtonContainer = Titanium.UI.createView(styles.titleBarHomeContainer);
        titleBar.view.add(homeButtonContainer);
        
        homeButton = Titanium.UI.createImageView(styles.titleBarHomeButton);
        homeButtonContainer.add(homeButton);
        
        homeButtonContainer.addEventListener('singletap', onHomeClick);
        
        homeButtonContainer.show();
    };
    
    titleBar.addInfoButton = function () {
        if (homeButtonContainer) homeButtonContainer.hide();
        
        infoButtonContainer = Titanium.UI.createView(styles.titleBarInfoContainer);
        titleBar.view.add(infoButtonContainer);
        infoButton = Titanium.UI.createImageView(styles.titleBarInfoButton);
        infoButtonContainer.add(infoButton);
        
        infoButtonContainer.addEventListener('singletap', onInfoClick);
        
        infoButtonContainer.show();
    };
    
    titleBar.addSettingsButton = function () {
        settingsButtonContainer = Titanium.UI.createView(styles.titleBarSettingsContainer);
        titleBar.view.add(settingsButtonContainer);

        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        settingsButton = Titanium.UI.createImageView(styles.titleBarSettingsButton);
    	settingsButtonContainer.add(settingsButton);

        settingsButtonContainer.addEventListener('singletap', onSettingsClick);

        settingsButtonContainer.show();
    };


    function onHomeClick (e) {
        Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.HOME_KEY});
    };

    function onInfoClick (e) {
        Ti.App.fireEvent(app.events['SHOW_PORTLET'], {
            fname: 'info',
            externalModule: true,
            title: localDictionary.info,
            url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/info.html').nativePath
        });
    };

    function onSettingsClick (e) {
        Ti.App.fireEvent(app.events['SHOW_WINDOW'], {newWindow: config.SETTINGS_KEY});
    };
    
    return titleBar;
};