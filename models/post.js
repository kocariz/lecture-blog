const mongoose = require("mongoose");
const validator = require("validator");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    subtitle: {
        type: String
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
    mainText: {
        type: String,
        require: true
    },
    img: {
        type: String,
        require: true
    },
    imgTitle: {
        type: String,
        require: true
    }
});

PostSchema.virtual("url").get(function () {
    return `/`;
})

PostSchema.virtual("publishDate_formatted").get(
    function () {
        return DateTime.fromJSDate(this.publishDate).toLocaleString(DateTime.DATE_MED);
    }
);

module.exports = mongoose.model("Post", PostSchema);