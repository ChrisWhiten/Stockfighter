'use strict';


class Level {
  constructor(apiKey, account, venue, stock) {
    this.baseUrl = 'https://api.stockfighter.io/ob/api';

    this.apiKey = apiKey;
    this.account = account;
    this.venue = venue;
    this.stock = stock;

    this.getQuoteUrl = this.baseUrl + '/venues/' + this.venue + '/stocks/' + this.stock + '/quote';
    this.orderUrl = this.baseUrl + '/venues/' + this.venue + '/stocks/' + this.stock + '/orders';
  }

  solve(levelName) {
    console.log('Solving', levelName);
  }
}

module.exports.Level = Level;