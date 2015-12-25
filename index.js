const ChockABlock = require('./levels/chock_a_block').ChockABlock;
const fs = require('fs');

const account = 'HLB10399974';
const venue = 'ITSBEX';
const stock = 'IXSU';

fs.readFile('api.key', {encoding: 'utf-8'}, function (err, data) {
  if (err) {
    console.log(err);
    return;
  }

  const apiKey = data;

  /*
  // chock-a-block level
  const chockABlock = new ChockABlock(apiKey, account, venue, stock);
  chockABlock.solve();
  */
});