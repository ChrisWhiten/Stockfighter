'use strict';
const request = require('request');
const logger = require('winston');

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

    this.totalPurchaseCount = 0;
    this.totalPurchaseCost = 0;
    this.currentBalance = 0;
    this.holdCount = 0;
    this.lastPurchasePrice = Number.MAX_VALUE;
    this.recentSales = [];
  }

  solve(levelName) {
    logger.info('Solving', levelName);
  }

  getAQuote(cb) {
    logger.debug('Getting a quote...');

    const options = {
      url: this.getQuoteUrl,
      headers: this.headers,
      method: 'get'
    };

    request(options, (err, response, body) => {
      if (err) {
        cb(err, 'Error');
        return;
      }
      const quote = JSON.parse(body);
      if (!quote || !quote.ok) {
        logger.error('body not ok', quote)
        cb(null, null);
        return;
      }

      this.quotePostProcessing(quote);
      this.printQuote(quote);

      cb(null, quote);
    });
  }

  order(price, qty, orderType, direction, cb) {
    logger.info('Order:', direction, this.stock, '-', qty, '*', price);

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
      logger.debug('Order cancelled.');
      logger.debug(body);

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
      logger.debug('order status: ', body);
      const order = JSON.parse(body);
      cb(err, order);
    });
  }

  consumeFilledOrder(order) {
    if (order.direction === 'buy') {
      order.fills.map((fill) => {
        this.totalPurchaseCount += fill.qty;
        this.totalPurchaseCost += fill.qty * fill.price;
        this.currentBalance -= fill.qty * fill.price;
        this.holdCount += fill.qty;
        this.lastPurchasePrice = fill.price;

        //logger.info('***Purchased', fill.qty, '@', fill.price);
        console.log('\x1b[36m', '***Purchased', fill.qty, '@', fill.price ,'\x1b[0m');
      });
    } else {
      order.fills.map((fill) => {
        this.currentBalance += fill.qty * fill.price;
        this.holdCount -= fill.qty;

        //logger.info('***Sold', fill.qty, '@', fill.price);
        console.log('\x1b[36m', '***Sold', fill.qty, '@', fill.price ,'\x1b[0m');
      });
    }
  }

  printQuote(quote) {
    let askValue = quote.ask;
    if (!askValue) {
      askValue = 'NA';
    }

    let bidValue = quote.bid;
    if (!bidValue) {
      bidValue = 'NA';
    }

    let lastValue = quote.last;
    if (!lastValue) {
      lastValue = 'NA';
    }

    let averageValue = this.averageRecentSales();
    if (!averageValue) {
      averageValue = 'NA';
    }

    console.log('ASK:', askValue, 'BID:', bidValue, 'LAST:', lastValue, 'AVG:', averageValue);
  }

  quotePostProcessing(quote) {
    if (quote.last) {
      if (this.recentSales.length >= 50) {
        this.recentSales.shift(); // remove the first value.
      }

      this.recentSales.push(quote.last);
    }
  }

  averageRecentSales() {
    if (!this.recentSales || this.recentSales.length < 1) {
      return null;
    }

    return this.recentSales.reduce((prev, curr) => {
      return prev + curr;
    }, 0)/this.recentSales.length;
  }

  averagePurchasePrice() {
    if (this.totalPurchaseCount === 0) {
      return 0;
    }

    return Math.floor(this.totalPurchaseCost / this.totalPurchaseCount);
  }

  printState() {
    console.log('Current balance:', this.currentBalance, '| Stock count held:', this.holdCount, '| Average cost:', this.averagePurchasePrice());
  }
}

module.exports.Level = Level;