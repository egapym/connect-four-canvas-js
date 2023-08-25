(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Debug() { }

    // Header -----------------------------------------------
    global.Debug = Debug;
    global.Debug.displayMap = displayMap;
    global.Debug.displayGameRecord = displayGameRecord;
    global.Debug.functionTest = functionTest;

    var result = [];

    //盤情報が格納された配列を表示
    function displayMap(map) {
        var strMap = "";
        var strTurn;

        for (var i = 11; i >= 0; i--) {
            for (var j = 0; j < COL; j++) {
                if (map[i][j] == 0) {
                    strTurn = "・";
                } else if (map[i][j] == 1) {
                    strTurn = "Ｏ";
                } else if (map[i][j] == -1) {
                    strTurn = "Ｘ";
                }
                strMap = strMap + strTurn + "　";
            }
            strMap = strMap + "<br>";
        }
        document.getElementById('debugMsg').innerHTML = "<span style='color:#000;'>" + strMap + "</span>"
        return;
    }

    function displayGameRecord() {
        var strGameRecord = ""
        var state = Game.getState();
        let initTurn = Game.getInitTurn();
        if (initTurn == 1) {
            strGameRecord += "p";
        } else if (initTurn == -1) {
            strGameRecord += "c";
        } else {
            return;
        }
        for (var i = 0; i < state.gameRecord.length; i++) {
            if (state.gameRecord[i] == 10) {
                strGameRecord += "a";
            } else if (state.gameRecord[i] == 11) {
                strGameRecord += "b";
            } else if (!isNaN(state.gameRecord[i])) {
                strGameRecord += state.gameRecord[i];
            } else {
                error("棋譜データが正しくありません");
            }
        }
        document.getElementById('debugMsg').innerHTML = "<span style='color:#000;'>" + strGameRecord + "</span>"
        return;
    }

    function functionTest() {
        var state = Game.getState();
        var range = {
            handXStart: 0,
            handXEnd: 11
        };
        var bestHand = -1;
        cnt = 0;

        console.time('Single Thread');
        var res = Ai.montecarlo(state.boardStatus, -1);
        console.timeEnd('Single Thread');
        console.log('Best node: ' + res);
        console.log(cnt);
        document.getElementById('debugMsg').innerHTML = "<span style='color:#000;'>" + res + "</span>"

        return;
    }

})((this || 0).self || global);