// ステージオブジェクト作成
var stage = new createjs.Stage('Canvas');
stage.enableMouseOver();
var screen_board = new createjs.Container();//盤面上の全てを描画する
// 座標
screen_board.x = initialPositionX;
screen_board.y = initialPositionY;
var screen_start = new createjs.Container();//スタート画面
var screen_main = new createjs.Container();//対局中の対戦者情報画面
screen_main.y = 80;
var screen_error = new createjs.Container();//エラー画面
var screen_fourInLine = new createjs.Container();//対局が終了した際、4つ並んだ駒を強調するエフェクト
screen_fourInLine.x = initialPositionX;
screen_fourInLine.y = initialPositionY;
var screen_bg = new createjs.Container();//背景

//文字オブジェクト
var text_cpuAI = new createjs.Text("", "20px arial", "#000");
text_cpuAI.x = (((initialPositionX - (initialPositionX * 0.6)) / 2) + (initialPositionX * 3)) * 0.97;
text_cpuAI.y = canvasSizeY * 0.1;
text_cpuAI.displayPlayerTurn = false;
//スタート画面対戦相手コメント
var text_startCPU = new createjs.Text("", "20px arial", "#000");
text_startCPU.x = canvasSizeX * 0.61;
text_startCPU.y = canvasSizeY * 0.425;
var objCPUText = {//CPUテキストデータセットを格納するための変数
    start: "",
};
var selectedImagePlayer = 0;//プレイヤーのプロフィール画像
var selectedImageCPU = 0;//CPUのプロフィール画像

var image_player = Images.selectedImagePlayer(selectedImagePlayer);
var start_image_cpu;

var selectedPiecePlayer = 3;//プレイヤーの駒
var selectedPieceCPU = 4;//CPUの駒
if (selectedPiecePlayer >= 2) {
    var pieceOtherPlayer = Images.selectedPieceOther(selectedPiecePlayer);
}
if (selectedPieceCPU >= 2) {
    var pieceOtherCPU = Images.selectedPieceOther(selectedPieceCPU);
}

stage.addChild(screen_bg, screen_main, screen_board, screen_start, screen_error, screen_fourInLine);
// ステージを更新する

createjs.Ticker.addEventListener("tick", stage);
createjs.Ticker.setFPS(30);

var text = "";

Game.initGame(stage);

var cnt = 0;
