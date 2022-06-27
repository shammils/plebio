module.exports = {
  getAddress: () => {
    const chars = 'ABCDEFabcdef0123456789';
    let res = '';
    for (let i = 0; i < 40; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      return `0x${res}`;
  },
  random: max => { return Math.floor(Math.random() * max); },
};
