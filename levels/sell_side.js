'use strict';
const request = require('request');
const Level = require('./level').Level;

class SellSide extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);
    this.totalPurchaseCount = 0;
    this.totalPurchaseCost = 0;
    this.currentProfit = 0;
    this.holdCount = 0;
    this.lastPurchasePrice = Number.MAX_VALUE;
  }

  solve() {
    super.solve('Sell Side');

    this.aggressiveSolution(() => {
      console.log('done');
    });
  }

  aggressiveSolution(done) {
    if (this.currentProfit >= 1000000) {
      return done();
    }

    this.getAQuote((quote, err) => {
      if (this.holdCount < 500 && quote.ask && typeof quote.ask === 'number') {
        this.timeBoundOrder(quote.ask, quote.askSize, 'limit', 'buy', 1000, (err, order) => {
          this.consumeFilledOrder(order);

          this.printState();
          this.aggressiveSolution(done);
        });
      } else if (this.holdCount < 500) {
        // no set ask, but still have less than 500... let's just wait.
        setTimeout(() => {
          this.aggressiveSolution(done);
        }, 100);
      } else if (this.holdCount < 750) {
        if (quote.bid && typeof quote.bid === 'number' && quote.bid > this.lastPurchasePrice) {
          // sell!
          this.timeBoundOrder(quote.bid, quote.bidSize, 'limit', 'sell', 1000, (err, order) => {
            this.consumeFilledOrder(order);

            this.printState();
            this.aggressiveSolution(done);
          });
        } else if (quote.ask && typeof quote.ask === 'number' && quote.ask < this.lastPurchasePrice) {
          // buy!
          this.timeBoundOrder(quote.ask, Math.min(quote.askSize, 1000 - this.holdCount), 'limit', 'buy', 1000, (err, order) => {
            this.consumeFilledOrder(order);

            this.printState();
            this.aggressiveSolution(done);
          });
        } else {
          // wait...
          setTimeout(() => {
            aggressiveSolution(done);
          }, 100);
        }
      } else if (quote.bid && typeof quote.bid === 'number') {
        // the remaining if statements are for when we definitely want to sell...
        this.timeBoundOrder(this.lastPurchasePrice, quote.bidSize, 'limit', 'sell', 1000, (err, order) => {
          this.consumeFilledOrder(order);

          this.printState();
          this.aggressiveSolution(done);
        });
      } else {
        // no bid... set the ask to 1.5 * the last price, just in case.
        this.timeBoundOrder(Math.floor(this.lastPurchasePrice * 1.5), 100, 'limit', 'sell', 1000, (err, order) => {
          this.consumeFilledOrder(order);

          this.printState();
          this.aggressiveSolution(done);
        });
      }
    });
  }

  printState() {
    console.log('Current profit:', this.currentProfit, '| Stock count held:', this.holdCount, '| Average cost:', this.averagePurchasePrice());
  }

  consumeFilledOrder(order) {
    if (order.direction === 'buy') {
      order.fills.map((fill) => {
        this.totalPurchaseCount += fill.qty;
        this.totalPurchaseCost += fill.qty * fill.price;
        this.currentProfit -= fill.qty * fill.price;
        this.holdCount += fill.qty;
        this.lastPurchasePrice = fill.price;
      });
    } else {
      order.fills.map((fill) => {
        this.currentProfit += fill.qty * fill.price;
        this.holdCount -= fill.qty;
      });
    }
  }

  averagePurchasePrice() {
    if (this.totalPurchaseCount === 0) {
      return 0;
    }

    return Math.floor(this.totalPurchaseCost / this.totalPurchaseCount);
  }
}

module.exports.SellSide = SellSide;