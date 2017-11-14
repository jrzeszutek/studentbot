const express = require('express')
const logger = require('morgan')
const routes = require('./routes')

const app = express()

/** Config **/
app.set('port', 3000)
app.use(logger('dev'))
app.use(routes)

app.listen(app.get('port'), () => {
	console.info(`[i] Server is running on localhost:${app.get('port')}`)
})