const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const USSDMessageSchema = new Schema({
    PhoneNumber: {
        type: Schema.Types.ObjectId,
        ref: 'GsmModules'
    },
    PhoneNumberFrom: {
        type: String
    },
    USSDMessage: {
        type: String
    },
    NewUSSDMessageFlag: {
        type: Boolean
    },
    USSDMessageFlagSending: {
        type: Boolean
    },
    createdAt: {type: Date, required: true}
});

const USSDMessages = mongoose.model('USSDMessages', USSDMessageSchema);

module.exports = USSDMessages;
