const EventEmitter = require('events');

class StockEmitter extends EventEmitter {}

module.exports = new StockEmitter();