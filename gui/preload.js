const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	openFile: () => ipcRenderer.invoke('dialog:openFile'),
	updateUsername: cb => ipcRenderer.on('update-username', cb),
	getUsername: () => ipcRenderer.invoke('getUsername'),
	sendMessage: (message) => ipcRenderer.invoke('sendMessage', message),
	receiveMessage: (payload) => ipcRenderer.on('receiveMessage', payload),
	getMessages: () => ipcRenderer.invoke('getMessages'),
});

window.addEventListener('DOMContentLoaded', () => {
	const replaceText = (selector, text) => {
		const element = document.getElementById(selector);
		if (element) { element.innerText = text; }
	}
	for (const dependency of ['chrome', 'node', 'electron']) {
		replaceText(`${dependency}-version`, process.versions[dependency]);
	}
});
