const mongoose = require('mongoose')

const url = new mongoose.Schema({
    long_url:{
        type: String,
        required: true
    },
    short_url_code:{
        type:String,
        required: true
    },
    author:{
        type: String,
        required: true
    },
    long_url_nickname:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('urls', url)