const https = require('https');
module.exports = {
  getAddress: () => {
    const chars = 'ABCDEFabcdef0123456789';
    let res = '';
    for (let i = 0; i < 40; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      return `0x${res}`;
  },
  random: max => { return Math.floor(Math.random() * max); },
  request: (options, payload) => {
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        const body = [];
        res.on('data', body.push.bind(body));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            // this should blow up if json isnt returned
            body: JSON.parse(Buffer.from(Buffer.concat(body))),
          });
        });
      });
      req.on('error', error => { reject(error); });
      if (payload) req.write(payload);
      req.end();
    });
  },
};
