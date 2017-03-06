var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//var Ticket = require('./ticket');

module.exports = mongoose.model('Event', new Schema({
    name: String,
    desc: String,
    date: Date,
    tickets: [{
        kind: String,
        buyer: String
    }]
}));