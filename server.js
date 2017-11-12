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


    url = 'https://syllabuskrk.agh.edu.pl/2016-2017/pl/magnesite/study_plans/stacjonarne-teleinformatyka';

    //here should be JSON with html ID of each course. This information is crutial for later processing scraping of web

    request(url, function (error, response, html) {
        if (!error) {
            var lectureId, lectureName, ectsCount, lecturesHours, exercisesHours, lectureHref, isExam;

            var $ = cheerio.load(html);
            var json = {
                lectureHtmlId: "",
                lectureId: "",
                lectureName: "",
                ectsCount: "",
                lecturesHours: "",
                exercisesHours: "",
                isExam:"",
                lectureHref: "",
                lectureData:{}
            };

            $("tr[data-id='8826']>td:first-child").filter(function () {
                var data = $(this);
                json.lectureId = data.text().trim().toLowerCase();
            });

            $("tr[data-id='8826']>td:nth-child(2)").filter(function () {
                var data = $(this);
                json.lectureName = data.text().trim().toLowerCase();
            });

            $("tr[data-id='8826']>td:nth-child(3)").filter(function () {
                var data = $(this);
                json.lecturesHours = data.text().trim();
            });

            $("tr[data-id='8826']>td:nth-child(5)").filter(function () {
                var data = $(this);
                json.exercisesHours = data.text().trim();
            });

            $("tr[data-id='8826']>td:nth-child(15)").filter(function () {
                var data = $(this);
                json.ectsCount = data.text().trim();
            });


            $("tr[data-id='8826']>td:last-child").filter(function () {
                var data = $(this);

                if (data.text().trim() === "+") {
                    json.isExam = "true";
                } else {
                    json.isExam = "false";
                }
            });

            json.lectureHref = url + '/module/' + json.lectureId + '-' + (json.lectureName).replace(" ", "-");
        }

        res.send(json);
        process.exit();
    })
})


app.listen('8081')
console.log('Studenbot is working: ');
exports = module.exports = app;
