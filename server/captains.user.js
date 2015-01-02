// ==UserScript==
// @name           tagpro-leaguestats
// @version        1.0
// @include        http://tagpro-*.koalabeast.com*
// @include        http://tangent.jukejuice.com*
// @include        http://maptest*.newcompte.fr*
// @grant          GM_setValue
// @grant          GM_getValue
// @require        https://raw.githubusercontent.com/ballparts/pubstats/master/ClassyWiggle.min.js
// ==/UserScript==

(function(window, document, undefined) {

    //--------------------------------------//
    // THESE VALUES MIGHT NEED TO BE EDITED //
    //--------------------------------------//

    // Links to post data for 1) score updates, and 2) final stats
    UPDATEURL = 'http://44e20bdf.ngrok.com/api/game/scorekeeper'
    FINALURL  = 'http://44e20bdf.ngrok.com/api/teams/game/stats'

    // User ID for identification purposes
    KEY = 1234567;

    //------------------------//
    // END OF EDITABLE VALUES //
    //------------------------//





    //-----------------------------------------------------------------------------//
    // IF WE ARE ON THE GROUP PAGE, CREATE A CHECK BOX TO TURN ON STATS COLLECTION //
    //-----------------------------------------------------------------------------//

    if( document.URL.search('groups') > 0 ) {

        // make sure cookie to send stats is false
        GM_setValue("post_tagpro_stats_status","false")

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
        $('#sendStatsLabel').after('<txt id=sendStatsReminder>Reminder: Don\'t set scores if you\'re sending stats!');
        $('#sendStatsReminder')[0].style.fontSize = '10px';

        // If it is Sunday night (5:00 PM or later), make the checkbox label wiggle in the group page as a reminder
        if( new Date().getDay() == 0 & new Date().getHours() >= 17 ) {
            $('#sendStatsLabel').ClassyWiggle();
        }

        // If the box is checked, make a prompt to get game and half info
        promptFunction = function() {
            if( $('#sendStatsCheckbox')[0].checked ) { // if we just checked the box
                input = "0"
                while(input.match(/^G[0-9]H[0-9]$/) === null) {
                    input = prompt('Please input Game and Half info.\n\n(Make sure it is in this format: G1H2)');
                    if(input === null) {
                        $('#sendStatsCheckbox')[0].checked = false
                        break
                    }
                }

                // Once the user has inputted the Game and Half correctly, save a cookie letting us know to record stats.

                if(input !== null) {
                    GM_setValue("post_tagpro_stats_status","true")
                    // Also save cookies for game and half info
                    GM_setValue("post_tagpro_stats_game", input[1])
                    GM_setValue("post_tagpro_stats_half", input[3])

                    // if label was wiggling, stop it
                    if($('#sendStatsLabel')[0].className == 'wiggling') {
                        $('#sendStatsLabel').ClassyWiggle('stop');
                    }
                }


            } else { // if we just unchecked the box

                GM_setValue("post_tagpro_stats_status","false");
            }
        }

        $('#sendStatsCheckbox')[0].onchange = promptFunction

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
    }



    //-----------------------------------------------------------------//
    // NOW STARTS THE MAIN CODE FOR SAVING STATS AND SENDING TO SERVER //
    //-----------------------------------------------------------------//

    window.catstats = (function(catstats) {

        var readCookie = function readCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        }

        var writeCookie = function writeCookie(cookie) {
            var cookieExpirationDate = new Date();
            cookieExpirationDate.setYear(cookieExpirationDate.getYear() + 1);
            cookieExpirationDate = cookieExpirationDate.toGMTString();

            var cookieDomain = (function() {
                var s = document.domain.toString();
                return s.substring(s.indexOf("."));
            })();

            document.cookie = cookie.toString() + ";" + "domain=" + cookieDomain + ";" + "expires=" + cookieExpirationDate;
        }

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
            this.score.redTeam = data.r;
            this.score.blueTeam = data.b;
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
                columns['team captures']     = player.team == 1 ? tagpro.score.r : tagpro.score.b;
                columns['opponent captures'] =  player.team == 1 ? tagpro.score.b : tagpro.score.r;
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
            var thisTeam = tagpro.players[tagpro.playerId].team;
            if(thisTeam == 1) {
                var thisTeamScore = redScore;
                var otherTeamScore = blueScore;
            } else {
                var thisTeamScore = blueScore;
                var otherTeamScore = redScore;
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
                player[timerName+'time'] = Date.now() - player[timerName+'start'];
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
})(unsafeWindow, document);
