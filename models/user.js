const mongoose = require("mongoose");
const validator = require("validator");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        require: [true, 'username required'],
        maxLength: 50,
        unique: [true, 'already existing user']
    },
    email: {
        type: String,
        trim: true,
        unique: [true, 'already exists user with this email'],
        require: [true, 'email required'],
        validate: [validator.isEmail, 'invalid email']
    },
    password: {
        type: String,
        require: true,
    },
    admin: {
        type: Boolean,
        default: false,
    }
});

UserSchema.virtual("url").get(function () {
    return `/`;
})

module.exports = mongoose.model("User", UserSchema);