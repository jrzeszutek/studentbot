var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.get('/studentbot', function (req, res) {


    // here should be  JSON with urls to all syllabus year for one faculty
    URL_MAP = {
        "faculty": {
            "course": {
                "year_of_course": "URL"
            }
        }
    };

    url = 'https://syllabuskrk.agh.edu.pl/2013-2014/pl/magnesite/study_plans/stacjonarne-teleinformatyka';

    //here should be JSON with html ID of each course. This information is crutial for later processing scraping of web

    request(url, function (error, response, html) {
        if (!error) {
            var lectureId, lectureName, ectsCount, lecturesHours, exercisesHours, lectureHref;

            var $ = cheerio.load(html);
            var json = {
                lectureHtmlId: "",
                lectureId: "",
                lectureName: "",
                ectsCount: "",
                lecturesHours: "",
                exercisesHours: "",
                lectureHref: ""
            };

            $("tr[data-id='8826']>td:nth-child(2)").filter(function () {
                var data = $(this);
                json.lectureName = data.text().trim();
            })

            $("tr[data-id='8826']>td:nth-child(3)").filter(function () {
                var data = $(this);
                json.lecturesHours = data.text().trim();
            })

            $("tr[data-id='8826']>td:nth-child(5)").filter(function () {
                var data = $(this);
                json.exercisesHours = data.text().trim();
            })

            $("tr[data-id='8826']>td:nth-child(15)").filter(function () {
                var data = $(this);
                json.ectsCount = data.text().trim();
            })
            console.info('info for PT: ', json)
        }

        res.send(json)
        process.exit();
    })
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
