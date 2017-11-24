const cheerio = require('cheerio')
const rp = require('request-promise')

/**
 * @class SyllaCrap
 * Class is responsible for getting information from HTML webpage given as input
 * Syllabus + Scraping = SyllaCrap
 */
class SyllaCrap {

	constructor(url, timeStart) {
		this.url = url
		this.timeStart = new Date(timeStart)
		this.subs = []
		this.queue = []
	}

	start() {
		rp(this.url)
			.then(html => {
				this.$ = cheerio.load(html)
				console.info('SyllaCrap:: Import in progress... START')

				this.importMain()
					.then(() => {
						let finishTime = new Date()
						let totalTime = finishTime - this.timeStart
						console.log(`Total Time of operation: ${Math.floor(totalTime / 1000)} s`)
						console.log(`Subjects imported number: ${this.subs.length}`)
						// TODO: save to database STATUS & SUBJECTS
					})
			})
	}

	importMain () {
		return new Promise((resolve, reject) => {
			const rows = this.$('tr[data-id]')
			console.info(`SyllaCrap::importMain:: ${rows.length} subjects found`)

			for (let i = 0; i < rows.length; i++) {
				this.queue.push(new Promise(finish => {
					const row = this.$(rows[i])
					const children = row.children()
					const doc = {}

					children.map((i, child) => {
						const td = this.$(child)

						switch (i) {
							case 1:
								doc.subjectName = td.text().trim()
								doc.detailUrl = `https://www.syllabus.agh.edu.pl${td.find('a').attr('href')}`
								break
							case 2:
								doc.lecturesCount = td.text().trim()
								break
							case 3:
								doc.classesCount = td.text().trim()
								break
							case 4:
								doc.projectClassesCount = td.text().trim()
								break
							case 14:
								doc.ECTSCount = td.text().trim()
								break
							case 15:
								let content = td.text().trim()
								doc.isExam = content == '+' ? true : false
								break
						}
					})

					doc.categoryFlags = this.categoryMapper(row.parent().children().first().text().trim())

					// TODO: osobna funkcja
					rp(doc.detailUrl)
						.then(dtHtml => {
							/** dt = detail */
							const dt = cheerio.load(dtHtml)
							doc.detailPresent = true
							return finish(doc)
						})
						.catch(err => {
							console.error(err)
							return finish({})
						})
				}))
			}

			Promise.all(this.queue)
				.then(coll => {
					this.subs = coll
					return resolve()
				})
		})
	}

	categoryMapper (raw) {
		const flags = []
		const test = raw.toLowerCase()

		if (/obieraln/.test(test)) {
			flags.push('elective')
		} else if (/obce/.test(test)) {
			flags.push('language')
			flags.push('elective')
		} else if (/human/.test(test)) {
			flags.push('humanistic')
			flags.push('elective')
		}

		return flags
	}

	get cheerio () {
		return this.$ || {}
	}
}

module.exports = SyllaCrap
