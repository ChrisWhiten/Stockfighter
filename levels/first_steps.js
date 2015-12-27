'use strict';
const Level = require('./level').Level;
const logger = require('winston');

class FirstSteps extends Level {
  constructor(apiKey, account, venue, stock) {
    super(apiKey, account, venue, stock);
  }

  solve() {
    super.solve('First Steps');

    this.firstStepsSolution(() => {
      logger.info('done');
    });
  }

  firstStepsSolution(done) {
    this.order(1000, 100, 'market', 'buy', () => {
      done();
    });
  }
}

module.exports.FirstSteps = FirstSteps;