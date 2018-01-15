const express = require('express')
const logger = require('morgan')
const path = require('path')
const routes = require('./routes')

const app = express()

/** Config **/
app.set('port', 3000)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'templates'))
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes)

app.listen(app.get('port'), () => {
	console.info(`[i] Server is running on localhost:${app.get('port')}`)
})
