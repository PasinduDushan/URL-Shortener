const express = require('express')
const fetch = require('node-fetch')
const app = express()
const mongoose = require('mongoose')
const FormData = require('form-data')
const Swal = require('sweetalert2')
const config = require('./config.json')
const URL_INFO = require('./models/url')
const parser = require('body-parser')

app.use(parser.urlencoded({ extended: false }))
app.use(parser.json())
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
   const URL_CODE = await URL_INFO.find({ author: json.username })
   res.render('index', {
       json: json,
       URL_CODE: URL_CODE
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
    const SHORT_URL = await URL_INFO.findOne({ short_url_code: req.params.url })
    if(!SHORT_URL) {
        res.redirect('/x/error?code=404&message=We cannot find this short URL')
        return
    }
    res.redirect(`${SHORT_URL.long_url}?code=200 source=shortner.net state=success`)
})

app.post('/addurl/success', async (req, res) => {
    if(!req.session.bearer_token) return res.redirect('/login')
    const data = await fetch(`https://discord.com/api/v9/users/@me`, {
       headers:{
           "Authorization": `Bearer ${req.session.bearer_token}`
       }
   })
   const json = await data.json()
   const URL = await URL_INFO.findOne({ long_url_nickname: req.body.nickname })
   if(URL){
       res.redirect(`/x/error?code=403&message=This nickname already exists`)
   } else {
    await URL_INFO.findOneAndUpdate(
        {
            long_url: req.body.id
        },
        {
            short_url_code: createCode(7),
            author: json.username,
            long_url_nickname: req.body.nickname
        },
        { upsert: true }
    )
    res.redirect('/')
   }
})

app.get('/x/error', function(req, res){
    res.render('error',{
            req:req
    })
})

app.post('/delete/success/:code', async (req, res) => {
    await URL_INFO.findOneAndDelete(
        {
            short_url_code: req.params.code
        }
    )
    res.redirect('/')
})

app.post('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

function createCode(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.listen(config.port || 5000, async err => {
    await mongoose.connect(config.mongo_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoIndex: true
    }).then(() => {
        console.log('[SUCCESS] MongoDB Database Connected')
    })
    console.log('[SUCCESS] URL Shortener online and working!')
})