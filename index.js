const express = require('express')
const fetch = require('node-fetch')
const app = express()
const mongoose = require('mongoose')
const FormData = require('form-data')
const config = require('./config.json')
const URL_INFO = require('./models/url')
const { findOne } = require('./models/url')
app.use(require('express-session')(config.session))
app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
   if(!req.session.bearer_token) return res.redirect('/login')
   const data = await fetch(`https://discord.com/api/v9/users/@me`, {
       headers:{
           "Authorization": `Bearer ${req.session.bearer_token}`
       }
   })
   const json = await data.json()
   console.log(json)
   res.render('index', {
       json: json
   })
})

app.get('/login', (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize` +
    `?client_id=${config.oauth2.client_id}` +
    `&redirect_uri=${encodeURIComponent(config.oauth2.redirect_uri)}` +
    `&response_type=code&scope=${encodeURIComponent(config.oauth2.scopes.join(" "))}`)
})

app.get('/api/callback', async (req, res) => {
    const accessCode = req.query.code 
    if(!accessCode) return res.send('No access code provided')
    const data = new FormData()
    data.append('client_id', config.oauth2.client_id)
    data.append('client_secret', config.oauth2.secret)
    data.append('grant_type', 'authorization_code')
    data.append('redirect_uri', config.oauth2.redirect_uri)
    data.append('scopes', 'identify')
    data.append('code', accessCode)

    const json = await (await fetch('https://discord.com/api/v9/oauth2/token', {
        method:'POST',
        body: data
    })).json()
    console.log(json)
    req.session.bearer_token = json.access_token
    res.redirect('/')
})

app.get('/:url', async (req, res) => {
    const SHORT_URL = await findOne({ short_url_code: url })
    if(!SHORT_URL) return res.redirect('/err')
    res.redirect(SHORT_URL.long_url)
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

app.listen(config.port || 5000, async err => {
    /*await mongoose.connect(config.mongo_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoIndex: true
    }).then(() => {
        console.log('[SUCCESS] MongoDB Database Connected')
    })*/
    console.log('[SUCCESS] URL Shortener online and working!')
})