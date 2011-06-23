// This shared window context allows windows to register orientation changes in Android
// and broadcast a global event
Titanium.Gesture.addEventListener('orientationchange', function (e) {
    Ti.App.fireEvent('androidorientationchange', {orientation: e.orientation});
});