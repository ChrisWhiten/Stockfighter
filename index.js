const ChockABlock = require('./levels/chock_a_block').ChockABlock;
const SellSide = require('./levels/sell_side').SellSide;
const fs = require('fs');

const account = 'DWS33938167';
const venue = 'VIREX';
const stock = 'MWH';

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

  // sell-side level
  const sellSide = new SellSide(apiKey, account, venue, stock);
  sellSide.solve();
});