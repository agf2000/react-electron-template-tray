const { app, Tray, BrowserWindow, Menu, ipcMain, dialog, Notification } = require('electron');
const find = require('find-process');

const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');

const iconPath = path.join(__dirname, 'icon.png');

let mainWindow = null,
	imageWindow = null,
	aboutWindow = null,
	appIcon = null,
	win = null,
	configWindow = null,
	ordersWindow = null;

function createWindow() {
	win = new BrowserWindow({
		show: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	appIcon = new Tray(iconPath);

	let contextMenu = Menu.buildFromTemplate([
		{
			label: 'Painel',
			click(item, focusedWindow) {
				mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
			},
			// type: 'normal',
			// role: 'front',
		},
		{
			label: 'Pedidos',
			click(item, focusedWindow) {
				configWindow.isVisible() ? configWindow.hide() : configWindow.show();
			},
		},
		{
			label: 'Configurações',
			click(item, focusedWindow) {
				configWindow.isVisible() ? configWindow.hide() : configWindow.show();
			},
		},
		{
			label: 'Fechar',
			click() {
				dialog.showMessageBox(
					win,
					{
						type: 'question',
						title: 'Atenção!',
						message: 'Tem certeza que deseja fechar o aplicativo de sincronização com Oruc?',
						buttons: ['Sim', 'Não'],
						defaultId: 1,
						noLink: true,
					},
					(resp) => {
						if (resp == 0) {
							find('port', 3000)
								.then(function (list) {
									console.log('List: ', list);
									if (list[0] != null) {
										console.log('PID: ', list[0].pid);
										process.kill(list[0].pid, 'SIGHUP');
										// app.quit();
									}
								})
								.catch((e) => {
									console.log(e.stack || e);
								});
						}
					}
				);
			},
		},
		{
			label: 'Sobre',
			click(item, focusedWindow) {
				aboutWindow.isVisible() ? aboutWindow.hide() : aboutWindow.show();
			},
		},
	]);

	appIcon.setToolTip('SGI-Oruc');
	appIcon.getIgnoreDoubleClickEvents(false);
	appIcon.setContextMenu(contextMenu);

	app.setAppUserModelId('com.br.softernet.appname');

	const opt = {
		title: 'Atenção!',
		subtitle: 'Aplicativo minimizado.',
		body: 'O aplicativo SGI-Oruc está ativo na barra de tarefas.',
		icon: iconPath,
	};

	new Notification(opt).show();

	mainWindow = new BrowserWindow({
		show: false,
		width: 900,
		height: 680,
		x: 10,
		y: 10,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
		parent: win,
	});

	mainWindow.setMenu(null);
	mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
	mainWindow.on('closed', (e) => {
		e.preventDefault();
		imageWindow.hide();
		// mainWindow = null;
	});
	if (isDev) mainWindow.webContents.openDevTools();

	const mainMenu = Menu.buildFromTemplate(basicMenuTemplate);
	mainWindow.setMenu(mainMenu);

	imageWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
		parent: mainWindow,
	});

	imageWindow.setMenu(null);
	imageWindow.loadURL(isDev ? 'http://localhost:3000#image' : `file://${path.join(__dirname, '../build/index.html#image')}`);
	imageWindow.on('close', (e) => {
		e.preventDefault();
		imageWindow.hide();
	});

	configWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	configWindow.setMenu(null);
	configWindow.loadURL(isDev ? 'http://localhost:3000#settings' : `file://${path.join(__dirname, '../build/index.html#settings')}`);
	configWindow.on('close', (e) => {
		e.preventDefault();
		configWindow.hide();
	});

	aboutWindow = new BrowserWindow({
		show: false,
		width: 600,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	aboutWindow.setMenu(null);
	aboutWindow.loadURL(isDev ? 'http://localhost:3000#about' : `file://${path.join(__dirname, '../build/index.html#about')}`);
	aboutWindow.on('close', (e) => {
		e.preventDefault();
		aboutWindow.hide();
	});
}

app.on('ready', createWindow);

app.on('before-quit', (e) => {
	find('port', 3000)
		.then(function (list) {
			if (list[0] != null) {
				process.kill(list[0].pid, 'SIGHUP');
			}
		})
		.catch((e) => {
			console.log(e.stack || e);
		});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

ipcMain.on('open-image', (event, arg) => {
	imageWindow.show();
	imageWindow.webContents.send('args', arg);
});

ipcMain.on('toggle-settings', () => {
	configWindow.isVisible() ? configWindow.hide() : configWindow.show();
});

ipcMain.on('toggle-about', () => {
	aboutWindow.isVisible() ? aboutWindow.hide() : aboutWindow.show();
});

const basicMenuTemplate = [
	{
		label: 'Arquivo',
		submenu: [
			{
				label: 'Configurações',
				accelerator: 'CmdOrCtrl+,',
				click: () => {
					configWindow.isVisible() ? configWindow.hide() : configWindow.show();
				},
			},
			{
				label: 'About',
				accelerator: 'CmdOrCtrl+,',
				click: () => {
					aboutWindow.isVisible() ? aboutWindow.hide() : aboutWindow.show();
				},
			},
		],
	},
	{
		label: 'Recarregar',
		accelerator: 'CmdOrCtrl+R',
		click(item, focusedWindow) {
			if (focusedWindow) focusedWindow.reload();
		},
	},
	{
		label: 'Ferramentas',
		submenu: [
			{
				label: 'Diagnóstico',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click(item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools();
				},
			},
		],
	},
	{
		label: 'Fechar',
		click(item, focusedWindow) {
			// if (focusedWindow) focusedWindow.hide();
			find('port', 3000)
				.then(function (list) {
					console.log('List: ', list);
					if (list[0] != null) {
						console.log('PID: ', list[0].pid);
						process.kill(list[0].pid);
						// app.quit();
					}
				})
				.catch((e) => {
					console.log(e.stack || e);
				});
		},
	},
	{
		label: 'Edit',
		submenu: [{ label: 'Menu Item 1' }, { label: 'Menu Item 2' }, { label: 'Menu Item 3' }],
	},
];
