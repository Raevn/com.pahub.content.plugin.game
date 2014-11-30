/** com.pahub.content.plugin.game **/
function load_plugin_game(data, folder) {
	var ladder_urls = [
		"http://uberent.com/MatchMaking/GetRankLeaderboard?GameType=Ladder1v1&TitleId=4&Rank=1",
		"http://uberent.com/MatchMaking/GetRankLeaderboard?GameType=Ladder1v1&TitleId=4&Rank=2",
		"http://uberent.com/MatchMaking/GetRankLeaderboard?GameType=Ladder1v1&TitleId=4&Rank=3",
		"http://uberent.com/MatchMaking/GetRankLeaderboard?GameType=Ladder1v1&TitleId=4&Rank=4",
		"http://uberent.com/MatchMaking/GetRankLeaderboard?GameType=Ladder1v1&TitleId=4&Rank=5"
	]
	
	pahub.api["game"] = {}
	
	model["game"] = {
		folder: ko.observable(folder),
		ladders: ko.observable([]),
		ladder_tab: ko.observable(0),
		loading_ladder: ko.observable(0),
		ladder_tier_names: [
			"Uber",
			"Platinum",
			"Gold",
			"Silver",
			"Bronze"
		],
		current_ladder_name: ko.computed({
			read: function() {
				return model.game.ladder_tier_names[model.game.ladder_tab()];
			},
			deferEvaluation: true
		}),
		current_ladder: ko.computed({
			read: function() {
				return model.game.ladders()[model.game.ladder_tab()]; 
			},
			deferEvaluation: true
		}),
		
        secondsSinceGame: function(lastMatchAt) {
            if (!lastMatchAt)
                return 0;
			
			var now = (new Date()) / 1000;
            lastMatchAt = (new Date(lastMatchAt).getTime() / 1000) | 0;
            if (lastMatchAt > now)
                return 0;
            else
                return now - lastMatchAt;
        },
		
        timeSinceGame: function(lastMatchAt) {
            var units = [
                { scale: 60, description: 'second' },
                { scale: 60, description: 'minute' },
                { scale: 24, description: 'hour' },
                { scale:  7, description: 'day' },
                { description: 'week' }
            ];

            var unit = model.game.secondsSinceGame(lastMatchAt);
            if (unit === 0)
                return 'Just now';

            for (var i = 0; i < units.length; ++i) {
                var unitInfo = units[i];
                if (!unitInfo.scale || unit < unitInfo.scale)
                    return unit + ' ' + unitInfo.description + (unit > 1 ? 's' : '') + ' ago';
                unit = (unit / unitInfo.scale) | 0;
            }

            return unit + ' ' + units[units.length - 1].description + (unit > 1 ? 's' : '') + ' ago';
        },
		
		loadLadders: function() {
			model.game.loading_ladder(10);
			for (var i = 0; i < 5; i++) {
				model.game.ladders()[i] = [];
				(function(i) {
					pahub.api.resource.loadResource(ladder_urls[i], "get", {name: model.game.ladder_tier_names[i] + " ladder", mode: "async", success: function(resource) {
						model.game.loading_ladder(model.game.loading_ladder()-1);
						var ladderJSON = JSON.parse(resource.data);
						
						if (ladderJSON) {
							model.game.ladders()[i] = ladderJSON.LeaderboardEntries;
						}
						var uber_ids = [];
						for (var j = 0; j < ladderJSON.LeaderboardEntries.length; j++) {
							uber_ids.push(ladderJSON.LeaderboardEntries[j].UberId);
							model.game.ladders()[i][j]["display_name"] = ko.observable("");
							model.game.ladders()[i][j]["LastMatchAtString"] = ko.observable(model.game.timeSinceGame(model.game.ladders()[i][j].LastMatchAt));
						}
						
						(function(i, uber_ids) {
							var query = 'http://uberent.com/GameClient/UserNames?TitleId=4&UberIds=' + uber_ids.join('&UberIds=');
							pahub.api.resource.loadResource(query, "get", {name: model.game.ladder_tier_names[i] + " ladder names", mode: "async", success: function(resource) {
								var data = JSON.parse(resource.data);
								for (var j = 0; j < model.game.ladders()[i].length; j++) {
									model.game.ladders()[i][j].display_name(data.Users[uber_ids[j]].TitleDisplayName);
								}
								model.game.ladders.valueHasMutated();
							}, fail: function(resource) {}, always: function(resource) {
								model.game.loading_ladder(model.game.loading_ladder()-1);
							}});
						})(i, uber_ids);
						
						model.game.ladders.valueHasMutated();
					}});
				})(i);
			}
		}
	}
	
	model.game.loadLadders();
	
	pahub.api.section.addSection("section-game", "GAME", path.join(folder, "game.png"), "sections", 15);
	pahub.api.tab.addTab("section-game", "ladder", "LADDER", "", 10);
	//pahub.api.tab.addTab("section-game", "lobby", "LOBBY", "", 20);
	//pahub.api.tab.addTab("section-game", "matchmaking", "MATCHMAKING", "", 30);
	
	pahub.api.resource.loadResource(path.join(folder, "ladder.html"), "get", {name: "HTML: ladder", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-game", "ladder", resource.data);
	}});	
}

function unload_plugin_game(data) {
}