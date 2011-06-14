Titanium.Gesture.addEventListener('orientationchange', function (e) {
    Ti.App.fireEvent('androidorientationchange', {orientation: e.orientation});
});