var app = angular.module('StudentBot', []);
app.controller('chatbotCtrl', function ($scope, $http) {
    $scope.subjects = [];
    $scope.loading = true;
    $scope.lastAction = {};

    /*
     * Pobierz dane z API
     */
    $http.get('/api/subject')
        .then(function (data) {
            $scope.subjects = data.data.docs;
            $scope.loading = false;
        })

    /**
     * ChatBot - StudentBot
     */
    var studentEngine = function () {
        var capabilities = [
            "Informacje o prowadzącym przedmiot: 'Kto prowadzi przedmiot [nazwa]?'",
            "Informacje o punktach ECTS: 'Ile punktów ECTS kosztuje przedmiot [nazwa]?'",
            "Informacje o egzaminach: 'Ile jest egzaminów na semestrze [numer]?'",
            "Informacje o egzaminie z danego przedmiotu: 'Czy jest egzamin z przedmiotu [nazwa]?'",
            "Informacje o laboratoriach: 'Ile godzin laboratoriów jest na przedmiocie [nazwa]?'",
            "Informacje o wykładach: 'Ile godzin wykładów jest na przedmiocie [nazwa]?'",
            "Informacje o ćwiczeniach: 'Ile godzin ćwiczeń jest na przedmiocie [nazwa]?'"
        ];
        var subPattern = /(?:(?:przedmio[a-z]*)\s)([A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]*)\??$/i;    // Nazwa przedmiotu
        var semesterPattern = /(?:(?:semestr[a-z]*)\s)(\d{1,2})/i;                          // Numer semestru
        var whoPattern = /kto\s[a-z]*pr[a-z]+dz[a-z]*/i;                                    // Kto prowadzi
        var ectsPattern = /ile\s*[a-z]*\spu[a-z]+kt[a-zżźćńółęąś]*/i;                       // Ile jest punktow
        var examsNumberPattern = /ile\sjest\seg[a-z]+in/i;                                  // Ile jest egzamin
        var isExamPattern = /Czy\sjest\seg[a-z]+in/i;                                       // Czy jest egzamin
        var labsPattern = /ile\sgo[a-z]+\sla[a-z]+or[a-zżźćńółęąś]+/i;                      // Ile godzin laboratorium
        var lecPattern = /ile\sgo[a-z]+\swy[a-zżźćńółęąś]+ad[a-zżźćńółęąś]+/i;              // Ile godzin wykładów
        var exPattern = /ile\sgo[a-z]+\sćw[a-z]+e[a-zżźćńółęąś]*/i;                         // Ile godzin ćwiczeń

        return {
            react: function (query) {
                var content = '';
                var similar = [];
                var similarNames = [];

                /** Kontynuacja konwersacji */
                if ($scope.lastAction && $scope.lastAction !== {}) {
                    if ($scope.lastAction.type === 'additional_query') {
                        $scope.lastAction.candidates.map(function (el) {
                            console.log(el);
                            if (el[$scope.lastAction.field] === query) {
                                content = printSubject(el);
                                $scope.lastAction = {};
                            }
                        });

                        if (!content) {
                            content = 'Hmm coś nie możemy się dogadać. Spróbuj jaśniej :)';
                            $scope.lastAction = {};
                        }
                    }
                }

                /** Pytanie o prowadzacego **/
                if (whoPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printSubject(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. To wszystko co o nim wiem: ${printSubject(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }
                /** Pytanie o punkty ECTS **/
                else if (ectsPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printECTS(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. 
                                To informacja o punktach ECTS dotycząca tego przedmiotu: ${printECTS(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }
                /** Pytanie o liczbę egzaminów **/
                else if (examsNumberPattern.test(query)) {
                    /** Semestr */
                    if (semesterPattern.test(query)) {
                        var groups = semesterPattern.exec(query);
                        var number = groups[1].toLowerCase();
                        var exams = 0

                        // TODO: obsluga pytania o liczbe egzaminow na semestrze "number"
                        $scope.subjects.map(function (el) {
                            if (el.semesterNumber == number && el.isExam == true) {
                                exams++;
                            }
                        });

                        content = `Na semestrze ${number} jest ${exams} egzaminów do zdania.`
                    }
                }
                /** Pytanie o egzamin z konkretnego przedmiotu **/
                else if (isExamPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printIsExam(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. 
                                To informacja o egzaminie z tego przedmiotu: ${printIsExam(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }
                /** Pytanie o liczbę godzin laboratorium z danego przedmiotu **/
                else if (labsPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printLabs(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. 
                                To informacja o laboratoriach z tego przedmiotu: ${printLabs(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }
                /** Pytanie o liczbe godzin wykladow **/
                else if (lecPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printLectures(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. 
                                To informacja o wykladach z tego przedmiotu: ${printLectures(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }
                /** Pytanie o cwiczenia z danego przedmiotu **/
                else if (exPattern.test(query)) {
                    /** Przedmioty */
                    if (subPattern.test(query)) {
                        var groups = subPattern.exec(query);
                        var name = groups[1].toLowerCase();

                        $scope.subjects.map(function (el) {
                            if (el.subjectName.toLowerCase() == name) {
                                content = printExercises(el);
                            } else if (el.subjectName.toLowerCase().indexOf(name) > -1) {
                                similar.push(el);
                                similarNames.push(el.subjectName);
                            }                    
                        });

                        if (!content) {
                            if (similarNames.length === 0) {
                                content = 'Przepraszam, ale nie znam takiego przedmiotu ;(';
                            } else if (similarNames.length == 1) {
                                content = `Prawdopodobnie chodziło Ci o przedmiot ${similar[0].subjectName}. 
                                To informacja o cwiczeniach z tego przedmiotu: ${printExercises(similar[0])}`;
                            } else {
                                content = `Czy chodziło Ci o przedmiot ${similarNames.join(' czy ')}?`;

                                $scope.lastAction = {
                                    type: 'additional_query',
                                    field: 'subjectName',
                                    candidates: similar
                                }
                            }
                        }
                    }
                }

                ChatBot.addChatEntry(content, "bot");
                ChatBot.thinking(false);
            },
            getCapabilities: function () {
                return capabilities;
            }
        }
    }

    var config = {
        botName: 'StudentBot',
        inputs: '#humanInput',
        inputCapabilityListing: false,
        engines: [studentEngine()],
        addChatEntryCallback: function (entryDiv, text, origin) {
            entryDiv.delay(200).slideDown();
        }
    };
    ChatBot.init(config);
    ChatBot.setBotName("StudentBot");

    /** Kulturalne */
    ChatBot.addPattern('^(dzięki|dziękuje|thx|thanks)$', 'response', 'Nie ma za co, pytaj o co chcesz ;)', undefined, 'Nie zapomnij podziękować!');

    function printSubject(sub) {
        return `Przedmiot ${sub.subjectName} jest prowadzony przez ${sub.attendant.academicTitle} ${sub.attendant.fullName} na ${sub.semesterNumber} semestrze kierunku ${sub.facultyName}`;
    }

    function printECTS(sub) {
        return `Przedmiot ${sub.subjectName} kosztuje ${sub.ECTSCount} punktów ECTS.`;
    }

    function printIsExam(sub) {
        if (sub.isExam == true) {
            return `Z przedmiotu ${sub.subjectName} jest egzamin.`;    
        }
        else {
            return `Z przedmiotu ${sub.subjectName} nie ma egzaminu.`; 
        }
    }

    function printLabs(sub) {
        return `Na przedmiocie ${sub.subjectName} jest ${sub.labClassesCount} godzin laboratoriów.`;
    }

    function printLectures(sub) {
        return `Na przedmiocie ${sub.subjectName} jest ${sub.lecturesCount} godzin wykładów.`;
    }

    function printExercises(sub) {
        return `Na przedmiocie ${sub.subjectName} jest ${sub.classesCount} godzin ćwiczeń.`;
    }
});
