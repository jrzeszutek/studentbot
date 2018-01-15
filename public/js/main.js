var app = angular.module('StudentBot', []);
app.controller('chatbotCtrl', function ($scope, $http) {
    $scope.subjects = [];
    $scope.loading = true;

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
    var config = {
        botName: 'StudentBot',
        inputs: '#humanInput',
        inputCapabilityListing: false,
        engines: [],
        addChatEntryCallback: function (entryDiv, text, origin) {
            entryDiv.delay(200).slideDown();
        }
    };
    ChatBot.init(config);
    ChatBot.setBotName("StudentBot");
    ChatBot.addPattern('(?:ile) (.*)', 'response', undefined, function (matches) {

        ChatBot.addChatEntry("Pattern: " + matches[1]);
    }, null);
});
