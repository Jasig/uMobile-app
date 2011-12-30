
    // Partial view used in almost every view, which places a title bar at the top of the screen with some optional attributes.
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
var title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, infoButton, infoButtonContainer, titleBar, titleBarDefaults,
app = require('/js/Facade'),
styles = require('/js/style'),
config = require('/js/config'),
_ = require('/js/libs/underscore-min'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')],
labelStyle = styles.titleBarLabel;

titleBarDefaults = _.clone(styles.titleBar);
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
        homeButtonContainer = Titanium.UI.createView(styles.titleBarHomeContainer);
        titleBar.view.add(homeButtonContainer);

        homeButton = Titanium.UI.createImageView(styles.titleBarHomeButton);
        homeButtonContainer.add(homeButton);

        homeButtonContainer.addEventListener('singletap', onHomeClick);
    }
    homeButtonContainer.show();
};

exports.addInfoButton = function () {
    Ti.API.debug('addInfoButton()');
    if (homeButtonContainer) homeButtonContainer.hide();
    if (!infoButtonContainer) {
        infoButtonContainer = Titanium.UI.createView(styles.titleBarInfoContainer);
        titleBar.view.add(infoButtonContainer);
        infoButton = Titanium.UI.createImageView(styles.titleBarInfoButton);
        infoButtonContainer.add(infoButton);

        infoButtonContainer.addEventListener('singletap', onInfoClick);
    }
    infoButtonContainer.show();
    
};

exports.addSettingsButton = function () {
    Ti.API.debug('addSettingsButton()');
    if (!settingsButtonContainer) {
        settingsButtonContainer = Titanium.UI.createView(styles.titleBarSettingsContainer);
        titleBar.view.add(settingsButtonContainer);

        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        settingsButton = Titanium.UI.createImageView(styles.titleBarSettingsButton);
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
    if (titleBar) { titleBar.view.width = styles.titleBar.width; }
    if (settingsButtonContainer) { settingsButtonContainer.left = styles.titleBarSettingsContainer.left; }
    if (homeButtonContainer) { homeButtonContainer.left = styles.titleBarHomeContainer.left; }
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