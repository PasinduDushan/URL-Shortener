const mongoose = require('mongoose')

const user = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    userid:{
        type: String,
        required: true
    },
    account_verified:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('users', user)