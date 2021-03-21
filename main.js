var electron		= require('electron');
var app				= electron.app;
var application		= electron.application;
var protocol		= electron.protocol;
var Tray			= electron.Tray;
var Menu			= electron.Menu;
var BrowserWindow	= electron.BrowserWindow;

var path = require('path');

/*protocol.registerSchemesAsPrivileged([{
	scheme: 'app',
	privileges: {
		standard: true,
		secure: true,
		allowServiceWorkers: true,
		supportFetchAPI: true
	}
}]);*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform != 'darwin') {
		app.quit();
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
	// Create the browser window.
	protocol.registerFileProtocol('app', function(request, callback) {
		var url = request.url.substr(6);
		callback({
			path: path.normalize(__dirname+'/'+url)
		});
	}, function(error) {
		if (error) console.error('Failed to register protocol');
	});

	mainWindow = new BrowserWindow({
		width:			330,
		height:			1150,
		icon:			'/icon.png',
		frame:			false,
		webPreferences:	{
			nodeIntegration: true
		}
	});
	
	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	//mainWindow.webContents.openDevTools();
	
	var contextMenu = Menu.buildFromTemplate([{
		label: 'Show App',
		click:  function(){
			mainWindow.show();
		}
	},
	{
		label: 'Quit',
		click:  function(){
			mainWindow.destroy();
			app.quit();
		}
	}]);
});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});

