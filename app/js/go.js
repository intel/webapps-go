/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the 
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

function gamesound(src, loop) {
    var me = this;
    this.soundobj = new Audio(src);
    this.soundobj.preload = 'auto';
    this.enable = false;
    this.infocus = true;
    this.loop = (loop == undefined)?false:loop;
    this.focus = function focus() {
        if(!me.infocus)
        {
            me.infocus = true;
            if(me.enable&&me.loop)
                me.soundobj.play();
        }
    };
    this.blur = function blur() {
        if(me.infocus)
        {
            me.infocus = false;
            if(me.enable&&me.loop)
                me.soundobj.pause();
        }
    };
    window.addEventListener('focus', me.focus, false);
    window.addEventListener('blur', me.blur, false);

    this.play = function play() {
        this.enable = true;
        if(this.infocus)
            this.soundobj.play();
    };
    this.pause = function pause() {
        this.enable = false;
        this.soundobj.pause();
    };
}

var Go = {
    texture: {
        'black':'images/GO_BlackPiece_010612_a.png',
        'black1':'images/GO_BlackPiece_010612_b.png',
        'black2':'images/GO_BlackPiece_010612_c.png',
        'white':'images/GO_WhitePiece_010612_a-2.png',
        'white1': 'images/GO_WhitePiece_010612_b.png',
        'white2': 'images/GO_WhitePiece_010612_c.png',
        'uncheck':'images/GO_Checkbox_010612_a.png',
        'checked':'images/GO_CheckboxChecked_010612_a.png',
        'board':'images/Go_Board.png',
    },
    bounder: 13,
    boardview:'board',
    board:[],
    playButton:'play_button',
    winMessage:'win_panel',
    settingPanel:'setting_panel',
    helpPanel:'help_panel',
    place: [],
    directs: [[1,0],[0,1],[0,-1],[-1,0],],
    player:{},
    manual:[],
    isTimer: false,
    isSound: false,
    isSetting: false,
    isStart: false,
    isStop: false,
    isPass: false,
    isExit: false,
    isRestart: false,
    isEndMsg: false,
};

Go.init = function(){
    var welcome = {
        'black':[[1,3],[1,4],[2,2],[3,2],
                 [4,2],[5,2],[5,4],[5,5],
                 [6,2],[6,5],[7,2],[7,5],[8,3],
                 [8,4],],

        'white':[[1,8],[1,9],[2,7],[2,10],
                 [3,7],[3,10],[4,7],[4,10],
                 [5,7],[5,10],[6,7],[6,10],
                 [7,7],[7,10],[8,8],[8,9],],
    };
    for (var i=0; i<this.bounder; i++){
        var line=new Array();
        for (var j=0; j<this.bounder; j++){
            line[j] = 'board';
        }
        this.board[i] = line;
    }
    for (var color in welcome){
        var matrix = welcome[color];
        for (var p in matrix) {
            this.board[matrix[p][0]][matrix[p][1]] = color;
        }
    }
    this.drawBoard();
    this.soundSource = {
        'end': 'sounds/GameEndChimes.wav',
        'setStone': 'sounds/Pieces_SinglePlaced.wav',
        'dropStone': 'sounds/PiecesFillPocket.wav',
        'positive': 'sounds/PositiveSound.wav',
        'settingbtn': 'sounds/SettingsButton.wav',
        'settingck': 'sounds/SettingsButtonCheck.wav',
        'settingon': 'sounds/SettingsAppearWoodSlide.wav',
        'dida': 'sounds/ClockTicking_Loop.wav',
    };

    this.sounds = {};

    this.disable('.'+this.winMessage);
    this.enable('.'+this.playButton);

}

Go.start = function(){
    for (var i=0; i<this.bounder; i++){
        for (var j=0; j<this.bounder; j++){
            this.board[i][j] = 'board';
        }
    }
    this.player['black'] = new player('black');
    this.player['white'] = new player('white');
    this.current = this.player['white'];
    this.isStart = true;
    this.isStop = false;
    this.isPass = false;
    this.isSetting =false;
    this.isRestart = false;
    this.isExit = false;
    this.isEndMsg = true;
    this.drawBoard();
    this.drawMessage();
    this.disable('.'+this.playButton);
    this.disable('.'+this.winMessage);
    this.disable('.'+this.settingPanel);
    this.disable('.'+this.helpPanel);
    this.playSound('settingbtn');
    // this.startTimer();

    $('.setting_restart img').attr('src', this.texture['uncheck'])
        .removeClass('setting_restart_checked')
        .addClass('setting_restart_check');
}

Go.getSoundSource = function(snd) {
    var ret = this.sounds[snd];
    if (typeof ret == 'undefined') {
        var src = this.soundSource[snd];
        if (snd == 'dida') {
            ret = new gamesound(src);
        } else {
            ret = new Audio(src);
        }
        this.sounds[snd] = ret;
    }
    return ret;
}

Go.playSound = function(snd){
    if (this.isSound) {
        var audio = this.getSoundSource(snd);
        if (audio.paused == false) {
            audio.pause();
            audio.currentTime = 0;
        }
        audio.play();
    }
}

Go.stop = function(){
    this.isStart = false;
    this.isStop = true;
    this.stopTimer();
    var blackScore = this.player['black'].getScore();
    var whiteScore = this.player['white'].getScore();
    this.initWinMessage();
    if (blackScore > whiteScore){
        $('#win_player').html(' '+getMessage('one', 'One'));
        $('#win_result').html(getMessage('win', 'Wins'));
    } else if (blackScore < whiteScore) {
        $('#win_player').html(' '+getMessage('two', 'Two'));
        $('#win_result').html(getMessage('win', 'Wins'));
    } else {
        $('#win_player').html('');
        $('#win_result').html(getMessage('draw', 'Draw'));
    }
    if (this.isEndMsg) {
        this.playSound('end');
        this.enable('.'+this.winMessage);
        this.isEndMsg = false;
    }
}

Go.initWinMessage = function() {
    if (!this.hasWinMessage) {
        var winmsg = $('.'+this.winMessage);
        winmsg.html(
            '<a class="win_exit">X</a>'+
              '<div class="win_arrow" align="center">'+
                '<span style="font-size:55pt;">'+
                  '<span name="player"></span>'+
                  '<span id="win_player"></span>'+
                '</span>'+
                '<br>'+
                '<span id="win_result" style="font-size:70pt;"></span>'+
                '<img class="win_arrow_img" src="images/GO_WinArrow_012012_a.png" />'+
              '</div>'+
              '<a class="replay"></a>'
              )
            .on('click','a.win_exit',function() {
              Go.disable('.win_panel');
            })
            .on('click','a.replay',function() {
              Go.start();
            });
        $('.replay').html(getMessage('newGame', 'New Game'));
        $('span[name="player"]').html(getMessage('player', 'Player'));
        this.hasWinMessage = true;
    }

}

Go.exit = function(){
    if (this.isExit) {
        window.close();
    }
}

Go.restart = function(){
    if (this.isRestart){
        if (this.isEndMsg) {
            this.stop();
        } else {
            this.start();
        }
    }
}

Go.startTimer = function(){
    if (this.isTimer && this.isStart) {
        this.timer = setTimeout('Go.startTimer()',1000);
        this.current.timeDida();
        this.playSound('dida');
        if (this.current.restTime <= 0) {
            this.stop();
        } else if (this.current.restTime == 5) {
            this.playSound('positive');
        }
    }
}

Go.stopTimer = function(){
    if (this.isTimer) {
        clearTimeout(this.timer);
        // this.sounds['dida'].pause();
    }
}

Go.disable = function(which) {
    $(which).addClass('display_none');
}

Go.enable = function(which) {
    $(which).removeClass('display_none');
}

Go.toggleSetting = function(){
    if ($('.'+this.winMessage).hasClass('display_none')) {
        if (this.isSetting){
            this.exitSetting();
        } else {
            this.showSetting();
        }
        this.playSound('settingbtn');
    }
}

Go.initSettingPanel = function() {
    if (!this.hasSettingPanel) {
        var panel = $('.setting_panel');
        panel.html(
            '<a class="setting_help">?</a>'+
            '<a class="setting_exit">X</a>'+
            '<div id="licensebtnl" style="top: 490px; left: 405px;"> i </div>'+
            '<div class="setting_arrow" align="center">'+
              '<span></span>'+
              '<img class="setting_arrow_img" src="images/GO_SettingsArrow_010612_a.png" />'+
            '</div>'+
            '<div class="setting_sound">'+
              '<span></span>'+
              '<a><img class="setting_sound_check" src="images/GO_Checkbox_010612_a.png" /></a>'+
            '</div>'+
            '<div class="setting_timer">'+
              '<span></span>'+
              '<a><img class="setting_timer_check" src="images/GO_Checkbox_010612_a.png" /></a>'+
            '</div>'+
            '<div class="setting_restart">'+
              '<span></span>'+
              '<a><img class="setting_restart_check" src="images/GO_Checkbox_010612_a.png" /></a>'+
            '</div>'+
            '<div class="setting_quit">'+
              '<span class="setting_quit_text"></span>'+
              '<a><img class="setting_quit_check" src="images/GO_Checkbox_010612_a.png" /></a>'+
            '</div>'+
            '<a class="setting_resume setting_resume_inactive" align="center"></a>')
        .on('click','a.setting_exit',function() { Go.toggleSetting(); })
        .on('click','a.setting_help',function() { Go.toggleHelp(); })
        .on('click','a.setting_resume',function() { Go.toggleSetting(); })
        .on('click','div.setting_quit',function() { Go.toggleQuit(); })
        .on('click','div.setting_restart a',function() { Go.toggleRestart(); })
        .on('click','div.setting_sound a',function() { Go.toggleSound(); })
        .on('click','div.setting_timer a',function() { Go.toggleTimer(); });

        $('.setting_arrow span').html(getMessage('settings', 'Settings'));
        $('.setting_sound span').html(getMessage('sound_setting', 'Sound FX....'));
        $('.setting_timer span').html(getMessage('timer_setting', 'Timer...........'));
        $('.setting_restart span').html(getMessage('restart', 'Restart'));
        $('.setting_quit span').html(getMessage('quit', 'Quit'));
        $('.setting_resume').html(getMessage('resume', 'Submit'));
        $('#licensebtnl').click(function(){ Go.showLicense("license", "theworld"); });

        this.hasSettingPanel = true;
    }
}

Go.showSetting = function(){
    this.initSettingPanel();
    this.enable('.setting_panel');
    setTimeout("$('.setting_panel').addClass('setting_panel_in')", 100);
    this.isSetting = true;
    this.stopTimer();
    this.playSound('settingon');
}

Go.exitSetting = function(){
    this.disable('.setting_panel');
    $('.'+this.helpPanel).addClass('display_none');
    $('.setting_panel').removeClass('setting_panel_in');
    this.isSetting = false;
    this.exit();
    this.restart();
    this.startTimer();
}

Go.toggleSound = function(){
    var img = $('.setting_sound img');
    if (this.isSound) {
        img.attr('src', this.texture['uncheck']);
        img.removeClass('setting_sound_checked');
        img.addClass('setting_sound_check');
        this.isSound = false;
    } else {
        img.attr('src', this.texture['checked']);
        img.addClass('setting_sound_checked');
        img.removeClass('setting_sound_check');
        this.isSound = true;
    }
    this.playSound('settingck');
}

Go.toggleTimer = function(){
    var img = $('.setting_timer img');
    if (this.isTimer) {
        img.attr('src', this.texture['uncheck']);
        img.removeClass('setting_timer_checked');
        img.addClass('setting_timer_check');
        this.isTimer = false;
    } else {
        img.attr('src', this.texture['checked']);
        img.addClass('setting_timer_checked');
        img.removeClass('setting_timer_check');
        this.isTimer = true;
    }
    this.playSound('settingck');
}

Go.toggleRestart = function(){
    if (this.isStart || this.isStop) {
        var conflict = false;
        var img = $('.setting_restart img');
        if (this.isRestart) {
            img.attr('src', this.texture['uncheck']);
            img.removeClass('setting_restart_checked');
            img.addClass('setting_restart_check');
            this.isRestart = false;
        } else {
            img.attr('src', this.texture['checked']);
            img.addClass('setting_restart_checked');
            img.removeClass('setting_restart_check');
            this.isRestart = true;
            if (this.isExit)
                conflict = true;
        }
        if (conflict) {
            this.toggleQuit();
        } else {
            this.playSound('settingck');
        }
    }
}

Go.toggleQuit = function(){
    var img = $('.setting_quit img');
    var conflict = false;
    if (this.isExit) {
        img.attr('src', this.texture['uncheck']);
        img.removeClass('setting_quit_checked');
        img.addClass('setting_quit_check');
        this.isExit = false;
    } else {
        img.attr('src', this.texture['checked']);
        img.addClass('setting_quit_checked');
        img.removeClass('setting_quit_check');
        this.isExit = true;
        if (this.isRestart)
            conflict = true;
    }
    if (conflict) {
        this.toggleRestart();
    } else {
        this.playSound('settingck');
    }
}

Go.toggleHelp = function() {
    var help = $('.'+this.helpPanel);
    if (!this.hasHelp) {
        help.html(
            '<a class="help_exit text_shadow">X</a>'+
            '<div class="help_title text_shadow"></div>'+
            '<div class="help_text">&nbsp;&nbsp;&nbsp;&nbsp;Take turns placing a stone on a vacant intersections (points) of the grid on a Go board. Black moves first. Once placed, a stone may not be moved, and can be removed only if captured. If a player believes he has no useful moves, he may skip his move (pass).<br> &nbsp;&nbsp;&nbsp;&nbsp;Vertically and horizontally adjacent stones of the same color form a chain (also called a string, or group) that shares liberties (adjacent, empty spaces) in common. These chains cannot be divided, and in effect becomes a single larger stone. Chains may be expanded by placing additional stones on adjacent points, and can be connected by placing a stone on a points adjacent to two or more chains of the same color.<br> &nbsp;&nbsp;&nbsp;&nbsp;A chain of stones must have at least one liberty to remain on the board. When a chain is surrounded by opposing stones so that it has no liberties, it is captured and removed from the board.<br> &nbsp;&nbsp;&nbsp;&nbsp;The game ends when both players have passed (clicked Skip) consecutively. The player who scores more points (the number of empty points, or intersections, surrounded by their pieces, plus the number of stones they'+"'" + 've captured) wins.<br> &nbsp;&nbsp;&nbsp;&nbsp;For more information on how to play Go, see the Wikipedia article on the game: <span><a style="opacity: 0.6; color: #0000FF" href="http://en.wikipedia.org/wiki/Go_(game)">http://en.wikipedia.org/wiki/Go_(game)</a></span>. </div>')
          .on('click','a.help_exit',function() { Go.toggleHelp(); });
        $('.help_title').html(getMessage('rules', 'Rules'));
        var help_text = getMessage('help');
        if (help_text.length > 0) {
            $('.help_text').html(help_text);
        }
        this.hasHelp = true;
    }
    if (help.hasClass('display_none')) {
        help.removeClass('display_none');
    } else {
        help.addClass('display_none');
    }
    //$('.'+this.helpPanel).toggleClass('display_none');
}

Go.drawBoard = function(){
    var $boardview = $('.'+this.boardview);
    var str = '';
    var style=['margin:1px 0px 9px 0px;','margin:0px 10px 9px 0px;','margin:0px 9px 10px 0px;'];
    var makeClickHandler = function(i,j) {
      return function() {
        Go.click(i,j);
      };
    };

    for (var i=0; i<this.bounder; i++){
        var margin=style[2];
        if (i<6) margin = style[0];
        str += '<div style="width:595px;height:36px;'+margin+'">';
        for (var j=0; j<this.bounder; j++){
            margin = style[2];
            if (j<6) margin = style[1];
            if (i>8) margin += 'position:relative;top:-5px;';
            str += '<span style="float:left;width:36px;height:36px;'+margin
                +'"><a class="img_style" ><img src="'
                +this.texture[this.board[i][j]]+'" id="a'+i+j+'" class="board_img" /></a></span>';
            $boardview.on('click','#a'+i+j,makeClickHandler(i,j));
        }
        str += '</div>';
    }
    $boardview.html(str);
}

Go.click = function(i, j){
    if (this.board[i][j]==='board' && !this.isSetting && this.isStart) {
        var revColor = (this.current.color=='black'?'white':'black');
        var p = this.player[revColor];

        this.board[i][j] = this.current.color;
        var takes = this.getTake([i, j]);
        if (takes.length == 1 && p.takes.length == 1
            && p.takes[0][0] == i && p.takes[0][1] == j
            && takes[0][0] == p.place[0] && takes[0][1] == p.place[1]) {
            //Can't do mirror go
            this.board[i][j] = 'board';
            return;
        }
        for (var n in takes) {
            this.board[takes[n][0]][takes[n][1]] = 'board';
            p.dropStone();
            p.score--;
        }
        if (takes.length == 0 && this.isContained(i, j, this.current.color)) {
            this.board[i][j] = 'board';
        } else {
            var status = {'color':this.current.color,};
            this.playSound('setStone');
            if (takes.length > 0)
                this.playSound('dropStone');
            status.setPlace = [i, j];
            status.place = this.place;
            this.place = [i, j];
            this.current.score++;
            status.userPlace = this.current.place;
            this.current.place = this.place;
            this.current.takes = takes;
            status.takes = takes;
            this.current.pickStone();
            status.isPass = this.isPass;
            this.isPass = false;

            // Get Liberty
            var liberty = this.getLiberty();
            status.liberty = {};
            status.liberty['black'] = this.player['black'].liberty;
            status.liberty['white'] = this.player['white'].liberty;
            this.player['black'].liberty = liberty['black'];
            this.player['white'].liberty = liberty['white'];

            status.restTime = {};
            status.restTime['black'] = this.player['black'].restTime;
            status.restTime['white'] = this.player['white'].restTime;
            this.manual.push(status);
            this.drawBoard();
            this.drawMessage();
        }
    }
}

Go.undue = function(color_) {
    if (!this.isSetting && this.isStart && color_ != this.current.color) {
        var status = this.manual.pop();
        if (status) {
            var color = status.color;
            var revColor = (color == 'black'?'white':'black');
            var player = this.player[color];
            if (status.setPlace.length > 0) {
                this.place = status.place;
                player.dropStone();
                player.score--;
                this.board[status.setPlace[0]][status.setPlace[1]] = 'board';
                for (var p in status.takes) {
                    var take = status.takes[p];
                    this.player[revColor].pickStone();
                    this.board[take[0]][take[1]] = revColor;
                    this.player[revColor].score++;
                }
                if (status.liberty) {
                    var liberty = status.liberty;
                    this.player['black'].liberty = liberty['black'];
                    this.player['white'].liberty = liberty['white'];
                } else {
                    this.player['black'].liberty = [];
                    this.player['white'].liberty = [];
                }
                player.place = status.userPlace;
                this.drawBoard();
            }
            this.isPass = status.isPass;
            // Reset the timer
            // this.player['black'].restTime = status.restTime['black'];
            // this.player['white'].restTime = status.restTime['white'];
            this.drawMessage();
        }
    }
}

Go.getTake = function(place_) {
    var p = place_ || this.place;
    var checkColor = (this.current.color=='black'?'white':'black');
    var takes = [];
    for (var d in this.directs) {
        var i = parseInt(p[0])+parseInt(this.directs[d][0]);
        var j = parseInt(p[1])+parseInt(this.directs[d][1]);
        if (i>=0 && j>= 0 && i<this.bounder && j<this.bounder
            && this.board[i][j] === checkColor) {
            var t = [];
            if (this.isContained(i, j, checkColor, t)) {
                for (var n in t){
                    if (!this.isContain(t[n], takes)) {
                        takes.push(t[n]);
                    }
                }
            }
        }
    }
    //console.log(takes);
    return takes;
}

Go.isContained = function(i_, j_, color_, contains_, except_) {
    var color = color_ || (this.current.color == 'black'?'white':'black');
    var except = except_ || []; 
    var contains = contains_ || [];
    var ret = true;
    except.push([parseInt(i_),parseInt(j_)]);

    for (var d in this.directs) {
        if (!ret)
            break;
        var i = parseInt(i_)+parseInt(this.directs[d][0]);
        var j = parseInt(j_)+parseInt(this.directs[d][1]);
        if ( i>=0 && j>= 0 && i<this.bounder && j<this.bounder
            && !this.isContain([i,j], except)) {
            if (this.board[i][j] == 'board') {
                ret = false;
            } else if (this.board[i][j] == color) {
                if (!this.isContained(i, j, color, contains, except)) {
                    ret = false;
                }
            }
        }
    }
    if (ret)
        contains.push([i_, j_]);
    return ret;
}

Go.getLiberty = function(){
    var except = [];
    var contain = {
        'black':[],
        'white':[],
    };
    for (var i=0; i<this.bounder; i++){
        for (var j=0; j<this.bounder; j++){
            if (this.board[i][j] == 'board' && !this.isContain([i,j], except)) {
                var except_ = [];
                var liberty = this.countLiberty(i,j,except_);
                if (!liberty.hasOwnProperty('none')) {
                    var color = 'none';
                    if (liberty.hasOwnProperty('black')) {
                        color = 'black';
                    } else if (liberty.hasOwnProperty('white')) {
                        color = 'white';
                    }
                    if (color != 'none') {
                        var needpush = liberty[color];
                        for (var n in needpush){
                            if (!this.isContain(needpush[n], contain[color])) {
                                contain[color].push(needpush[n]);
                            }
                        }
                    }
                }
                for (var n in except_) {
                    if (!this.isContain(except_[n], except)) {
                        except.push(except_[n]);
                    }
                }
            }
        }
    }

    return contain;
}

Go.countLiberty = function(i_,j_,except){
    var ret = {};
    except.push([i_,j_]);
    for (var d in this.directs) {
        if (ret.hasOwnProperty('none'))
            break;
        var i = parseInt(i_)+parseInt(this.directs[d][0]);
        var j = parseInt(j_)+parseInt(this.directs[d][1]);
        if (i>=0 && j>= 0 && i<this.bounder && j<this.bounder && !this.isContain([i,j], except)) {
            if (this.board[i][j] == 'board') {
                var liberty = this.countLiberty(i,j,except);
                if (liberty.hasOwnProperty('none')) {
                    ret['none'] = [];
                    break;
                } else if (liberty.hasOwnProperty('black')){
                    if (ret.hasOwnProperty('white')) {
                        ret['none'] = [];
                        break;
                    } else {
                        if (!ret.hasOwnProperty('black'))
                            ret['black'] = [];
                        for (var n in liberty['black']){
                            if (!this.isContain(liberty['black'][n], ret['black'])) {
                                ret['black'].push(liberty['black'][n]);
                            }
                        }
                    }
                } else if (liberty.hasOwnProperty('white')) {
                    if (ret.hasOwnProperty('black')) {
                        ret['none'] = [];
                        break;
                    } else {
                        if (!ret.hasOwnProperty('white'))
                            ret['white'] = [];
                        for (var n in liberty['white']){
                            if (!this.isContain(liberty['white'][n], ret['white'])) {
                                ret['white'].push(liberty['white'][n]);
                            }
                        }
                    }
                } else if (liberty.hasOwnProperty('neutral')) {
                    if (!ret.hasOwnProperty('neutral'))
                        ret['neutral'] = [];
                    for (var n in liberty['neutral']){
                        if (!this.isContain(liberty['neutral'][n], ret['neutral'])) {
                            ret['neutral'].push(liberty['neutral'][n]);
                        }
                    }
                }
            } else if (this.board[i][j] == 'black') {
                if (ret.hasOwnProperty('white')) {
                    ret['none'] = [];
                    break;
                } else if (!ret.hasOwnProperty('black')) {
                    ret['black'] = [];
                }
            } else if (this.board[i][j] == 'white') {
                if (ret.hasOwnProperty('black')) {
                    ret['none'] = [];
                    break;
                } else if (!ret.hasOwnProperty('white')) {
                    ret['white'] = [];
                }
            }
        }
    }
    if (!ret.hasOwnProperty('none')) {
        if (ret.hasOwnProperty('black')) {
            if (!this.isContain([i_,j_], ret['black']))
                ret['black'].push([i_,j_]);
            if (ret.hasOwnProperty('neutral')){
                for (var p = ret['neutral'].shift(); typeof p != 'undefined'; p = ret['neutral'].shift()) {
                    if (!this.isContain(p, ret['black'])) {
                        ret['black'].push(p);
                    }
                }
            }
        } else if (ret.hasOwnProperty('white')) {
            if (!this.isContain([i_,j_], ret['white'])) 
                ret['white'].push([i_,j_]);
            if (ret.hasOwnProperty('neutral')){
                for (var p = ret['neutral'].shift(); typeof p != 'undefined'; p = ret['neutral'].shift()) {
                    if (!this.isContain(p, ret['white'])) {
                        ret['white'].push(p);
                    }
                }
            }
        } else {
            if (!ret.hasOwnProperty('neutral'))
                ret['neutral'] = [];
            if (!this.isContain([i_,j_], ret['neutral']))
                ret['neutral'].push([i_,j_]);
        }
    }
    return ret;
}

Go.isContain = function(place, _array) {
    var heat = _array || [];
    for (var i in heat){
        if (heat[i][0] == place[0] && heat[i][1] == place[1]) {
            return true;
        }
    }
    return false;
}

Go.drawMessage = function(){
    this.current.stop();
    this.current = this.player[(this.current.color=='black'?'white':'black')];
    this.current.start();
}

Go.skip = function(color_){
    var color = color_ || this.current.color;
    if (this.current.color == color && !this.isSetting && this.isStart) {
        this.playSound('settingbtn');
        if (this.isPass) {
            this.stop();
        } else {
            var status = {'color': this.current.color,
                          'setPlace': [],
                          'isPass': false,};
            status.restTime = {};
            status.restTime['black'] = this.player['black'].restTime;
            status.restTime['white'] = this.player['white'].restTime;
            this.manual.push(status);
            this.drawMessage();
            this.isPass = true;
        }
    }
}

function player(color_) {
    this.color = color_;
    var side = (color_ == 'black'?'left':'right');
    this.restTime = 20*60;
    this.score = 0;
    this.place = [-1,-1];
    this.stoneNum = Math.floor(Go.bounder*Go.bounder);
    this.takes = [];
    this.liberty = [];
    this.resource = {
        'pit':side+'_pit',
        'arrow':side+'_arrow',
        'timer':side+'_timer',
        'score':side+'_score',
        'stone':Go.texture[this.color],
        'stone1':Go.texture[this.color+'1'],
        'stone2':Go.texture[this.color+'2'],
    };

    var str = '';
    $('.'+this.resource['pit']).html(str);
    for (var i=0; i<this.stoneNum; i++){
        var x = Math.floor(Math.random()*76)+20;
        var y = Math.floor(Math.random()*296)+20;
        var ext = Math.floor(Math.random()*16);
        if (ext != 1 && ext != 2) ext = '';
        str += '<img class="stone_in_pit" id="'+this.color+'stone'+i+'" style="top:'+y+'px;left:'+x+'px;" src="'+this.resource['stone'+ext]+'" />';
    }
    $('.'+this.resource['pit']).html(str);

    $('.'+this.resource['timer']+' span').html('20:00');

    this.currentStone = this.stoneNum-1;

    this.dropStone = function() {
        var x = Math.floor(Math.random()*76)+20;
        var y = Math.floor(Math.random()*296)+20;
        // var id = Math.floor(Math.random()*this.stoneNum);
        var id = this.currentStone++;
        var ext = Math.floor(Math.random()*16);
        if (ext != 1 && ext != 2) ext = '';
        $('#'+this.color+'stone'+id).attr('style', 'top:'+y+'px;left:'+x+'px;').attr('src', this.resource['stone'+ext]).removeClass('display_none');
    }

    this.pickStone = function(){
        // var id = Math.floor(Math.random()*this.stoneNum);
        var id = this.currentStone--;
        $('#'+this.color+'stone'+id).addClass('display_none');
    }

    this.start = function(){
        $('.'+this.resource['arrow']+' img').attr('src', this.texture['hi_arrow']);
        this.updateScore();
        this.updateTimer();
        Go.startTimer();
        //this.pickStone();
    }

    this.stop = function(){
        $('.'+this.resource['arrow']+' img').attr('src', this.texture['arrow']);
        this.updateScore();
        Go.stopTimer();
        this.updateTimer();
    }

    this.timeDida = function(){
        this.restTime--;
        this.updateTimer();
    }

    this.updateTimer = function() {
        if (this.restTime >= 0){
            var s = this.restTime%60;
            var m = Math.floor(this.restTime/60);
            var s1 = s%10;
            var s2 = Math.floor(s/10);
            var m1 = m%10;
            var m2 = Math.floor(m/10);
            var t = ''+m2+m1+':'+s2+s1;
            //console.log(this.color+'['+t+']');
            $('.'+this.resource['timer']+' span').html(t);
        }
    }

    this.getScore = function() {
        return (this.score+this.liberty.length);
    }

    this.updateScore = function(){
        var str = '';
        var s = this.getScore();
        for (var i=0; i<4; i++){
            str = s%10 + str;
            s = Math.floor(s/10);
        }
        $('#'+this.resource['score']).html(str);
    }
}

player.prototype.texture = {
    'arrow':'images/GO_PlayerArrow_010612_a.png',
    'hi_arrow':'images/GO_PlayerArrow_012012_b.png',
}

Go.showLicense = function(id, hpageid) {
    var lbtn = document.getElementById(id+"btnl");

    var lpage = document.getElementById(id+"page");
    var hpage = document.getElementById(hpageid);
    var ltext = document.getElementById(id+"text");
    var lscroll = document.getElementById(id+"scroll");
    var timer;

    var btnq = document.getElementById(id+"btnq");
    /* initialize scroll rate */
    var dY = 2;
    var t0 = 0;
    var delay = 1000;

    /* set the scroller to the top position */
    lscroll.style.top = "0px";

    /* display the license page, hide its parent */
    hpage.style.display="none";
    lpage.style.display="block";

    /* calculate the scroll length when the window is shown */
    var maxY = lscroll.clientHeight - ltext.clientHeight;

    /* start the autoscroll interval */
    timer = setInterval(function() {
        /* get the actual interval, in case performance slows us down */
        var t1 = (new Date()).getTime();
        var dT = (t0 == 0)?20:(t1-t0);
        t0 = t1;

        /* delay specific number of milliseconds */
        delay -= dT;
        if(delay > 0)
            return;

        /* calculate the new top position using dY and dT */
        var newY = Math.abs(parseInt(lscroll.style.top)) + ((dT/40)*dY);
        if(newY > 0)
            lscroll.style.top = (-1 * newY) + "px";
        else
            lscroll.style.top = "0px";

        /* if the lscroll has hit the limit, delay and swing */
        /* the other way */
        if(newY >= maxY)
        {
            delay = 5000;
            dY = -20;
        }
        else if(newY <= 0)
        {
            delay = 5000;
            dY = 2;
        }
    }, 40);

    $(btnq).on('click', function() {
        hpage.style.display="block";
        lpage.style.display="none";
        clearInterval(timer);
    });
}

var messages;

function getMessage(key, alter) {
    var ret = alter || '';
    if (locale && locale == 'en' && ret.length>0) {
        return ret;
    }
    if (window.chrome && window.chrome.i18n && window.chrome.i18n.getMessage) {
        ret = chrome.i18n.getMessage(key);
    } else {
        if (typeof messages == 'undefined') {
            try {
                var request = new XMLHttpRequest();
                request.open("GET", "_locales/en/messages.json", false);
                request.send();
                var res = request.responseText;
                messages = window.eval(res);
            } catch (err) {
                return ret;
            }
        }
        if (messages && (messages.hasOwnProperty(key)) && (messages[key].hasOwnProperty('message'))) {
            ret = messages[key].message;
        }
    }
    return ret;
}

var locale;

function registerEventHandlers() {
  $("body")
    .on("selectstart",function() {
      return false;
    })
    .on("dragstart",function() {
      return false;
    })
    /* a.setting_icon */
    .on("click","a.setting_icon",function() {
       Go.toggleSetting();
    })
    .on("click","a.undue_icon_left",function() {
       Go.undue('black');
    })
    .on("click","a.undue_icon_right",function() {
       Go.undue('white');
    })
    .on("click","a.play_button",function() {
       Go.start();
    })

    ;
};

window.onload = function(){
    locale = getMessage('locale', 'en');
    if (locale != 'en') {
        var head  = $('head').q;
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = 'css/i18n.css';
        head.appendChild(link);
    }

    $('title').html(getMessage('name', 'Go'));
    $('#playerone').html(getMessage('player', 'Player')+' '+getMessage('one', 'One'));
    $('#playertwo').html(getMessage('player', 'Player')+' '+getMessage('two', 'Two'));
    $('.left_arrow span[name="score"]').html(getMessage('score', 'Score'));
    $('.right_arrow span[name="score"]').html(getMessage('score', 'Score'));
    $('.left_skip').html(getMessage('skip', 'Skip'));
    $('.right_skip').html(getMessage('skip', 'Skip'));
    $('.play_button_text').html(getMessage('play', 'Play'));

    //Pass game, continue pass cause the end
    $('.left_skip').click(function(){
        Go.skip('black');
    });

    $('.right_skip').click(function(){
        Go.skip('white');
    });

    Go.init();

    registerEventHandlers();

    scaleBody(document.getElementsByTagName("body")[0], 720);
};


