const cheerio = require('cheerio')

/**
 * @class SyllaCrap
 * Class is responsible for getting information from HTML webpage given as input
 * Syllabus + Scraping = SyllaCrap
 */
class SyllaCrap {

	constructor (html) {
		this.$ = cheerio.load(html)
	}

	import () {
		return new Promise((resolve, reject) => {
			const subs = []

			this.$('tr[data-id]').map((i, element) => {
				let row = this.$(element)
				let children = row.children()
				const retDoc = {}

				children.map((i, child) => {
					let td = this.$(child)
					/** TODO: przeniesc do osobnych funkcji */
					if (i == 1) {
						retDoc.subjectName = td.text().trim()
					}

					if (i == 2) {
						retDoc.lecturesCount = td.text().trim()
					}

					if (i == 3) {
						retDoc.classesCount = td.text().trim()
					}

					if (i == 4) {
						retDoc.projectClassesCount = td.text().trim()
					}

					if (i == 14) {
						retDoc.ECTSCount = td.text().trim()
					}

					if (i == 15) {
						let content = td.text().trim()
						retDoc.isExam = content == '+' ? true : false
					}
				})

				retDoc.categoryFlags = this.categoryMapper(row.parent().children().first().text().trim())
				// console.log(this.categoryMapper(row.parent().children().first().text().trim()))


				subs.push(retDoc)
			})

			return resolve(subs)
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
console.log(flags)
		return flags
	}

	get cheerio () {
		return this.$
	}
}

module.exports = SyllaCrap
