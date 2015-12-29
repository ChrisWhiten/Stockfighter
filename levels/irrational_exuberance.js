'use strict';
const Level = require('./level').Level;
const logger = require('winston');
const fs = require('fs');

class IrrationalExuberance extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);

    this.SHORT_UPWARDS_TARGET = 1000000000;
    this.initialAsk = null;

    this.STATE_SHORT = 'short';
    this.STATE_CRASH_THE_MARKET = 'crash_the_market';
    this.STATE_BUY_BACK_IN = 'buy_back_in';

    this.currentState = this.STATE_SHORT;
  }

  solve() {
    super.solve('Irrational Exuberance');

    const quoteHeader = 'Ask, Ask size, Ask depth, Bid, Bid size, Bid depth, Last, Buy price, Buy qty, Sell price, Sell qty\n';

    fs.appendFile('quotes.csv', quoteHeader, (err) => {
      this.solveIE(() => {
        logger.info('done');
      });
    });
  }

  // wouldn't we all love to solve IE?
  solveIE(done) {
    // new plan: short the stock into the skies (sell shares we don't have)
    // then... start shorting it downwards
    // once the price is very low, buy up until we are at holdCount of 0.

    this.getAQuote((err, quote) => {
      if (quote.ask && !this.initialAsk) {
        this.initialAsk = quote.ask;
      }

      switch (this.currentState) {
        case this.STATE_SHORT:
          this.shortUpwards(quote, done);
          break;

        case this.STATE_CRASH_THE_MARKET:
          this.crashTheMarket(quote, done);
          break;

        case this.STATE_BUY_BACK_IN:
          this.buyBackIn(quote, done);
          break;

        default:
          console.log('undefined state...', this.currentState);
          break;
      }
    });
  }

  shortUpwards(quote, done) {
    let sellPrice = 0;
    let sellQty = 100;

    if (this.currentBalance >= this.SHORT_UPWARDS_TARGET) {
      this.currentState = this.STATE_CRASH_THE_MARKET;
      this.solveIE(done);
      return;
    }

    if (quote.ask && quote.ask > 0) {
      sellPrice = Math.floor(quote.ask * 1.5);
    } else if (quote.last) {
      sellPrice = Math.floor(quote.last * 1.5);
    } else {
      this.printState();
      return this.logAndContinue(quote, 0, 0, 0, 0, done);
    }

    this.timeBoundOrder(sellPrice, sellQty, 'limit', 'sell', 300, (err, order) => {
      if (!err) {
        this.consumeFilledOrder(order);
      }

      this.printState();
      this.logAndContinue(quote, 0, 0, sellPrice, sellQty, done);
    });
  }

  buyBackIn(quote, done) {
    if (this.holdCount >= 0) {
      return done();
    }

    let buyPrice;
    let buyQty = 100;

    if (quote.ask) {
      buyPrice = Math.floor(quote.ask * 1.05);
    } else {
      buyPrice = quote.last;
    }

    this.timeBoundOrder(buyPrice, buyQty, 'limit', 'buy', 300, (err, order) => {
      if (!err) {
        this.consumeFilledOrder(order);
      }

      this.printState();
      this.logAndContinue(quote, buyPrice, buyQty, 0, 0, done);
    });
  }

  crashTheMarket(quote, done) {
    if (quote.ask && quote.ask <= (this.initialAsk * .2)) {
      this.currentState = this.STATE_BUY_BACK_IN;
      this.solveIE(done);
      return;
    }

    console.log('\x1b[36m', '***CRASHING THE MARKET', '\x1b[0m');

    let sellPrice;
    let sellQty = 10;

    if (quote.ask && quote.ask > 0) {
      sellPrice = Math.floor(quote.ask * 0.8);
    } else {
      sellPrice = Math.floor(quote.last * 0.7);
    }

    this.timeBoundOrder(sellPrice, sellQty, 'limit', 'sell', 300, (err, order) => {
      if (!err) {
        this.consumeFilledOrder(order);
      }

      this.printState();
      this.logAndContinue(quote, 0, 0, sellPrice, sellQty, done);
    });
  }

  logAndContinue(quote, buyPrice, buyQty, sellPrice, sellQty, done) {
    const ask = quote.ask ? quote.ask : '';
    const askSize = quote.askSize ? quote.askSize : '';
    const askDepth = quote.askDepth ? quote.askDepth : '';
    const bid = quote.bid ? quote.bid : '';
    const bidSize = quote.bidSize ? quote.bidSize : '';
    const bidDepth = quote.bidDepth ? quote.bidDepth : '';
    const last = quote.last ? quote.last : '';


    const quoteData = `${ask},${askSize},${askDepth},${bid},${bidSize},${bidDepth},${last}, ${buyPrice}, ${buyQty}, ${sellPrice}, ${sellQty}\n`;

    fs.appendFile('quotes.csv', quoteData, (err) => {
      this.solveIE(done);
    });
  }
}

module.exports.IrrationalExuberance = IrrationalExuberance;