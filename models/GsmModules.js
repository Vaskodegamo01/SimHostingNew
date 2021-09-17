const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GsmModuleSchema = new Schema({
    PhoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    ModuleAdress: {
        type: Number,
        unique: true,
        required: true
    },
    SMSStatusReady: {
        type: Boolean
    },
    Battery: {
        type: Number
    },
    QualityGSM: {
        type: Number
    },
    createdAt: {type: Date, required: true}
});

const GsmModules = mongoose.model('GsmModules', GsmModuleSchema);

module.exports = GsmModules;
