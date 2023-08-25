(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Render() { }

    // Header -----------------------------------------------
    global.Render = Render;
    global.Render.renderscreen_board = renderscreen_board;
    global.Render.drawPiece = drawPiece;
    global.Render.renderMouseMove = renderMouseMove;
    global.Render.RECT_BOARD = RECT_BOARD;
    global.Render.eraceEffect = eraceEffect;
    global.Render.drawGameStart = drawGameStart;
    global.Render.drawError = drawError;
    global.Render.playerAndCPUInfo_drawTurn = playerAndCPUInfo_drawTurn;
    global.Render.playerAndCPUInfo_winner = playerAndCPUInfo_winner;
    global.Render.drawFourInLine = drawFourInLine;
    global.Render.changeCPUImg = changeCPUImg;
    //-------------------------------------
    let RECT_CANV = {
        x: 0,
        y: 0,
        w: 500,
        h: 500
    };
    var RECT_BOARD = {
        x: 0,
        y: 0,
        w: 500,
        h: 500
    };
    let CELL_SIZE = RECT_CANV.w / COL;

    let state_cache = null;
    let canv_cache = {
        canv_board: null,
        canv_pieaces: null,
        canv_effect: null,
        canv_animation: null
    };
    let effect = [];
    let effectPiece = [];
    let piece = [];
    let drawWin,
        drawLose,
        drawCellEffect = [];

    function renderscreen_board(state) {
        let board = new createjs.Shape();
        // 描画
        drawscreen_board(board.graphics);
        drawLine(board.graphics);
        drawscreen_boardLuster(board.graphics);
        playerAndCPUInfo_main(state);

        screen_board.addChild(board);

        // マスク用のシェイプを作成する
        let shapeMask = new createjs.Shape();
        shapeMask.graphics.beginFill("#000")
            .drawRoundRect(0, 0, RECT_CANV.w, RECT_CANV.h, 10, 10);

        shapeMask.x = initialPositionX;
        shapeMask.y = initialPositionY;
        // マスクを適用する
        screen_board.mask = shapeMask;

    }

    function renderMouseMove(state, nowRow, lastRow) {
        screen_board.removeChild(effect[lastRow], effectPiece[lastRow]);

        // 描画
        let x = state.selected.hand.X * CELL_SIZE;
        let y = 0;
        let effectPieceY = 11 - state.boardStatus.putHeight[state.selected.hand.X];

        //マウスオーバした列のエフェクト
        effect[nowRow] = new createjs.Shape();
        effect[nowRow].alpha = 0.2;
        effect[nowRow].graphics.beginFill("#FFFFFF")
            .drawRect(x, y, CELL_SIZE, RECT_CANV.h);

        //マウスオーバした列に駒の影を描画
        effectPiece[nowRow] = createPiece(1, 1, selectedPiecePlayer, false, false, x, (12 - state.selected.hand.Y) * CELL_SIZE);
        effectPiece[nowRow].alpha = 0.5;

        screen_board.addChild(effect[nowRow], effectPiece[nowRow]); // 表示リストに追加
    }

    function eraceEffect(X) {
        screen_board.removeChild(effect[X], effectPiece[X]);
    }

    //盤面
    function drawscreen_board(myGraphics) {
        myGraphics.beginLinearGradientFill(["#04cb04", "#006400"], [0.1, 0.9], 0, 0, RECT_CANV.w * 0.9, RECT_CANV.h * 0.94)
                    // myGraphics.beginLinearGradientFill(["#FFF", "#FFF"], [0.1, 0.9], 0, 0, RECT_CANV.w * 0.9, RECT_CANV.h * 0.94)
            .drawRoundRect(0, 0, RECT_CANV.w, RECT_CANV.h, 10, 10);
        return;
    }

    //盤面にマス目を引く
    function drawLine(myGraphics) {
        let color = "#FFFFFF";

        for (let x = 0; x <= 12; x++) {
            // 縦
            myGraphics.setStrokeStyle(1).beginStroke(color).moveTo(x * CELL_SIZE, 0).lineTo(x * CELL_SIZE, RECT_CANV.h).endStroke();
            myGraphics.beginFill(color).drawRect(x * CELL_SIZE, 0, 1, RECT_CANV.h);

            // 横
            myGraphics.setStrokeStyle(1).beginStroke(color).moveTo(0, x * CELL_SIZE).lineTo(RECT_CANV.w, x * CELL_SIZE).endStroke();
            myGraphics.beginFill(color).drawRect(x * CELL_SIZE, 0, RECT_CANV.w, 0).endStroke();
        }
    }

    // 盤面の光沢描画
    function drawscreen_boardLuster(myGraphics) {

        // 塗りつぶしの色を作成
        myGraphics.beginFill("rgba(255,255,255,0.1)");
        // 楕円を描く(x:0,y:0を中心とした、横半径50px,縦の半径100pxの楕円)
        myGraphics.drawEllipse(RECT_CANV.w * -0.4, RECT_CANV.h * -0.4, RECT_CANV.w, RECT_CANV.h * 0.74);
        // 描画終了
        myGraphics.endStroke();
    }

    // 駒
    function drawPiece(state, isPhaseReproduction, callback) {
        let moveToY = (12 - state.lastPutHand.Y) * CELL_SIZE;

        let x = state.lastPutHand.X * CELL_SIZE;
        let y = (12 - state.lastPutHand.Y) * CELL_SIZE;

        screen_board.removeChild(effect[state.lastPutHand.X], effectPiece[state.lastPutHand.X]);

        if (!isPhaseReproduction) {
            if (state.turn == 1) {
                if (selectedPiecePlayer >= 2) {
                    moveToY = moveToY - CELL_SIZE;
                }
                piece[state.gameRecord.length] = createPiece(state.turn, state.turnPlayer, selectedPiecePlayer, true, true, x, y);
            } else {
                if (selectedPieceCPU >= 2) {
                    moveToY = moveToY - CELL_SIZE;

                }
                piece[state.gameRecord.length] = createPiece(state.turn, state.turnPlayer, selectedPieceCPU, true, true, x, y);
            }
        } else {
            if (state.turn == 1) {
                piece[state.gameRecord.length] = createPiece(state.turn, state.turnPlayer, selectedPiecePlayer, true, false, x, y);
            } else {
                piece[state.gameRecord.length] = createPiece(state.turn, state.turnPlayer, selectedPieceCPU, true, false, x, y);
            }
        }
        state.colorOfPiece = -1 * state.colorOfPiece;//コマの色を切り替え

        //シェイプオブジェクトをステージに追加する
        screen_board.addChild(piece[state.gameRecord.length]);
        if (!isPhaseReproduction) {
            createjs.Tween.get(piece[state.gameRecord.length]) // ターゲットを指定
                .to({ y: moveToY }, 700, createjs.Ease.cubicIn) //initialPositionYの値が原点らしい（initialPositionY = 30 なら y:30 で静止）
                .call(drawPieceEnd);
        } else {
            callback();
        }

        function drawPieceEnd() {
            setTimeout(function () {
                callback();
            }, 60);
        }
    }

    //ボタン作成
    function createButton(text, width, height, keyColor, textSize, font) {
        // ボタン要素をグループ化
        let button = new createjs.Container();
        button.name = text; // ボタンに参考までに名称を入れておく(必須ではない)
        button.cursor = "pointer"; // ホバー時にカーソルを変更する
        // 通常時の座布団を作成
        let bgUp = new createjs.Shape();
        bgUp.graphics
            .setStrokeStyle(1.0)
            .beginStroke(keyColor)
            .beginFill("white")
            .drawRoundRect(0.5, 0.5, width - 1.0, height - 1.0, 4);
        button.addChild(bgUp);
        bgUp.visible = true; // 表示する
        // ロールオーバー時の座布団を作成
        let bgOver = new createjs.Shape();
        bgOver.graphics
            .beginFill(keyColor)
            .drawRoundRect(0, 0, width, height, 4);
        bgOver.visible = false; // 非表示にする
        button.addChild(bgOver);
        // ラベルを作成
        let label = new createjs.Text(text, textSize + "px " + font, keyColor);
        label.x = width / 2;
        label.y = height / 2;
        label.textAlign = "center";
        label.textBaseline = "middle";
        button.addChild(label);
        // ロールオーバーイベントを登録
        button.addEventListener("mouseover", handleMouseOver);
        button.addEventListener("mouseout", handleMouseOut);

        function handleMouseOver(event) {
            bgUp.visble = false;
            bgOver.visible = true;
            label.color = "white";
        }
        function handleMouseOut(event) {
            bgUp.visble = true;
            bgOver.visible = false;
            label.color = keyColor;
        }
        return button;
    }

    //盤面
    function drawGameStart(state) {
        Render.RECT_BOARD = RECT_BOARD;
        Render.CELL_SIZE = CELL_SIZE;

        let startBackground = new createjs.Bitmap("./image/UI/start_bg.jpg");
        startBackground.alpha = 0.5;

        let startBackground2 = new createjs.Shape();
        startBackground2.graphics.beginFill("#FAFAFA").drawRoundRect(0, 0, initialPositionX * 2.8, canvasSizeY * 0.8, 50, 5);
        startBackground2.x = (canvasSizeX - (initialPositionX * 2.8)) / 2;
        startBackground2.y = canvasSizeY * 0.1;
        startBackground2.alpha = 0.8;

        //文字オブジェクトを作成する
                        // let textTitle = new createjs.Text("重力四目並べ", "80px HG行書体", "#000");
                // let textTitle = new createjs.Text("", "80px HG行書体", "#000");
        let textTitle = new createjs.Bitmap("./image/UI/title.png");

        textTitle.x = 245;
        textTitle.y = 80;
        textTitle.scaleX = 0.7;
        textTitle.scaleY = textTitle.scaleX;

        //対局者画像の背景
        let infoBG_CPU = new createjs.Shape();
        infoBG_CPU.graphics.beginFill("#DDE6FF").drawRect(0, 0, initialPositionX * 0.6, (canvasSizeY / 2) / 2);
        infoBG_CPU.x = (canvasSizeX / 2) - (initialPositionX * 0.6 / 2);
        infoBG_CPU.y = canvasSizeY * 0.32;

        let flame_CPU = new createjs.Shape();
        flame_CPU.graphics.beginStroke("#585858").setStrokeStyle(3).drawRect(0, 0, initialPositionX * 0.6, (canvasSizeY / 2) / 2);
        flame_CPU.x = infoBG_CPU.x;
        flame_CPU.y = infoBG_CPU.y;

        //吹き出し
        let baloon = new createjs.Bitmap("./image/UI/startb_balloon.png");
        baloon.x = boardSize * 1.18;
        baloon.y = canvasSizeY * 0.40;
        baloon.scaleX = 0.465;
        baloon.scaleY = baloon.scaleX;

        let textDescription = new createjs.Text("プレイヤーの手番を選択して対戦開始", "18px arial", "#000");
        textDescription.x = 350;
        textDescription.y = 440;
        let btnStartFirst = createButton("先手", 200, 50, "#0275d8", 35, "arial");
        btnStartFirst.x = 280;
        btnStartFirst.y = 470;

        let btnStartSecond = createButton("後手", 200, 50, "#0275d8", 35, "arial");
        btnStartSecond.x = 530;
        btnStartSecond.y = 470;

        btnStartFirst.addEventListener("click", btnStartFirstHandleClick);
        btnStartSecond.addEventListener("click", btnStartSecondHandleClick);

        screen_bg.addChild(startBackground);
        screen_start.addChild(startBackground2, textTitle, btnStartFirst, btnStartSecond, infoBG_CPU, textDescription, flame_CPU, baloon);

        function btnStartFirstHandleClick(event) {
            // クリックされた時の処理を記述
            //リスナー削除
            btnStartFirst.removeEventListener("click", btnStartFirstHandleClick);
            btnStartSecond.removeEventListener("click", btnStartSecondHandleClick);
            state.turnPlayer = 1;
            state.turnCPU = -1;
            state.initTurn = 1;
            renderscreen_board(state);
            stage.addChild(screen_start);
            screen_start.removeChild(btnStartFirst, btnStartSecond);
            createjs.Tween.get(screen_start) // ターゲットを指定
                .to({ alpha: 0 }, 250)
                .call(Game.gameStartOnce)
                .call(removeBtn);
            Game.setEvents();

            function removeBtn() {
                stage.removeChild(screen_start);
            }

            return;
        }

        function btnStartSecondHandleClick(event) {
            // クリックされた時の処理を記述
            //リスナー削除
            btnStartFirst.removeEventListener("click", btnStartFirstHandleClick);
            btnStartSecond.removeEventListener("click", btnStartSecondHandleClick);
            state.turn = -1;
            state.turnPlayer = -1;
            state.turnCPU = 1;
            state.initTurn = -1;
            renderscreen_board(state);
            stage.addChild(screen_start);
            screen_start.removeChild(btnStartFirst, btnStartSecond);
            createjs.Tween.get(screen_start) // ターゲットを指定
                .to({ alpha: 0 }, 250)
                .call(Game.gameStartOnce)
                .call(removeBtn);
            Game.setEvents();

            function removeBtn() {
                stage.removeChild(screen_start);
            }

            return;
        }
    }

    function drawError(errorMsg) {
        let Background = new createjs.Shape();
        Background.graphics.beginFill("#000").drawRect(0, 0, canvasSizeX, canvasSizeY).endStroke();
        Background.alpha = 0.1;

        //文字オブジェクトを作成する
        let textTitle = new createjs.Text("Error!", "80px arial", "#000");
        textTitle.x = RECT_CANV.w * 0.8;
        textTitle.y = RECT_CANV.h * 0.5;
        document.getElementById('errorMsg').innerHTML = "<span style='color:#FF0000;'>" + errorMsg + "</span>"//エラーメッセージを表示
        screen_error.addChild(Background, textTitle);

        return;
    }

    function playerAndCPUInfo_drawTurn(turn, callback) {
        let w = {
            player: (initialPositionX - (initialPositionX * 0.6)) / 2,
            CPU: ((initialPositionX - (initialPositionX * 0.6)) / 2) + (initialPositionX * 3)
        }
        let h = {
            player: canvasSizeY / 2,
            CPU: canvasSizeY / 2
        }

        if (turn == 1) {
            var infoPlayer = new createjs.Shape();
            infoPlayer.graphics.beginStroke("#FE2E64").setStrokeStyle(3).drawRect(w.player, h.player * 0.5, initialPositionX * 0.6, h.player / 2);
            var infoCPU = new createjs.Shape();
            infoCPU.graphics.beginStroke("#FFCFDC").setStrokeStyle(3).drawRect(w.CPU, h.CPU * 0.5, initialPositionX * 0.6, h.CPU / 2).endStroke();

        } else {
            var infoPlayer = new createjs.Shape();
            infoPlayer.graphics.beginStroke("#FFCFDC").setStrokeStyle(3).drawRect(w.player, h.player * 0.5, initialPositionX * 0.6, h.player / 2);
            var infoCPU = new createjs.Shape();
            infoCPU.graphics.beginStroke("#FE2E64").setStrokeStyle(3).drawRect(w.CPU, h.CPU * 0.5, initialPositionX * 0.6, h.CPU / 2).endStroke();

            text_cpuAI.displayPlayerTurn = false;
            text_cpuAI.text = objCPUText.thinking;

        }
        screen_main.addChild(infoPlayer, infoCPU, text_cpuAI);

        callback();
    }

    //棋譜データに応じた盤面再現用駒作成関数、もしくは指定の座標に駒を作成するため
    function createPiece(turn, turnPlayer, selectedPiece, isShadow, isAnimation, x, y) {

        if (selectedPiecePlayer <= 1 && selectedPieceCPU <= 1) {
            if (turn == 1) {//プレイヤーの手番
                if (turnPlayer == 1) {//先手
                    var piece = Images.selectedPiece(0, turn, isAnimation, x, y);
                } else {//後手
                    var piece = Images.selectedPiece(1, turn, isAnimation, x, y);
                }
            } else {//CPUの手番
                if (turnPlayer == 1) {//先手
                    var piece = Images.selectedPiece(1, turn, isAnimation, x, y);
                } else {
                    var piece = Images.selectedPiece(0, turn, isAnimation, x, y);
                }
            }
        } else {
            var piece = Images.selectedPiece(selectedPiece, turn, isAnimation, x, y);
        }

        if (isShadow) {
            //影オブジェクトを作成
            let shadow = new createjs.Shadow("#003700", CELL_SIZE / 10 + 1, CELL_SIZE / 10 + 1, 13);
            //Displayオブジェクトに影を設定
            piece.shadow = shadow;
        }

        return piece;
    }

    function playerAndCPUInfo_main(state) {
        let w = {
            player: (initialPositionX - (initialPositionX * 0.6)) / 2,
            CPU: ((initialPositionX - (initialPositionX * 0.6)) / 2) + (initialPositionX * 3)
        }
        let h = {
            player: canvasSizeY / 2,
            CPU: canvasSizeY / 2
        }

        let mainBackGroundPlayer = new createjs.Shape();
        mainBackGroundPlayer.graphics.beginFill("#FAFAFA").drawRoundRect(0, 0, initialPositionX * 0.8, canvasSizeY * 0.43, 20, 5);
        mainBackGroundPlayer.x = initialPositionX * 0.1;
        mainBackGroundPlayer.y = -80 + canvasSizeY * 0.31;
        mainBackGroundPlayer.alpha = 0.8;

        let mainBackGroundCPU = new createjs.Shape();
        mainBackGroundCPU.graphics.beginFill("#FAFAFA").drawRoundRect(0, 0, initialPositionX * 0.8, canvasSizeY * 0.43, 20, 5);
        mainBackGroundCPU.x = initialPositionX * 3.1;
        mainBackGroundCPU.y = -80 + canvasSizeY * 0.31;
        mainBackGroundCPU.alpha = 0.8;

        //対局者画像の背景
        let infoBG_Player = new createjs.Shape();
        infoBG_Player.graphics.beginFill("#FFE4FF").drawRect(w.player, h.player * 0.5, initialPositionX * 0.6, h.player / 2);
        let infoBG_CPU = new createjs.Shape();
        infoBG_CPU.graphics.beginFill("#DDE6FF").drawRect(w.CPU, h.CPU * 0.5, initialPositionX * 0.6, h.CPU / 2);

        //文字オブジェクトを作成する
        let text1_player = new createjs.Text(playerName, "25px arial", "bold", "#2E2E2E");
        text1_player.x = w.player;
        text1_player.y = h.player * 0.39;
        let text1_CPU = new createjs.Text(CPUTextDataSet[9].name, "25px arial", "bold", "#2E2E2E");
        text1_CPU.x = w.CPU;
        text1_CPU.y = h.CPU * 0.39;

        //駒
        if (selectedPiecePlayer <= 1) {
            var piece_player = createPiece(state.turnPlayer, 1, selectedPiecePlayer, false, false, 0, 100);
            piece_player.x = w.player;
            piece_player.y = h.player * 0.85;
        } else {
            var piece_player = pieceOtherPlayer;
            piece_player.scaleX = CELL_SIZE / piece_player.image.width;
            piece_player.scaleY = CELL_SIZE / piece_player.image.height;
            piece_player.x = w.player;
            piece_player.y = h.player * 1.05;
        }

        if (selectedPieceCPU <= 1) {
            var piece_cpu = createPiece(state.turnCPU, 1, selectedPieceCPU, false, false, 0, 100);
            piece_cpu.x = w.CPU;
            piece_cpu.y = h.CPU * 0.85;
        } else {
            var piece_cpu = pieceOtherCPU;
            piece_cpu.scaleX = CELL_SIZE / piece_cpu.image.width;
            piece_cpu.scaleY = CELL_SIZE / piece_cpu.image.height;
            piece_cpu.x = w.CPU;
            piece_cpu.y = h.CPU * 1.05;
        }

        //対戦者のプロフィール画像
        image_player.x = w.player;
        image_player.y = h.player * 0.5;
        image_player.scaleX = (initialPositionX * 0.6) / image_player.image.width;
        image_player.scaleY = (initialPositionX * 0.6) / image_player.image.height;
        var image_cpu = start_image_cpu;
        image_cpu.x = w.CPU;
        image_cpu.y = h.CPU / 2;
        image_cpu.scaleX = (initialPositionX * 0.6) / image_cpu.image.width;
        image_cpu.scaleY = (initialPositionX * 0.6) / image_cpu.image.height;

        if (state.turn == 1) {//プレイヤーが先手ならば
            var text2_player = new createjs.Text("先手", "25px arial", "#2E2E2E");
            text2_player.x = w.player * 2;
            text2_player.y = h.player * 1.07;
            var text2_CPU = new createjs.Text("後手", "25px arial", "#2E2E2E");
            text2_CPU.x = w.CPU * 1.065;
            text2_CPU.y = h.CPU * 1.07;
        } else {
            var text2_player = new createjs.Text("後手", "25px arial", "#2E2E2E");
            text2_player.x = w.player * 2;
            text2_player.y = h.player * 1.07;
            var text2_CPU = new createjs.Text("先手", "25px arial", "#2E2E2E");
            text2_CPU.x = w.CPU * 1.065;
            text2_CPU.y = h.CPU * 1.07;
        }

        //CPUの吹き出し
        var baloon_cpu = new createjs.Bitmap("./image/UI/balloon.png");
        baloon_cpu.x = w.CPU * 0.95;
        baloon_cpu.y = h.CPU * 0.15;
        baloon_cpu.scaleX = 0.465;
        baloon_cpu.scaleY = baloon_cpu.scaleX;

        //1手戻るボタン
        var btnReturn = createButton("プレイヤーの手番を 1 戻す", 210, 32, "#0275d8", 16, "Arial");
        btnReturn.x = initialPositionX * 1.58;
        btnReturn.y = h.CPU * 1.565;
        btnReturn.addEventListener("click", btnGameReturn);
        //         var btnMove = createButton("1手進む", 120, 35, "#0275d8", 20, "Arial");
        //         btnMove.x = initialPositionX * 2 + initialPositionX / 4;
        //         btnMove.y = h.CPU * 1.55;

        screen_main.addChild(mainBackGroundPlayer, mainBackGroundCPU, infoBG_Player, infoBG_CPU, text1_player, text1_CPU, piece_player, piece_cpu, text2_player, text2_CPU, image_player, image_cpu, baloon_cpu);
        screen_main.addChild(btnReturn);
        return;
    }

    function playerAndCPUInfo_winner(state, winner) {
        var w = {
            player: (initialPositionX - (initialPositionX * 0.6)) / 2,
            CPU: ((initialPositionX - (initialPositionX * 0.6)) / 2) + (initialPositionX * 3)
        }
        var h = {
            player: canvasSizeY * 0.65,
            CPU: canvasSizeY * 0.65
        }

        if (winner == 1) {//勝者がプレイヤーならば
            drawWin = new createjs.Bitmap("./image/UI/win.png");
            drawWin.x = w.player;
            drawWin.y = h.player;
            drawWin.scaleX = 0.35;
            drawWin.scaleY = drawWin.scaleX;
            drawLose = new createjs.Bitmap("./image/UI/lose.png");
            drawLose.x = w.CPU;
            drawLose.y = h.CPU;
            drawLose.scaleX = 0.35;
            drawLose.scaleY = drawLose.scaleX;
            text_cpuAI.text = objCPUText.lose;
        } else {
            drawWin = new createjs.Bitmap("./image/UI/win.png");
            drawWin.x = w.CPU;
            drawWin.y = h.CPU;
            drawWin.scaleX = 0.35;
            drawWin.scaleY = drawWin.scaleX;
            drawLose = new createjs.Bitmap("./image/UI/lose.png");
            drawLose.x = w.player;
            drawLose.y = h.player;
            drawLose.scaleX = 0.35;
            drawLose.scaleY = drawLose.scaleX;
            text_cpuAI.text = objCPUText.win;
        }

        screen_main.addChild(drawWin, drawLose);

        return;
    }

    function drawFourInLine(line) {

        for (let i = 0; i < line.position.X.length; i++) {
            let x = line.position.X[i] * CELL_SIZE;
            let y = (12 - line.position.Y[i]) * CELL_SIZE;

            drawCellEffect[i] = new createjs.Shape();
            drawCellEffect[i].graphics.beginStroke("#FE2E64").setStrokeStyle(1).beginFill("#FFCFDC").drawRect(x, y - CELL_SIZE, CELL_SIZE, CELL_SIZE);
            drawCellEffect[i].alpha = 0.6;

            screen_fourInLine.addChild(drawCellEffect[i]);
        }

        return;
    }

    function btnGameReturn(event) {
        let kifuCount = Game.getState().gameRecord.length;
        if (gameFinished[0] || !Game.checkInvalidClickEvent() && kifuCount >= 2) {
            screen_main.removeChild(drawWin, drawLose);//win,loseの画像削除
            Render.playerAndCPUInfo_drawTurn(1, function () { });//手番をプレイヤーに設定
            for (let i = 0; i < drawCellEffect.length; i++) {//4つ並んだ駒を示すラインを削除
                screen_fourInLine.removeChild(drawCellEffect[i]);
            }

            if (gameFinished[0]) {//対局が終了している場合
                if (gameFinished[1] == -1) {//CPUが勝利している
                    screen_board.removeChild(piece[kifuCount], piece[kifuCount - 1]);
                    Game.gameReturn(2);
                } else {//プレイヤーの勝利
                    screen_board.removeChild(piece[kifuCount]);
                    Game.gameReturn(1);
                }
                gameFinished = [null, null];
            } else {//対局中
                screen_board.removeChild(piece[kifuCount], piece[kifuCount - 1]);
                Game.gameReturn(2);
            }
        }
    }

    function changeCPUImg() {
        screen_start.removeChild(start_image_cpu);
        start_image_cpu = Images.selectedImageCPU(9);
        start_image_cpu.x = (canvasSizeX / 2) - (initialPositionX * 0.6 / 2);
        start_image_cpu.y = (canvasSizeY * 0.32);

        let flame_CPU = new createjs.Shape();
        flame_CPU.graphics.beginStroke("#585858").setStrokeStyle(3).drawRect(0, 0, initialPositionX * 0.6, (canvasSizeY / 2) / 2);
        flame_CPU.x = start_image_cpu.x;
        flame_CPU.y = start_image_cpu.y;

        let id = setInterval(function () {
            //AIの処理終了フラグがtrueになった時
            if (start_image_cpu.image.width >= 1 && start_image_cpu.image.height >= 1) {
                clearInterval(id);
                start_image_cpu.scaleX = (initialPositionX * 0.6) / start_image_cpu.image.width;
                start_image_cpu.scaleY = (initialPositionX * 0.6) / start_image_cpu.image.height;
                objCPUText = CPUTextDataSet[9];
                text_startCPU.text = objCPUText.start;
                screen_start.addChild(start_image_cpu, text_startCPU, flame_CPU);
            }
        }, 10);
    }

})((this || 0).self || global);
