const { Router } = require('express')
const Helper = require('../utils/Helper')
const SyllaCrap = require('../utils/SyllaCrap')
const mongo = require('../config/mongo')

const routes = Router()

routes.get('/import/:year/:faculty/:degree', (req, res) => {

	const year = Helper.getYear(req.params.year)
	const combo = Helper.getPath(req.params.faculty, req.params.degree)

	if (!year || !combo) {
		return res.status(400).send() // Bad Request
	}

	const scrapUrl = `https://www.syllabus.agh.edu.pl/${year}/pl/magnesite/study_plans/${combo}` 

	/** Start import and end request */
	let timeStart = new Date().toISOString()
	const SC = new SyllaCrap(scrapUrl, req.path, timeStart, year, req.params.faculty)
	SC.start()

	return res.json({
		scrapUrl,
		checkUrl: '/log',
		timeStart,
		status: 'STARTED',
	})
})

routes.get('/log', async function (req, res) {
	const db = await mongo()
	db.collection('statuses').find().toArray((err, docs) => {
		if (!err) {
			console.log(JSON.stringify(docs))
			return res.render('logs', { docs })
		} else {
			return res.render('logs', { docs: [] })			
		}
		
	})

})

module.exports = routes
