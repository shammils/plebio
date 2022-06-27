const {contextBridge, ipcRenderer} = require('electron');
//const wsUrl = 'wss://rl8xgbibzd.execute-api.us-west-2.amazonaws.com/testnet';

contextBridge.exposeInMainWorld('electronAPI', {
	openFile: () => ipcRenderer.invoke('dialog:openFile'),
	updateUsername: cb => ipcRenderer.on('update-username', cb),
	getUsername: () => ipcRenderer.invoke('getUsername'),
	sendMessage: (message) => ipcRenderer.invoke('sendMessage', message),
	receiveMessage: (payload) => ipcRenderer.on('receiveMessage', payload),
});

window.addEventListener('DOMContentLoaded', () => {
	const replaceText = (selector, text) => {
		const element = document.getElementById(selector);
		if (element) { element.innerText = text; }
	}
	for (const dependency of ['chrome', 'node', 'electron']) {
		replaceText(`${dependency}-version`, process.versions[dependency]);
	}

	/*window.ws = new WebSocket(wsUrl);
	window.ws.addEventListener('open', () => {
		console.log('connected');
		// send message
		setTimeout(() => {
			window.ws.send(JSON.stringify({
				action: 'onMessage',
				message: 'testing from electron',
				name: 'from_electron',
			}));
		}, 1000);
	});
	window.ws.addEventListener('message', message => {
		console.log('message from server', message);
	});*/
});
