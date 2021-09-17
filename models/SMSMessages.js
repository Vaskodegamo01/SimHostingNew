const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SMSMessageSchema = new Schema({
    PhoneNumber: {
        type: Schema.Types.ObjectId,
        ref: 'GsmModules'
    },
    PhoneNumberFrom: {
        type: String
    },
    PhoneNumberTo: {
        type: String
    },
    SMSMessage: {
        type: String
    },
    NewSMSMessageFlag: {
        type: Boolean
    },
    SMSMessageFlagSending: {
        type: Boolean
    },
    createdAt: {type: Date, required: true}
});

const SMSMessages = mongoose.model('SMSMessages', SMSMessageSchema);

module.exports = SMSMessages;
