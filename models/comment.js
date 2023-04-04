const mongoose = require("mongoose");
const validator = require("validator");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    comment: {
        type: String,
        require: true
    },
    publishDate: {
        type: Date,
        require: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
});

CommentSchema.virtual("url").get(function () {
    return `/`;
})

CommentSchema.virtual("publishDate_formatted").get(
    function () {
        return DateTime.fromJSDate(this.publishDate).toLocaleString(DateTime.DATE_MED);
    }
);

module.exports = mongoose.model("Comment", CommentSchema);