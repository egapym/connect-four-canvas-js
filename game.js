(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Game() { }

    // Header -----------------------------------------------
    global.Game = Game;
    global.Game.initGame = initGame;
    global.Game.setEvents = setEvents;
    global.Game.gameStartOnce = gameStartOnce;
    global.Game.gameReturn = gameReturn;
    global.Game.checkInvalidClickEvent = checkInvalidClickEvent;
    global.Game.getState = getState;
    global.Game.getInitTurn = getInitTurn;
    global.Game.error = error;
    // ------------------------------------------------------
    let ctx;//キャンバス要素
    let state = {}//現在の状態
    let init_state = {//ゲーム開始時の盤面の状態
        boardStatus: {
            map: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ],
            putHeight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],//積まれた高さ。12なら天井
            canPutOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],//αβ法を実行する際、探索する列の順序のリスト。x[0],x[1]..と順に呼ばれ、配列の中身の数字の列から順に探索する
            result: null,
        },
        colorOfPiece: 1,//1手進みごとに1,-1,1,-1...と切り替わる。1なら黒、-1なら白の駒を作成する
        turn: 1,//現在のターン。1ならプレイヤー、-1ならCPU
        initTurn: null,
        turnPlayer: null,
        turnCPU: null,
        selected: {//どの列が選択されているかの情報
            name: "",
            value: 0,
            hand: {
                X: 0,//列
                Y: 0//次に置ける高さ
            }
        },
        cpuSelected: {//どの列が選択されているかの情報
            hand: {
                X: 0,//列
                Y: 0//次に置ける高さ
            }
        },
        lastPutHand: {
            X: 0,
            Y: 0
        },
        invalidClickEvent: true,//プレイヤーがピースを置いた後、CPUが駒を積むまでクリックを無効にするフラグ
        lastMouseOverColumn: -1,//最後にマウスドラッグで選択した列
        is_thinkAI_finished: false,
        gameRecord: [],
    };
    let kifu = "";

    //p33655558338888aa65aa4077777712221122552669769769687728800b999bb33999461122444

    // p55674344556433354777877559999103171aaa11aa0a00573444045549a669997b04111700091b

    //名対局：c6664636624433223347820424777898878803aba332aa00224477b4b44bb
    //     var kifu = "c66677677866676637773b332a9401aa74";
    // var kifu = "c665767434544577567567";
    // 56443255443533666897788654
    function initGame(_ctx) {
        ctx = _ctx;
        state = Util.objCopy(init_state);
        Render.drawGameStart(state);
        //Render.renderBoard(state);
    }

    function setEvents() {
        var isTouch;
        if ('ontouchstart' in window) {
            isTouch = true;
        } else {
            isTouch = false;
        }
        if (isTouch) {
            ctx.canvas.addEventListener('touchstart', ev_mouseClick)
        } else {
            ctx.canvas.addEventListener('mousemove', ev_mouseMove)
            ctx.canvas.addEventListener('mouseup', ev_mouseClick)
        }
    }

    function ev_mouseMove(e) {
        state.selected = hitTest(getMouseHand(e));
        if (state.selected.name === "RECT_BOARD" && !state.invalidClickEvent) {
            if (state.selected.hand.X != state.lastMouseOverColumn) {
                Render.renderMouseMove(state, state.selected.hand.X, state.lastMouseOverColumn);
                state.lastMouseOverColumn = state.selected.hand.X;
            }
        } else {
            Render.eraceEffect(state.lastMouseOverColumn);
            state.lastMouseOverColumn = -1;
        }
    }

    function ev_mouseClick(e) {
        var selected = hitTest(getMouseHand(e));
        if (selected.name != "RECT_BOARD" || state.invalidClickEvent == true) {
            return;
        }
        if (!Ai.canPutCeiling(state.boardStatus, selected.hand.X)) {//置いてもいい場所かどうか判断
            return;
        }
        if (!isFinite(document.montecarlo.LimitPlayoutCount.value) || !isFinite(document.montecarlo.threshold.value)
            || document.montecarlo.LimitPlayoutCount.value == "" || document.montecarlo.threshold.value == "") {
            let message = "数字を入力してください";
            document.getElementById('errorMsg').innerHTML = "<span style='color:#FF0000;'>" + message + "</span>"//エラーメッセージを表示
            return;
        }

        state.invalidClickEvent = true;//クリックイベントを無効にする
        let promise = new Promise((resolve, reject) => {
            selected.hand.Y = state.boardStatus.putHeight[selected.hand.X];//プレイヤーが選択した列のどの行に置くか
            state.lastPutHand.X = selected.hand.X;
            state.lastPutHand.Y = selected.hand.Y;

            //プレーヤーが指した手を盤面に反映する
            state.boardStatus = Ai.putMap(state.boardStatus, selected.hand.X, state.turn);//プレーヤーの指し手を盤面に反映
            state.gameRecord.push(selected.hand.X);
            var result_isFourInLineAndPosition = Rule.isFourInLineAndPosition(state.boardStatus, state.lastPutHand.X, state.turn);
            var result_isCeiling = Ai.isCeiling(state.boardStatus);
            Render.drawPiece(state, false, function () {
                if (result_isFourInLineAndPosition[0]) {
                    Render.playerAndCPUInfo_winner(state, state.turn);
                    Render.drawFourInLine(result_isFourInLineAndPosition[1]);
                    gameFinished = [true, state.turn];
                    return;//対局終了（以降の処理をしない）
                } else if (result_isCeiling == true) {
                    window.alert("引き分け");
                    return;
                } else {
                    state.turn = -1 * state.turn;
                    resolve();
                }
            })
        })
        promise.then(() => {
            return new Promise((resolve, reject) => {

                setTimeout(function () {
                    cpuProcess(state, function () {
                        var result_isFourInLineAndPosition = Rule.isFourInLineAndPosition(state.boardStatus, state.lastPutHand.X, state.turn);
                        var result_isCeiling = Ai.isCeiling(state.boardStatus);
                        if (result_isFourInLineAndPosition[0]) {
                            Render.playerAndCPUInfo_winner(state, state.turn);
                            Render.drawFourInLine(result_isFourInLineAndPosition[1]);
                            gameFinished = [true, state.turn];
                            return;//対局終了（以降の処理をしない）
                        } else if (result_isCeiling == true) {
                            window.alert("引き分け");
                            return;
                        } else {
                            state.turn = -1 * state.turn;
                            //対局者情報画面更新
                            Render.playerAndCPUInfo_drawTurn(state.turn, function () {
                                state.invalidClickEvent = false;//クリックイベントを有効にする
                                resolve();
                            });
                        }
                    })
                }, 150);

            })
        }).catch(() => { // エラーハンドリング
            window.alert("err");
        })
    }

    //対局開始直前に一度だけ呼ばれる関数
    function gameStartOnce() {
        if (kifu.length >= 1) {//対局開始前に棋譜情報が入力されている場合、局面を再現してから対局を開始する
            phaseReproduction(kifu);
        }
        if (state.turn == -1) {//CPUが先手かどうか
            cpuProcess(state, function () {
                let result_isFourInLineAndPosition = Rule.isFourInLineAndPosition(state.boardStatus, state.lastPutHand.X, state.turn);
                if (result_isFourInLineAndPosition[0]) {
                    Render.playerAndCPUInfo_winner(state, state.turn);
                    Render.drawFourInLine(result_isFourInLineAndPosition[1]);
                    gameFinished = [true, state.turn];
                    return;//対局終了（以降の処理をしない）
                } else {
                    state.turn = state.turn * -1;
                    //対局者情報画面更新
                    Render.playerAndCPUInfo_drawTurn(state.turn, function () {
                        state.invalidClickEvent = false;//クリックイベントを有効にする
                    });
                }
            });
        } else {
            //対局者情報画面更新
            Render.playerAndCPUInfo_drawTurn(state.turn, function () { });
            state.invalidClickEvent = false;//クリックイベントを有効にする
        }
    }

    function cpuProcess(state, callback) {
        let strParam = null;
        strParam = "montecarlo";
        Ai.thinkAI(state, state.turn * -1, -1, strParam);

        let promise = new Promise((resolve, reject) => { // #1
            Render.playerAndCPUInfo_drawTurn(state.turn, function () {
                setTimeout(function () {
                    resolve();
                }, 100);
            });
        })
        promise.then(() => { // #2
            return new Promise((resolve, reject) => {

                var id = setInterval(function () {
                    //AIの処理終了フラグがtrueになった時
                    if (state.is_thinkAI_finished) {
                        clearInterval(id);
                        var bar = document.getElementById('class_prg');
                        var txt = document.getElementById('pct');
                        state.cpuSelected.hand.X = state.boardStatus.result;
                        if (state.cpuSelected.hand.X == -1) {
                            state.cpuSelected.hand.X = 0;
                            text_cpuAI.displayPlayerTurn = true;
                            Render.createText("詰みました..");
                        }
                        if (!text_cpuAI.displayPlayerTurn) {
                            text_cpuAI.text = "";
                        }
                        state.cpuSelected.hand.Y = state.boardStatus.putHeight[state.cpuSelected.hand.X];//プレイヤーが選択した列のどの行に置くか
                        state.lastPutHand.X = state.cpuSelected.hand.X;
                        state.lastPutHand.Y = state.cpuSelected.hand.Y;
                        state.boardStatus = Ai.putMap(state.boardStatus, state.cpuSelected.hand.X, state.turn);
                        state.gameRecord.push(state.cpuSelected.hand.X);
                        state.is_thinkAI_finished = false;
                        state.lastMouseOverColumn = -1;
                        resolve();
                    }
                }, 100);

            })
        }).then(() => { // #2
            return new Promise((resolve, reject) => {
                Render.drawPiece(state, false, function () {
                    callback();
                })
            })
        }).catch(() => { // エラーハンドリング
            window.alert("err");
        })

    }

    function getMouseHand(e) {
        if (!e.clientX) { //SmartPhone
            if (e.touches) {
                e = e.originalEvent.touches[0];
            } else if (e.originalEvent.touches) {
                e = e.originalEvent.touches[0];
            } else {
                e = event.touches[0];
            }
        }
        let rect = e.target.getBoundingClientRect();
        let point = {};
        point.x = e.clientX - rect.left;
        point.y = e.clientY - rect.top;

        return point;
    }

    //マウスの座標を取得(選択したX座標と置けるY座標を取得)
    function hitTest(point) {
        let objects = [Render.RECT_BOARD];
        let click_obj = null;
        let selected = {
            name: "",
            hand: {
                X: 0,
                Y: 0
            }
        }

        for (let i = 0; i < objects.length; i++) {
            if (objects[i].w + initialPositionX > point.x && objects[i].x + initialPositionX < point.x && objects[i].h + initialPositionY >= point.y && objects[i].y + initialPositionY <= point.y) {
                selected.name = "RECT_BOARD";
                break;
            }
        }
        switch (true) {//イディオム（if文の代用）
            case selected.name === "RECT_BOARD":
                selected.name = "RECT_BOARD";
                selected.hand.X = Math.floor((point.x - initialPositionX) / Render.CELL_SIZE)//クリックした列(X座標)を格納
                selected.hand.Y = state.boardStatus.putHeight[selected.hand.X];//プレイヤーが選択した列のどの行に置くか
                break;
        }
        return selected;
    }

    function phaseReproduction() {
        let playerTurn = state.turn;
        let hand = {
            X: null,
            Y: null,
        }
        if (kifu.charAt(0) == "p") {//1番目の文字が「p」ならプレイヤが先手、「c」ならCPUが先手
            state.turn = 1;
            if (playerTurn == -1) {
                error("棋譜データとプレイヤーの手番の整合性が取れません");
            }
        } else if (kifu.charAt(0) == "c") {
            state.turn = -1;
            if (playerTurn == 1) {
                error("棋譜データとプレイヤーの手番の整合性が取れません");
            }
        } else {
            error("棋譜データの先頭文字が「p」または「c」ではありません");
        }

        for (let i = 1; i < kifu.length; i++) {
            if (!isNaN(kifu.charAt(i))) {//i番目の文字が数字であるか
                hand.X = parseInt(kifu.charAt(i));
            } else if (kifu.charAt(i) == "a") {
                hand.X = 10;
            } else if (kifu.charAt(i) == "b") {
                hand.X = 11;
            } else {
                error("棋譜データが正しくありません");
            }
            hand.Y = state.boardStatus.putHeight[hand.X];//プレイヤーが選択した列のどの行に置くか
            state.lastPutHand.X = hand.X;
            state.lastPutHand.Y = hand.Y;
            state.boardStatus = Ai.putMap(state.boardStatus, hand.X, state.turn);
            state.gameRecord.push(state.lastPutHand.X);
            Render.drawPiece(state, true, function () {
                state.turn = state.turn * -1;
            });
        }
    }

    function error(errorMsg) {
        Render.drawError(errorMsg);
        throw new Error(errorMsg);
    }

    function gameReturn(spliceLength) {
        state.turn = 1
        //プレーヤーが指した手を盤面に反映する
        for (var i = 0; i < spliceLength; i++) {
            state.boardStatus = Ai.excludeMap(state.boardStatus, state.gameRecord[state.gameRecord.length - 1 - i]);//指し手を削除
        }
        state.gameRecord.splice(state.gameRecord.length - spliceLength, spliceLength);
        text_cpuAI.text = "";
        state.invalidClickEvent = false;//クリックイベントを有効にする
    }

    //invalidClickEventの値を返す
    function checkInvalidClickEvent() {
        return state.invalidClickEvent;
    }

    // stateを返す
    function getState() {
        return state;
    }

    // state.initTurnを返す
    function getInitTurn() {
        return state.initTurn;
    }

})((this || 0).self || global);
