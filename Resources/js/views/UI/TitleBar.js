
    // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
var title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, infoButton, infoButtonContainer, titleBar, titleBarDefaults,
    labelStyle = app.styles.titleBarLabel;

titleBarDefaults = _.clone(app.styles.titleBar);
titleBarDefaults.left += 'dp';
titleBarDefaults.height += 'dp';
titleBar = {view:Titanium.UI.createView(titleBarDefaults)};
exports.view = titleBar.view;

title = Titanium.UI.createLabel(labelStyle);
titleBar.view.add(title);
exports.updateTitle = function (t) {
    title.text = t;
};

exports.addHomeButton = function(){  
    Ti.API.debug('addHomeButton()');
    if (infoButtonContainer) infoButtonContainer.hide();
    if (settingsButtonContainer) settingsButtonContainer.hide();
    if (!homeButtonContainer) {
        homeButtonContainer = Titanium.UI.createView(app.styles.titleBarHomeContainer);
        titleBar.view.add(homeButtonContainer);

        homeButton = Titanium.UI.createImageView(app.styles.titleBarHomeButton);
        homeButtonContainer.add(homeButton);

        homeButtonContainer.addEventListener('singletap', onHomeClick);
    }
    homeButtonContainer.show();
};

exports.addInfoButton = function () {
    Ti.API.debug('addInfoButton()');
    if (homeButtonContainer) homeButtonContainer.hide();
    if (!infoButtonContainer) {
        infoButtonContainer = Titanium.UI.createView(app.styles.titleBarInfoContainer);
        titleBar.view.add(infoButtonContainer);
        infoButton = Titanium.UI.createImageView(app.styles.titleBarInfoButton);
        infoButtonContainer.add(infoButton);

        infoButtonContainer.addEventListener('singletap', onInfoClick);
    }
    infoButtonContainer.show();
    
};

exports.addSettingsButton = function () {
    Ti.API.debug('addSettingsButton()');
    if (!settingsButtonContainer) {
        settingsButtonContainer = Titanium.UI.createView(app.styles.titleBarSettingsContainer);
        titleBar.view.add(settingsButtonContainer);

        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        settingsButton = Titanium.UI.createImageView(app.styles.titleBarSettingsButton);
    	settingsButtonContainer.add(settingsButton);

        settingsButtonContainer.addEventListener('singletap', onSettingsClick);
    }
    settingsButtonContainer.show();
};

exports.clear = function () {
    if (settingsButtonContainer) settingsButtonContainer.removeEventListener('singletap', onSettingsClick);
    settingsButtonContainer = null;
    if (infoButtonContainer) infoButtonContainer.removeEventListener('singletap', onInfoClick);
    infoButtonContainer = null;
    if (homeButtonContainer) homeButtonContainer.addEventListener('singletap', onHomeClick);
    homeButtonContainer = null;
};

exports.rotate = function (orientation) {
    if (titleBar) { titleBar.view.width = app.styles.titleBar.width; }
    if (settingsButtonContainer) { settingsButtonContainer.left = app.styles.titleBarSettingsContainer.left; }
    if (homeButtonContainer) { homeButtonContainer.left = app.styles.titleBarHomeContainer.left; }
};

function onHomeClick (e) {
    app.models.windowManager.openWindow(app.config.HOME_KEY);
};

function onInfoClick (e) {
    app.models.windowManager.openWindow(app.config.PORTLET_KEY, {
        fname: 'info',
        externalModule: true,
        title: app.localDictionary.info,
        url: Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'html/info.html').nativePath
    });
};

function onSettingsClick (e) {
    app.models.windowManager.openWindow(app.config.SETTINGS_KEY);
};