const { Router } = require('express')
const rp = require('request-promise')
const Helper = require('../utils/Helper')
const SyllaCrap = require('../utils/SyllaCrap')
const UrlMap = require('../config/map')

const routes = Router()

routes.get('/import/:year/:faculty/:degree', (req, res) => {

	const year = Helper.getYear(req.params.year)
	const combo = Helper.getPath(req.params.faculty, req.params.degree)

	if (!year || !combo) {
		return res.status(400).send() // Bad Request
	}

	const scrapUrl = `https://www.syllabus.agh.edu.pl/${year}/pl/magnesite/study_plans/${combo}` 

	return res.json({ ...req.params, scrapUrl })
})

module.exports = routes
