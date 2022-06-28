const root = document.getElementById('root');
const btn = document.getElementById('btn');
const username = document.getElementById('username');
const filePathElement = document.getElementById('filePath');

btn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile();
  filePathElement.innerText = filePath;
});

window.electronAPI.updateUsername((event, value) => {
  console.log('got name from main', value);
  username.innerText = value;
});
window.electronAPI.receiveMessage((event, value) => {
  console.log('got message from main', value);
  // should probably check if the data is even valid
  appendMessage(value);
  scrollMessageContainerToBottom();
});

async function init() {
  renderChatBox();
  const val = await window.electronAPI.getUsername();
  username.innerText = val;
  // fetch past messages
  const messages = await window.electronAPI.getMessages();
  // first message instance in array is most recent, so insert from the end
  console.log('messages', messages);
  for (let i = messages.length-1; i >= 0; i--) { appendMessage(messages[i]); }
  scrollMessageContainerToBottom();
}
function renderChatBox() {
  while (root.firstChild) { root.removeChild(root.firstChild); }

  const cc = ce('div',[{name:'class',val:'chatbox-container container-fluid'}],null,root);
  const cmc = ce('div',[{name:'class',val:'chatbox-messages-container row'}],null,cc);
  const cmcc = ce('div',[{name:'class',val:'col'}],null,cmc);
  const cmccc = ce('div',[{name:'class',val:'add-messages-here-i-guess container-fluid'}],null,cmcc);
  const cccr = ce('div',[{name:'class',val:'chatbox-controls-container row'}],null,cc);
  const cccrc = ce('div',[{name:'class',val:'col'}],null,cc);
  const ctb = ce('input',[{name:'class',val:'chatbox-text-input'}],null,cccrc);
  const csb = ce('button',[{name:'class',val:'chatbox-btn-submit'}],'submit',cccrc);
  csb.addEventListener('click', onSendMessageButtonClick);
  ctb.addEventListener('keyup', e => {
    if (e.keyCode === 13) onSendMessageButtonClick();
  });
}
function appendMessage(data) {
  const thing = document.querySelector('.add-messages-here-i-guess');
  const r = ce('div',[{name:'class',val:'row'}],null,thing);
  const c = ce('div',[{name:'class',val:'col'}],null,r);
  const p = ce('p',[],null,c);
  const s = ce('strong',[],`${data.name}:`,p);
  ce('span',[],data.message,p);
}

// get username(address) and render chatbox
init();

// events
async function onSendMessageButtonClick() {
  const input = document.querySelector('.chatbox-text-input');
  console.log('submit button clicked', username.innerText, input.value);
  if (!input.value.length || !username.innerText.length) {
    console.error('invalid message');
    return;
  }
  const response = await window.electronAPI.sendMessage(input.value);
  // dont even remember is there is a response, but we should check it I guess
  appendMessage({name:username.innerText,message:input.value});
  scrollMessageContainerToBottom();
  // everything successful, clear the message box
  input.value = '';
}
function scrollMessageContainerToBottom() {
  const el = document.querySelector('.chatbox-messages-container');
  el.scrollTop = el.scrollHeight;
}

// utility
function ce(type, attribs = [], text = null, parent = null) {
  const element = document.createElement(type);
  if (text) element.textContent = text;
  attribs.forEach(a => { element.setAttribute(a.name, a.val) });
  if (parent) parent.appendChild(element);
  return element;
}
