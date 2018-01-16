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
        var capabilities = [];
        var subPattern = /(?:(?:przedmiot|przedmiocie)\s)([A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]*)\??$/i;

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
});
