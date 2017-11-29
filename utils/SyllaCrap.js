const cheerio = require('cheerio')
const rp = require('request-promise')
const mongo = require('../config/mongo')

/**
 * @class SyllaCrap
 * Class is responsible for getting information from HTML webpage given as input
 * Syllabus + Scraping = SyllaCrap
 */
class SyllaCrap {

    constructor(url, originalUrl, timeStart, year, faculty) {
        this.url = url
        this.originalUrl = originalUrl
        this.faculty = faculty
        this.timeStart = new Date(timeStart)
        this.year = year
        this.subs = []
        this.errorsCount = 0
        this.status = 'IN PROGRESS'
    }

    async start() {
        const db = await mongo()
        await this.saveFirstStatus(db)

        const html = await rp(this.url)

        this.$ = cheerio.load(html)
        console.info('\t[Import START]')

        await this.importMain()

        console.info('\t[Import END]')

        let insertResult;

        try {
            insertResult = await db.collection('subjects').insertMany(this.subs)
            console.info(`[i] Subjects imported to database: ${insertResult.insertedCount}`)
        } catch (e) {
            this.errorsCount++;
            console.info(`[i] Import aborted. Probably duplicated entries or internal error`)
        }

        const finishTime = new Date()
        const totalTime = finishTime - this.timeStart

        console.info(`[i] Total Time of operation: ${Math.floor(totalTime / 1000)} s`)
        console.info(`[x] Total errors number: ${this.errorsCount}`)

        console.info('\t[OPERATION END]')

        await this.saveFinishStatus(totalTime, db)
        db.close()

        return
    }

    async importMain() {
        const rows = this.$('tr[data-id]')
        console.info(`[i] SyllaCrap::importMain:: ${rows.length} subjects found`)

        for (let i = 0; i < rows.length; i++) {
            const doc = await this.prepareDoc(rows[i])
            this.subs.push(doc)
        }
    }

    async prepareDoc(singleRow) {
        const row = this.$(singleRow)
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
                    doc.labClassesCount = td.text().trim()
                    break
                case 5:
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

        return await this.mapDetail(doc)
    }

    async mapDetail(doc) {
        let dtHtml;

        try {
            dtHtml = await rp(doc.detailUrl)
        } catch (e) {
            console.error(`[Error] For URL: ${doc.detailUrl} :\n\nerr.message`)
            this.errors++;
            return doc
        }

        const dt = cheerio.load(dtHtml)

        const addInfos = dt('div.label').find('span')

        addInfos.map((i, child) => {
            const label = dt(child).text().trim()

            if (label && label.includes('Osoba odpowiedzialna')) {
                const attendant = this.getTextFromDetail(dt, child)
                const attendantTest = attendant.match(this.leaderRegexp)

                if (!attendantTest) {
                    doc.attendant = {}
                } else {
                    doc.attendant = {
                        academicTitle: attendantTest[1] || '',
                        fullName: attendantTest[2] || '',
                        email: attendantTest[3] || ''
                    }
                }
            } else if (label && label.includes('Język wykładowy')) {
                const lang = this.getTextFromDetail(dt, child)
                doc.courseLanguage = (lang && typeof lang == 'string') ? lang.toLowerCase() : ''
            } else if (label && label.includes('Semestr')) {
                doc.semesterNumber = this.getTextFromDetail(dt, child)
            } else if (label && label.includes('Kierunek')) {
                doc.facultyName = this.getTextFromDetail(dt, child)
            } else if (label && label.includes('Poziom')) {
                const studiesLevel = this.getTextFromDetail(dt, child)
                doc.studiesLevel = this.getStudiesLevel(studiesLevel)
            } else if (label && label.includes('Forma i tryb')) {
                const type = this.getTextFromDetail(dt, child)
                doc.studiesType = (type && typeof type == 'string') ? type.toLowerCase() : ''
            }
        })

        doc.moduleDescription = this.getDescription(dt)
        doc.gradeLevel = this.year

        return doc
    }

    async saveFirstStatus(db) {
        const statusObj = {
            status: this.status,
            duration: '',
            url: this.originalUrl,
            faculty: this.faculty,
            timeStart: this.timeStart,
        }

        await db.collection('statuses').insertOne(statusObj)

        return
    }

    async saveFinishStatus(time, db) {
        this.status = (this.errorsCount > 0) ? 'ERROR' : 'SUCCESS'

        const updateResult = await db.collection('statuses').updateOne({
            "faculty": this.faculty,
            "timeStart": this.timeStart
        }, {
            $set: {
                "status": this.status,
                "duration": time
            }
        })

        return
    }

    categoryMapper(raw) {
        const flags = []
        const test = raw.toLowerCase()

        if (/obieraln/.test(test)) {
            flags.push('elective')
        } else if (/obce/.test(test)) {
            flags.push('language')
        } else if (/humanistyczn/.test(test)) {
            flags.push('humanistic')
        }

        return flags
    }

    getDescription(dt) {
        const legend = dt('legend').filter(function() {
            return dt(this).text().trim().includes('charakterystyka modułu')
        })
        const desc = dt(legend).siblings('.info-group-row').children().find('.content').text().trim()

        return (desc && desc.length > 1) ? desc : null
    }

    getTextFromDetail(dt, child) {
        return dt(child).parent().siblings('.element-wrapper').children().find('.content').text().trim()
    }

    getStudiesLevel(text) {
        const match = text.match(/\w+\s(I{1,2})\s\w+/)

        return !match ? null : match[1]
    }

    get leaderRegexp() {
        return /(?:([\wż\. \,]+)\s+)?([\wąężźćóńł\-]+ [\wąężźćóńł\-]+)[\n\s]+\(([\w\.]+\@[\w\.]+)\)/
    }

    get cheerio() {
        return this.$ || {}
    }
}

module.exports = SyllaCrap
