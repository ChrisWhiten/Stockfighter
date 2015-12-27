'use strict';
const Level = require('./level').Level;
const logger = require('winston');

class DuelingBulldozers extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);

    this.boughtLow = false;
    this.boughtLowPrice = 0;
    this.boughtLowLast = 0;
  }

  solve() {
    super.solve('Dueling Bulldozers');

    this.buyAndSellTheSwingsSolution(() => {
      logger.info('done');
    });
  }

  buyAndSellTheSwingsSolution(done) {
    if (this.currentBalance >= 250000000) {
      return done();
    }

    this.getAQuote((err, quote) => {
      const MIN_BALANCE = -3000000;
      const MAX_STOCKS = 999;

      const averageRecentSales = this.averageRecentSales();
      if (quote.ask && typeof quote.ask === 'number' && (quote.ask < Math.floor(averageRecentSales * 0.85))) {
        let qty = Math.min(Math.floor((this.currentBalance - MIN_BALANCE)/quote.ask), quote.askSize);
        if (this.holdCount + qty > MAX_STOCKS) {
          qty = MAX_STOCKS - this.holdCount;
        }
        logger.debug('should purchase', qty);
        if (qty <= 0) {
          setTimeout(() => {
            this.buyAndSellTheSwingsSolution(done);
          }, 50);
        } else {

          const purchasePrice = Math.floor(quote.ask * 1.05); // add a buffer to make sure we get the sale!
          this.timeBoundOrder(purchasePrice, qty, 'limit', 'buy', 500, (err, order) => {
            if (order.fills && order.fills.length > 0) {
              this.boughtLow = true;
              this.boughtLowPrice = purchasePrice;
              this.boughtLowLast = quote.last;
            }

            this.consumeFilledOrder(order);

            this.printState();
            this.buyAndSellTheSwingsSolution(done);
          });
        }
      } else if (this.boughtLow && this.holdCount > 0) {
        // bought low.  Try to sell as soon as possible!
        // bought low - sell it back!
        if ((quote.last > this.boughtLowLast * .9) || (quote.bid && typeof quote.bid === 'number' && (quote.bid > this.boughtLowPrice * 1.1))) {
          let askPrice = quote.bid;
          if (quote.last > askPrice || !quote.bid) {
            askPrice = quote.last;
          }

          logger.info('After buying low @', this.boughtLowPrice,'now we will now try to sell it back @', askPrice);
          this.timeBoundOrder(askPrice, this.holdCount, 'limit', 'sell', 1000, (err, order) => {
            this.consumeFilledOrder(order);

            if (order.fills && order.fills.length > 0 && this.holdCount === 0) {
              this.boughtLow = false;
            }

            this.printState();
            this.buyAndSellTheSwingsSolution(done);
          });
        } else {
          console.log('bought low but not ready...?', this.boughtLowPrice);
          setTimeout(() => {
            this.buyAndSellTheSwingsSolution(done);
          }, 50);
        }
      } else {
        //this.printState();
        setTimeout(() => {
          this.buyAndSellTheSwingsSolution(done);
        }, 50);
      }
    });
  }
}

module.exports.DuelingBulldozers = DuelingBulldozers;