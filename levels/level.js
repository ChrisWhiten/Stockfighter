'use strict';
const request = require('request');

class Level {
  constructor(apiKey, account, venue, stock) {
    this.baseUrl = 'https://api.stockfighter.io/ob/api';

    this.apiKey = apiKey;
    this.account = account;
    this.venue = venue;
    this.stock = stock;

    this.headers = {
      'X-Starfighter-Authorization': apiKey
    };

    this.getQuoteUrl = this.baseUrl + '/venues/' + this.venue + '/stocks/' + this.stock + '/quote';
    this.orderUrl = this.baseUrl + '/venues/' + this.venue + '/stocks/' + this.stock + '/orders';
  }

  solve(levelName) {
    console.log('Solving', levelName);
  }

  getAQuote(cb) {
    //console.log('Getting a quote...');

    const options = {
      url: this.getQuoteUrl,
      headers: this.headers,
      method: 'get'
    };

    request(options, (err, response, body) => {
      if (err) {
        cb('Error', err);
        return;
      }
      const quote = JSON.parse(body);
      if (!quote || !quote.ok) {
        console.log('body not ok', quote)
        cb(null, null);
        return;
      }

      cb(quote, null);
    });
  }

  order(price, qty, orderType, direction, cb) {
    console.log('Order:', direction, this.stock, '-', qty, '*', price);

    const options = {
      url: this.orderUrl,
      headers: this.headers,
      method: 'post',
      json: {
        account: this.account,
        venue: this.venue,
        symbol: this.stock,
        price: price,
        qty: qty,
        direction: direction,
        orderType: orderType
      }
    };

    request.post(options, (err, response, body) => {
      cb(err, body);
    });
  }

  timeBoundOrder(price, qty, orderType, direction, timeout, cb) {
    this.order(price, qty, orderType, direction, (err, body) => {
      setTimeout(() => {
        const orderId = body.id;
        this.cancel(orderId, (err, body) => {
          this.getOrderStatus(orderId, (err, order) => {
            cb(err, order);
          });
        });
      }, timeout);
    });
  }

  cancel(orderId, cb) {
    const options = {
      url: this.orderUrl + '/' + orderId,
      headers: this.headers,
      method: 'delete'
    };

    request(options, (err, response, body) => {
      //console.log('Order cancelled.');
      //console.log(body);

      cb(err, body);
    });
  }

  getOrderStatus(orderId, cb) {
    const options = {
      url: this.orderUrl + '/' + orderId,
      headers: this.headers,
      method: 'get'
    };

    request(options, (err, response, body) => {
      //console.log('status: ', body);
      const order = JSON.parse(body);
      cb(err, order);
    });
  }
}

module.exports.Level = Level;