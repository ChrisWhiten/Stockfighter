'use strict';
const FirstSteps = require('./levels/first_steps').FirstSteps;
const ChockABlock = require('./levels/chock_a_block').ChockABlock;
const SellSide = require('./levels/sell_side').SellSide;
const DuelingBulldozers = require('./levels/dueling_bulldozers').DuelingBulldozers;

const fs = require('fs');
const request = require('request');

const winston = require('winston');
winston.level = 'info';

let account = '';
let venue = '';
let stock = '';
const levelName = 'dueling_bulldozers';

// real entry point
fs.readFile('api.key', {encoding: 'utf-8'}, function (err, data) {
  if (err) {
    console.log(err);
    return;
  }

  const apiKey = data;

  let options = {
    headers: {
      'X-Starfighter-Authorization': apiKey,
    },
    url: 'https://www.stockfighter.io/gm/levels/' + levelName
  };

  request.post(options, (err, response, body) => {
    if (err) {
      console.log(err);
      return;
    }

    const levelInfo = JSON.parse(body);
    const instanceId = levelInfo.instanceId;

    // restart to get a fresh start while iterating on solutions
    options.url = 'https://www.stockfighter.io/gm/instances/' + instanceId + '/restart';
    request.post(options, (err, response, body) => {
      const restartedLevelInstance = JSON.parse(body);
      console.log(restartedLevelInstance);
      account = restartedLevelInstance.account;
      venue = restartedLevelInstance.venues[0];
      stock = restartedLevelInstance.tickers[0];

      console.log(body);
      switch (levelName) {
        case 'first_steps':
          const firstSteps = new FirstSteps(apiKey, account, venue, stock);
          firstSteps.solve();
          break;

        case 'chock_a_block':
          const chockABlock = new ChockABlock(apiKey, account, venue, stock);
          chockABlock.solve();
          break;

        case 'sell_side':
          const sellSide = new SellSide(apiKey, account, venue, stock);
          sellSide.solve();
          break;

        case 'dueling_bulldozers':
          const duelingBulldozers = new DuelingBulldozers(apiKey, account, venue, stock);
          duelingBulldozers.solve();
          break;

        default:
          console.log('level', levelName, 'not found');
          return;
      }
    });
  });
});