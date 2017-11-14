const { Router } = require('express')
const SyllaCrap = require('../utils/SyllaCrap')

const routes = Router()

routes.get('/import', (req, res) => {
	const SC = new SyllaCrap('')
	res.status(204).send() //no contentń
})

module.exports = routes