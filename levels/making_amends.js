'use strict';
const Level = require('./level');
const logger = require('winston');
const WebSocket = require('ws');

class MakingAmends extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);

  }

  solve() {
    super.solve('Making Amends');

    const wsUrl = `wss://api.stockfighter.io/ob/api/ws/${this.account}/venues/${this.venue}/executions/stocks/${this.stock}`;
    console.log('connecting to', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('message', (data, flags) => {
      console.log(data);
      console.log(flags);
      console.log('------------------');
    });
  }
}

module.exports = MakingAmends;