'use strict';
const request = require('request');
const Level = require('./level');
const logger = require('winston');


class ChockABlock extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);

    this.filledCount = 0;
    this.filledTarget = 300000;
    this.firstPurchase = null;
  }

  solve() {
    super.solve('Chock a block');

    this.purchaseLoop(() => {
      logger.info('done');
    });
  }

  purchaseLoop(done) {
    if (this.filledCount >= this.filledTarget) {
      return done();
    }

    this.getAQuote((err, quote) => {
      if (err || !quote) {
        logger.error('error getting quote...', err);
        setTimeout(() => {
          this.purchaseLoop(done);
        }, 500);
        return;
      }

      if (!quote.ask || typeof quote.ask !== 'number') {
        setTimeout(() => {
          this.purchaseLoop(done);
        }, 100);

        return;
      }

      const ask = quote.ask;
      if (!this.firstPurchase) {
        this.firstPurchase = ask;
      }

      if (ask > this.firstPurchase * 0.97) {
        logger.info('ask has raised more than desired', this.firstPurchase, ask);
        setTimeout(() => {
          this.purchaseLoop(done);
        }, 1000);
        return;
      }

      const qty = this.filledTarget - this.filledCount > quote.askSize ? quote.askSize : this.filledTarget - this.filledCount;
      this.timeBoundOrder(ask, qty, 'limit', 'buy', 500, (err, order) => {
        if (err) {
          logger.error('error fulfiling purchase', err);
        } else {
          console.log(order);
          logger.info('Order fill count:', order.totalFilled);
          this.filledCount += order.totalFilled;
          logger.info('Total fill count:', this.filledCount);
        }

        this.purchaseLoop(done);
      });

    });
  }
}

module.exports = ChockABlock;