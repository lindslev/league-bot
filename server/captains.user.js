// ==UserScript==
// @name           tagpro-leaguestats
// @version        1.0
// @description    catstats for use with Gem's stats site: www.mltp.info
// @author         ballparts
// @include        http://tagpro-*.koalabeast.com*
// @include        http://tangent.jukejuice.com*
// @include        http://maptest*.newcompte.fr*
// @grant          GM_setValue
// @grant          GM_getValue
// @require        https://raw.githubusercontent.com/ballparts/TagProReplays/master/jquery.js
// @require        https://gist.githubusercontent.com/ballparts/6a4e635e83ba94f0077b/raw/ac84a0d5c172de5dd3285e3daefb93f24785dac9/ClassyWiggle.min.js
// @require        https://gist.githubusercontent.com/ballparts/6bb586a6ff3168607848/raw/eddfac3bf68b74f99a33b2feebc7a77a45149494/jquery.blockUI.js
// ==/UserScript==

(function(window, document, undefined) {

    //--------------------------------------//
    // THESE VALUES MIGHT NEED TO BE EDITED //
    //--------------------------------------//

    // Links to post data for 1) score updates, and 2) final stats
    UPDATEURL = 'http://serene-headland-9709.herokuapp.com/api/game/scorekeeper'
    FINALURL  = 'http://serene-headland-9709.herokuapp.com/api/teams/game/stats'

    // User ID for identification purposes
    KEY = "22def";

    //------------------------//
    // END OF EDITABLE VALUES //
    //------------------------//





    //-----------------------------------------------------------------------------//
    // IF WE ARE ON THE GROUP PAGE, CREATE A CHECK BOX TO TURN ON STATS COLLECTION //
    //-----------------------------------------------------------------------------//

    if( document.URL.search(/groups\/[a-zA-Z]{8}/) > 0 ) {

        //------------------//
        //  SET UP DIALOGS  //
        //------------------//

        // spectator dialog div
        var specInputDiv = document.createElement('div');
        specInputDiv.id = 'specInput';
        specInputDiv.style.cursor = "default";
        specInputDiv.style.backgroundColor = '#E4E4E4';
        document.body.appendChild(specInputDiv);
        specInputDiv.hidden = true;

        // spectator title and buttons

        var specTitle1 = document.createElement('h2');
        specTitle1.id = 'specTitle1';
        specTitle1.style.marginBottom = '10px';
        specTitle1.textContent = 'It looks like you\'re spectating!';

        var specTitle2 = document.createElement('txt');
        specTitle2.id = 'specTitle2';
        specTitle2.textContent = 'Which team is yours?';

        var specRedButton = document.createElement('input');
        specRedButton.id = 'specRedButton';
        specRedButton.type = 'button';
        specRedButton.value = 'Red Team';
        specRedButton.style.marginTop = '20px';
        specRedButton.style.marginRight = '10px';
        specRedButton.style.marginBottom = '10px';
        specRedButton.onclick = function() {
            GM_setValue("specTeam", 'r');
            $.unblockUI()
        }

        var specBlueButton = document.createElement('input');
        specBlueButton.id = 'specBlueButton';
        specBlueButton.type = 'button';
        specBlueButton.value = 'Blue Team';
        specBlueButton.onclick = function() {
            GM_setValue("specTeam", 'b');
            $.unblockUI()
        }

        // build up spectator div
        var y = $('#specInput')
        y.append(specTitle1)
        y.append('<p>', specTitle2)
        y.append('<p>', specRedButton, specBlueButton)

        // set up main dialog div
        var statsInputDiv = document.createElement('div');
        statsInputDiv.id = 'statsInput';
        statsInputDiv.style.cursor = "default";
        statsInputDiv.style.backgroundColor = '#E4E4E4';
        document.body.appendChild(statsInputDiv);
        statsInputDiv.hidden = true;

        // set up titles and stuff
        var sID_t1 = document.createElement('h2');
        sID_t1.id = 'sID_t1';
        sID_t1.textContent = 'Input Game and Half Info';

        var sID_st1 = document.createElement('txt');
        sID_st1.id = 'sID_st1';
        sID_st1.textContent = 'Game:  ';

        var sID_game = document.createElement('input');
        sID_game.id = 'sID_game';
        sID_game.style.marginTop = '20px';
        sID_game.style.marginRight = '10px';
        sID_game.style.width = '20px'

        var sID_st2 = document.createElement('txt');
        sID_st2.id = 'sID_st2';
        sID_st2.textContent = 'Half:  ';

        var sID_half = document.createElement('input');
        sID_half.id = 'sID_half';
        sID_half.style.marginTop = '10px';
        sID_half.style.width = '20px'

        var sID_t2 = document.createElement('h2');
        sID_t2.id = 'sID_t2';
        sID_t2.textContent = 'If you are returning from a TIME OUT, input score information here. Otherwise, leave this area alone.';
        sID_t2.style.fontSize = '14px';
        sID_t2.style.marginTop = '60px';

        var sID_st3 = document.createElement('txt'); // this is no longer used
        sID_st3.id = 'sID_st3';
        sID_st3.textContent = 'Reminder: You CANNOT use the score-setting feature in group when sending stats to the server!';
        sID_st3.style.fontSize = '12px';
        sID_st3.style.color = 'red';

        var sID_st4 = document.createElement('txt');
        sID_st4.id = 'sID_st4';
        sID_st4.textContent = 'Your Team: ';

        var sID_yourTeam = document.createElement('input');
        sID_yourTeam.id = 'sID_yourTeam';
        sID_yourTeam.style.marginTop = '20px';
        sID_yourTeam.style.marginRight = '10px';
        sID_yourTeam.style.width = '20px';
        sID_yourTeam.value = 0;

        var sID_st5 = document.createElement('txt');
        sID_st5.id = 'sID_st5';
        sID_st5.textContent = 'Other Team: ';

        var sID_otherTeam = document.createElement('input');
        sID_otherTeam.id = 'sID_otherTeam';
        sID_otherTeam.style.width = '20px';
        sID_otherTeam.value = 0;

        var sID_ok = document.createElement('input');
        sID_ok.type = 'button';
        sID_ok.id = 'ok';
        sID_ok.value = 'OK';
        sID_ok.onclick = function() {
            var a = Number($('#sID_game')[0].value).toString().search(/^[12]$/) < 0;
            var b = Number($('#sID_half')[0].value).toString().search(/^[12]$/) < 0;
            var c = isNaN(Number($('#sID_yourTeam')[0].value));
            var d = isNaN(Number($('#sID_otherTeam')[0].value));
            if( a | b | c | d ) {
                $('#sID_game')[0].value = '';
                $('#sID_half')[0].value = '';
                $('#sID_yourTeam')[0].value = 0;
                $('#sID_otherTeam')[0].value = 0;
                return
            }
            GM_setValue("post_tagpro_stats_game", Number($('#sID_game')[0].value).toString());
            GM_setValue("post_tagpro_stats_half", Number($('#sID_half')[0].value).toString());
            GM_setValue('thisTeamTimeoutScore', Number($('#sID_yourTeam')[0].value));
            GM_setValue('otherTeamTimeoutScore', Number($('#sID_otherTeam')[0].value));

            // if label was wiggling, stop it
            if($('#sendStatsLabel')[0].className == 'wiggling') {
                $('#sendStatsLabel').ClassyWiggle('stop');
            }

            $.unblockUI();
            setTimeout(function(){ GM_setValue("post_tagpro_stats_status","true")}, 500);
        }


        var sID_cancel = document.createElement('input');
        sID_cancel.type = 'button';
        sID_cancel.id = 'cancel';
        sID_cancel.value = 'Cancel';
        sID_cancel.style.marginTop = '30px';
        sID_cancel.style.marginRight = '15px';
        sID_cancel.style.marginBottom = '15px';
        sID_cancel.onclick = function() {
            clearDialog()
            $.unblockUI()
        }

        clearDialog = function() {
            $('#sID_game')[0].value = '';
            $('#sID_half')[0].value = '';
            $('#sID_yourTeam')[0].value = 0;
            $('#sID_otherTeam')[0].value = 0;
            $('#sendStatsCheckbox')[0].checked = false;
        }

        // add titles and stuff to main dialog div
        var t = $('#statsInput')
        t.append(sID_t1)
        t.append(sID_st1, sID_game)
        t.append(sID_st2, sID_half)
        t.append(sID_t2)
        t.append(sID_st4, sID_yourTeam)
        t.append(sID_st5, sID_otherTeam)
        //t.append('<p>', sID_st3)
        t.append('<p>', sID_cancel, sID_ok)

        //------------------------//
        //  END OF DIALOGS SETUP  //
        //------------------------//


        // make sure cookie to send stats is false
        GM_setValue("post_tagpro_stats_status","false");

        // make sure cookie for initial scores (scores set in group page) is set to 0-0
        // this really shouldn't be necessary, but just in case
        GM_setValue('initialScore', {r:"0",b:"0"});

        // set variable to indicate this player is spectating is false
        var spectating =  false;

        // make checkbox
        $('#leaveButton').after('<input id=sendStatsCheckbox type=checkbox>')
        $('#sendStatsCheckbox')[0].style.marginLeft='20px'

        // make checkbox label (actually a button so it will wiggle)
        $('#sendStatsCheckbox').after('<button id=sendStatsLabel>Send Stats to Server');
        $('#sendStatsLabel')[0].style.backgroundColor = 'transparent';
        $('#sendStatsLabel')[0].style.border = 'none';
        $('#sendStatsLabel')[0].style.color = 'white';
        $('#sendStatsLabel')[0].style.cursor = 'default';
        $('#sendStatsLabel')[0].style.fontSize = '16px';
        $('#sendStatsLabel')[0].style.cssText += ' outline: none;';
        $('#sendStatsLabel')[0].onclick = function() {
            var cmd = $('#sendStatsLabel')[0].className == 'wiggling' ? 'stop' : 'start'
            $('#sendStatsLabel').ClassyWiggle(cmd);
        }

        // add reminder not to set the score if sending stats
        //$('#sendStatsLabel').after('<txt id=sendStatsReminder>Reminder: You cannot use the score-setting feature in group when sending stats to the server!');
        //$('#sendStatsReminder')[0].style.fontSize = '10px';

        // If it is Sunday night (5:00 PM or later), make the checkbox label wiggle in the group page as a reminder
        if( new Date().getDay() == 0 & new Date().getHours() >= 17 ) {
            $('#sendStatsLabel').ClassyWiggle();
        }

        // If the box is checked, make a prompt to get game and half info, then
        //   run timeout prompt function
        promptFunction = function() {
            if( $('#sendStatsCheckbox')[0].checked ) { // if we just checked the box
                var dialogWidth = 600;
                var dialogLeft = $(window).width()/2 - dialogWidth/2
                $.blockUI({ message: $('#statsInput'), css: { width: dialogWidth+'px', left: dialogLeft+'px' } });
            } else {
                GM_setValue("post_tagpro_stats_status","false")
                clearDialog();
            }
        }



        // This function handles the speccing problem. It first checks if the send stats cookie is true. If not,
        //  it sets the spectating cookie to be false and returns. If it is, it checks if the player is in the spectator box.
        //  If so, a dialog is created to ask which team is she/he the captain of (red or blue). Since this will run in a
        //  setInterval, if the captain moves out of spec and then back into spec, it should ask again for their team.
        specCheckFunction = function() {
            if( GM_getValue("post_tagpro_stats_status") === "false") {
                spectating = false;
                return;
            }

            if( $(document.getElementsByClassName('you')).closest('div')[0].id === "spectators" ) {
                if(spectating){
                    return;
                }

                spectating = true;
                var dialogWidth2 = 400;
                var dialogLeft2 = $(window).width()/2 - dialogWidth2/2
                $.blockUI({ message: $('#specInput'), css: { width: dialogWidth2+'px', left: dialogLeft2+'px' } });

            } else {
                spectating = false;
            }
        }


        $('#sendStatsCheckbox')[0].onchange = promptFunction
        setInterval(specCheckFunction, 500);

        // Before leaving the page, save what the scores were set to in group so that we can correct for it in-game
        window.addEventListener('beforeunload', function() {
            var rScore = document.getElementsByName('redTeamScore')[0].value;
            var bScore = document.getElementsByName('blueTeamScore')[0].value;
            GM_setValue('initialScore', {r:rScore,b:bScore});
        });

    }

    //------------------------//
    // END OF GROUP PAGE CODE //
    //------------------------//


    // If we are on the main Tagpro site, set 'save stats' cookie to false.
    //   This is to prevent a bug in which a captain leaves a game for which she or he
    //   is saving stats WITHOUT going back to the groups page (by closing the tab or whatever).
    //   if that captain were to then play a pub, the userscript would try to send stats to the server
    //   because it hasn't been told not to.
    if( document.URL.search(".com/$") > 0 ) {
        GM_setValue("post_tagpro_stats_status","false");
        GM_setValue('initialScore', {r:"0",b:"0"});
    }



    //-----------------------------------------------------------------//
    // NOW STARTS THE MAIN CODE FOR SAVING STATS AND SENDING TO SERVER //
    //-----------------------------------------------------------------//

    if(document.URL.search(":") > 0 ) {
        window.catstats = (function(catstats) {

            catstats.downloaded = false;
            catstats.players = {};
            catstats.score = {redTeam: 0, blueTeam: 0};
            catstats.columns = ['name', 'plusminus', 'minutes', 'score', 'tags', 'pops',
                                'grabs', 'drops', 'hold', 'captures', 'prevent', 'returns',
                                'support', 'team', 'team captures', 'opponent captures',
                                'arrival', 'departure', 'bombtime', 'tagprotime', 'griptime',
                                'speedtime'];


            // TODO: Use tagpro.ready
            catstats.init = function init() {
                if (window.tagpro && tagpro.socket && window.jQuery)
                    return this.setup();
                setTimeout(this.init, 0);
            }





            var linkId = "postTagproStats";

            var tsvSavePrompt = "Send stats";

            catstats.setup = function setup() {
                var _this = this;

                $(document).ready(function() {
                    var currentStatusString = GM_getValue("post_tagpro_stats_status");
                    var currentStatus;

                    if (currentStatusString == null) {
                        currentStatus = false;
                    } else {
                        currentStatus = (currentStatusString === "true");
                    }

                    catstats.wantsStats = currentStatus;
                    console.log('current status: ' + currentStatus);

                    // this is old code to put checkbox on esc menu
                    /**

                    var $checkbox = $("<input>", { type: "checkbox", id: linkId, checked: currentStatus })
                    .css("cursor", "pointer")
                    .click(function() { _this.registerExport.call(_this); });

                    var $label = $('<label />').html(tsvSavePrompt)
                    .css("cursor", "pointer");
                    $label.prepend($checkbox);

                    var $el = $('#options').find('table');
                    $label.insertAfter($el);

                    **/
                });

                // Listen for player updates
                tagpro.socket.on('p', function(data) { _this.onPlayerUpdate.call(_this, data); });
                // Listen for score updates
                tagpro.socket.on('score', function(data) {
                    _this.onScoreUpdate.call(_this, data);
                    setTimeout(function() {
                        catstats.updateExport();
                    }, 50);
                });
                // Listen for player quits
                tagpro.socket.on('playerLeft', function(data) { _this.onPlayerLeftUpdate.call(_this, data); });
                // Listen for time and game state changes
                tagpro.socket.on('time', function(data) { _this.onTimeUpdate.call(_this, data); });
                // Listen for map
                tagpro.socket.on('map', function(data) { _this.onMapUpdate.call(_this, data); })

                // Listen for end game and attempt download
                tagpro.socket.on('end', function() { _this.onEnd.call(_this); });
                // Before leaving the page attempt download
                window.addEventListener('beforeunload', function() { _this.onEnd.call(_this); });

            };

            catstats.onMapUpdate = function onMapUpdate(data) {
                this.mapName = data.info.name;
            }

            /**
         * Update local player stats
         * @param {Object} data The 'p' update data
         */
            catstats.onPlayerUpdate = function onPlayerUpdate(data) {
                // Sometimes data is in .u
                data = data.u || data;

                var _this = this;

                // Loop over all the player updates
                // and update each player in
                // the local player record
                data.forEach(function(playerUpdate) {
                    var player = _this.players[playerUpdate.id];

                    if (!player) {
                        player = _this.createPlayer(playerUpdate.id);
                        _this.updatePlayer(player, tagpro.players[playerUpdate.id]);
                    } else {
                        _this.updatePlayer(player, playerUpdate);
                    }

                });
            };


            /**
        * Update the team score
        * @param {Object} data - The 'score' update data
        */
            catstats.onScoreUpdate = function onScoreUpdate(data) {
                this.score.redTeam = data.r - Number(GM_getValue('initialScore').r);
                this.score.blueTeam = data.b - Number(GM_getValue('initialScore').b);
            };


            /**
         * Handle players who leave early
         * @param {Number} playerId - The id of the player leaving
         */
            catstats.onPlayerLeftUpdate = function onPlayerLeftUpdate(playerId) {
                // Player leaves mid-game
                if(tagpro.state == 1) {
                    this.updatePlayerAfterDeparture(this.players[playerId], Date.now(), false, true);
                }

                // Player leaves before the game
                if(tagpro.state == 3) {
                    delete this.players[playerId];
                }

                // Ignore all other player's leaving
            };


            /**
         * Track the amount of time a player is in the game
         * @param {Object} data - The time object
         */
            catstats.onTimeUpdate = function onTimeUpdate(data) {
                if(tagpro.state == 2) return; //Probably unneeded
                var playerIds = Object.keys(this.players);
                var _this = this;
                playerIds.forEach(function(id) {
                    _this.players[id]['arrival'] = data.time;
                });
            };


            /**
         * Called when the game has ended or
         * the client is leaving the page
         */
            catstats.onEnd = function onEnd() {
                if(this.wantsStats && !this.downloaded) {
                    this.exportStats(false);
                    this.exportStats(true);
                }
            }

            /**
         * Prepare the local player record for export
         */
            catstats.prepareStats = function prepareStats(final) {
                var now = Date.now();
                var _this = this;
                var stats = Object.keys(this.players).map(function(id) {
                    var player = _this.players[id];
                    _this.updatePlayerAfterDeparture(player, now, final, false);

                    // Record every column for the spreadsheet
                    var columns = {};
                    columns['name']        = player['name'] || '';
                    columns['plusminus']   = 0; //placeholder to put this in position 2
                    columns['minutes']     = player['minutes'] || 0;
                    columns['score']       = player['score'] || 0;
                    columns['tags']        = player['s-tags'] || 0;
                    columns['pops']        = player['s-pops'] || 0;
                    columns['grabs']       = player['s-grabs'] || 0;
                    columns['drops']       = player['s-drops'] || 0;
                    columns['hold']        = player['s-hold'] || 0;
                    columns['captures']    = player['s-captures'] || 0;
                    columns['prevent']     = player['s-prevent'] || 0;
                    columns['returns']     = player['s-returns'] || 0;
                    columns['support']     = player['s-support'] || 0;
                    columns['team']        = player.team || 0;
                    columns['team captures']     = player.team == 1 ? tagpro.score.r - Number(GM_getValue('initialScore').r): tagpro.score.b - Number(GM_getValue('initialScore').b);
                    columns['opponent captures'] =  player.team == 1 ? tagpro.score.b - Number(GM_getValue('initialScore').b) : tagpro.score.r - Number(GM_getValue('initialScore').r);
                    columns['plusminus']   = columns['team captures'] - columns['opponent captures'] || 0;
                    columns['arrival']     = player['arrival'] || 0;
                    columns['departure']   = player['departure'] || 0;
                    columns['bombtime']    = player['bombtime'] || 0;
                    columns['tagprotime']  = player['tagprotime'] || 0;
                    columns['griptime']    = player['griptime'] || 0;
                    columns['speedtime']   = player['speedtime'] || 0;

                    return columns;
                })


                var mapName = catstats.mapName || "Unknown";
                var serverName = tagpro.serverHost;

                // add current score by team
                var redScore = tagpro.score['r'];
                var blueScore = tagpro.score['b'];


                if(tagpro.spectator === 'watching') {
                    var thisTeam = GM_getValue('specTeam') === 'r' ? 1 : 2;
                } else {
                    var thisTeam = tagpro.players[tagpro.playerId].team;
                }

                if(thisTeam == 1) {
                    var thisTeamScore = redScore + Number(GM_getValue('thisTeamTimeoutScore')) - Number(GM_getValue('initialScore').r);
                    var otherTeamScore = blueScore + Number(GM_getValue('otherTeamTimeoutScore')) - Number(GM_getValue('initialScore').b);
                } else {
                    var thisTeamScore = blueScore + Number(GM_getValue('thisTeamTimeoutScore')) - Number(GM_getValue('initialScore').b);
                    var otherTeamScore = redScore + Number(GM_getValue('otherTeamTimeoutScore')) - Number(GM_getValue('initialScore').r);
                }

                // add map, server, game, half, key, and score objects to stats array
                stats.unshift({map : mapName},
                              {server : serverName},
                              {game: GM_getValue("post_tagpro_stats_game")},
                              {half: GM_getValue("post_tagpro_stats_half")},
                              {userkey: KEY},
                              {score: {thisTeamScore: thisTeamScore, otherTeamScore: otherTeamScore}},
                              {state: tagpro.state}
                             );

                return stats;
            }


            /**
         * Called when a cap occurs. It exports data as an update, not as a final stats export
         */
            catstats.updateExport = function updateExport() {
                if ( this.wantsStats ) {
                    this.exportStats(false);
                }
            };

            /**
         * Create a local player record
         * @param {Number} id - the id of the player
         */
            catstats.createPlayer = function createPlayer(id) {
                var player = this.players[id] = {};
                player['arrival']     = tagpro.gameEndsAt - Date.now();
                player['bombtime']    = 0;
                player['tagprotime']  = 0;
                player['griptime']    = 0;
                player['speedtime']   = 0;
                player['bombtr']      = false;
                player['tagprotr']    = false;
                player['griptr']      = false;
                player['speedtr']     = false;
                player['diftotal']    = 0;
                player['departed']    = false;
                return player;
            };


            /**
         * Update the local player record with new data
         * @param {Object} player - reference to local player record
         * @param {Object} playerUpdate - new player data
         */
            catstats.updatePlayer = function updatePlayer(player, playerUpdate) {
                var attrs = Object.keys(playerUpdate);
                var _this = this;
                attrs.forEach(function(attr) {
                    var data = playerUpdate[attr];

                    // if this is a powerup - update time tracking
                    if(attr === 'bomb' || attr === 'tagpro' || attr === 'speed' || attr === 'grip') {
                        _this.updatePlayerTimer(player, attr, data);
                    }

                    // update the local player record with new data
                    if(typeof data !== 'object') {
                        player[attr] = data;
                    }
                });
            };


            /**
         * Update timers on the local player record
         * @param {Object} player - reference to local player record
         * @param {Object} timerName - name of the timer to update
         * @param {Object} timerValue - value of the timer to update
         */
            catstats.updatePlayerTimer = function updatePlayerTimer(player, timerName, timerValue) {
                // the player has the powerup and
                // we aren't tracking the time yet
                if(timerValue === true && !player[timerName+'tr']) {
                    player[timerName+'tr'] = true;
                    player[timerName+'start'] = Date.now();
                    return;
                }

                // player lost the powerup, save the time
                if(timerValue === false && player[timerName+'tr'] === true) {
                    player[timerName+'tr'] = false;
                    player[timerName+'time'] += Date.now() - player[timerName+'start'];
                    return;
                }
            }

            /**
         * When a player leaves or the game is over perform some cleanup
         * @param {Object} player - reference to local player record
         * @param {Number} [now] - unix timestamp representing current time
         */
            catstats.updatePlayerAfterDeparture = function updatePlayerAfterDeparture (player, now, final, playerLeft) {
                var now = now || Date.now();

                // ignore players who have already departed
                if(player['departed']) {
                    return
                }

                // if player left game early, set departed flag
                if(playerLeft) {
                    player['departed'] = true;
                }

                // update minutes in non-final updates
                if(!final && !player['departed']) {
                    var seconds  = (player['arrival'] - (tagpro.gameEndsAt - now)) / 1e3;
                    player['minutes'] = Math.round(seconds/60);
                    return;
                }


                player['departure'] = tagpro.gameEndsAt - now;

                // Record the minutes played
                var seconds  = (player['arrival'] - player['departure']) / 1e3;
                player['minutes'] = Math.round(seconds/60);

                var _this = this;
                // Update all timers
                ['bomb', 'tagpro', 'grip', 'speed'].forEach(function(timerName) {
                    _this.updatePlayerTimer(player, timerName, false);
                });
            }

            /**
         * Create the document and trigger a download
         */
            catstats.exportStats = function exportStats(final) {
                var data = this.prepareStats(final);
                console.log(JSON.stringify(data))
                $.post(final ? FINALURL : UPDATEURL, JSON.stringify(data), function(e) {
                    console.log(e);
                });
                if(final) {
                    this.downloaded = true;
                }
            }

            $(function() {
                window.tagpro.ready(function() {
                    catstats.init();
                });
            });

            return catstats;
        }({}));
    }
})(unsafeWindow, document);
