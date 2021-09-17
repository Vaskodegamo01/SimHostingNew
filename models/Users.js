const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        validate: {
            validator: async function (value) {
                if (!this.isModified('username')) return true;

                const user = await Users.findOne({username: value});
                return !user;
            },
            message: props => `${props.value} username already exists`
        },
        required: [true, 'username is required']
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    createdAt: {type: Date, required: true}
});

UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        //delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        return ret;
    }
});

UserSchema.methods.checkPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.generateToken = function () {
    return nanoid(20);
};

const Users = mongoose.model('Users', UserSchema);

module.exports = Users;
