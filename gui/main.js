const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const utils = require('./utils');
const Websocket = require('ws');
const url = require('url');

const websocketUrl = 'wss://rl8xgbibzd.execute-api.us-west-2.amazonaws.com/testnet';
// we could use the ws API for this
const messagesUrl = 'https://wiy4r4sqc6.execute-api.us-west-2.amazonaws.com/testnet';

let username = process.env.PLEBIO_USER_NAME || utils.getAddress();
// intended product wont use websockets, so move this crap in a communication layer at some point
const ws = new Websocket(websocketUrl);
ws.on('open', () => {
	console.log('connection open');
});
ws.on('message', (response) => {
	console.log('received ws message', response);
	let data;
	try {
		data = JSON.parse(response);
	} catch(err) {
		console.error('failed to parse ws response');
	}
	console.log('parsed data', data);
	if (data?.type === 'message') {
		// TODO: learn how to get the proper window
		BrowserWindow.getAllWindows()[0].webContents.send('receiveMessage', data);
	}
});

async function handleFileOpen() {
	const { canceled, filePaths } = await dialog.showOpenDialog();
	if (canceled) {
		return;
	} else {
		return filePaths[0];
	}
}

const createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 600,
		webPreferences: {preload: path.join(__dirname, 'preload.js')},
	});
	mainWindow.loadFile('index.html');
	// this line isnt working anymore for some reason, migrating from main -> renderer to
	// renderer <-> main instead, like openFile fn
	//mainWindow.webContents.send('update-username', username);
	mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
	ipcMain.handle('dialog:openFile', handleFileOpen);
	ipcMain.handle('getUsername', () => username);
	ipcMain.handle('sendMessage', sendMessage);
	ipcMain.handle('getMessages', getMessages);
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) { createWindow(); }
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') { app.quit(); }
});

async function sendMessage(event, message) {
	if (!message?.length) return;
	console.log('in main, sending message', message);
	ws.send(JSON.stringify({
		action: 'onMessage',
		name: username,
		message,
	}));
}
async function getMessages() {
	const parsedUrl = url.parse(messagesUrl);
	const response = await utils.request({hostname: parsedUrl.hostname, path: parsedUrl.path});
	// shit, we should return the timestamps on these messages. they are ordered by date created
	// descending
	console.log('response from message server',response);
	if (response.statusCode !== 200) {
		console.log('somthing messed up, why');
		return [];
	}
	return response.body;
}
