const { Router } = require('express')
const Helper = require('../utils/Helper')
const SyllaCrap = require('../utils/SyllaCrap')

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
		checkUrl: '/successLog',
		timeStart,
		status: 'STARTED',
	})
})

module.exports = routes
