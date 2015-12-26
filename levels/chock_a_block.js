'use strict';
const request = require('request');
const Level = require('./level').Level;


class ChockABlock extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);

    this.filledCount = 0;
    this.filledTarget = 100000;
    this.interval = 5000;
    this.orderSleep = 2000;
    this.sneakySleep = 100;
  }

  solve() {
    super.solve('Chock a block');

    this.getAQuote((quote, err) => {
      console.log(this);
      this.initialAsk = quote.ask;
      this.purchaseLoop(() => {
        console.log('all done!');
      });
    });
  }

  purchaseLoop(done) {
    if (this.filledCount >= this.filledTarget) {
      done();
      return;
    }

/*
Get a quote for the stock.
Send in a buy or sell order , depending on what you're trying to accomplish.
Wait a few seconds.
See if you got a fill by querying the order.
Goto #1.
*/
    this.getAQuote((quote, err) => {
      if (err || !quote) {
        console.log('error getting quote...', err);
        setTimeout(() => {
          this.purchaseLoop(done);
        }, this.orderSleep);
        return;
      }

      const ask = quote.ask;
      if (ask > this.initialAsk * 1.05) {
        console.log('ask has raised more than 5 percent...', this.initialAsk, ask);
        setTimeout(() => {
          this.purchaseLoop(done);
        }, this.sneakySleep);
        return;
      }

      this.order(Math.floor(ask * 1), done);
    });
  }

  order(ask, done) {
    const qty = this.filledTarget - this.filledCount > this.interval ? this.interval : this.filledTarget - this.filledCount;

    console.log('ordering...', qty);
    const options = {
      url: this.orderUrl,
      headers: this.headers,
      method: 'post',
      json: {
        account: this.account,
        venue: this.venue,
        symbol: this.stock,
        price: ask,
        qty: qty,
        direction: 'buy',
        orderType: 'limit'
      }
    };

    request.post(options, (err, response, body) => {
      const orderId = body.id;

      setTimeout(() => {
        // cancel the order
        const options = {
          url: this.orderUrl + '/' + orderId,
          headers: this.headers,
          method: 'delete'
        };

        request(options, (err, response, body) => {
          console.log('Order cancelled.');
          console.log(body);

          // check the order status...
          console.log('checking the order status');
          const options = {
            url: this.orderUrl + '/' + orderId,
            headers: this.headers,
            method: 'get'
          };

          request(options, (err, response, body) => {
            console.log('status: ', body);
            const quote = JSON.parse(body);
            console.log('got status...filled: ', quote.totalFilled);
            this.filledCount += quote.totalFilled;
            console.log('summed fill count:', this.filledCount);
            this.purchaseLoop(done);
          });
        });
      }, this.orderSleep);
    });
  }
}

module.exports.ChockABlock = ChockABlock;