$(document).ready(function () {
    "use strict";
    var settings = {
            me: [],
            rival: []
        },
        changed = function (array1, array2) {
            // compare two token input object arrays for equality (order is irrelevant)
            var a = $.map(array1, function (token) { return token.id; }).sort(),
                b = $.map(array2, function (token) { return token.id; }).sort();
            return JSON.stringify(a) !== JSON.stringify(b);
        },
        apply_settings = function () {
            // apply settings and save cookie
            var me = $("#set_me").tokenInput("get"),
                rival = $("#set_rival").tokenInput("get"),
                expire = new Date(new Date().setDate(new Date().getDate() + 365)).toUTCString(),
                message = "";
            if (changed(me, settings.me) || changed(rival, settings.rival)) {
                if (me.length > 0 || (me.length === 0 && rival.length === 0)) {
                    settings.me = me;
                    settings.rival = rival;
                    document.cookie = "DJRivals_Settings=" + JSON.stringify(settings) + "; expires=" + expire;
                    message = ":D";
                } else {
                    message = "Please enter your DJ name!";
                }
            }
            return message;
        },
        load_settings = function () {
            // load settings from cookie
            var cookie = document.cookie.split(/;\s*/),
                i,
                ilen;
            for (i = 0, ilen = cookie.length; i < ilen; i += 1) {
                if (cookie[i].indexOf("DJRivals_Settings") === 0) {
                    cookie = JSON.parse(cookie[i].slice(cookie[i].indexOf("=") + 1));
                    settings.me = cookie.me;
                    settings.rival = cookie.rival;
                    break;
                }
            }
        },
        ranking_table = function (data) {
            // generate a ranking table with the given data
            var players = settings.me.concat(settings.rival),
                no_play = [],
                dj_records = [],
                rival_records = [],
                exit_on_zero = 10,
                found,
                i,
                ilen;
            no_play = $.map(data, function (element) {
                return element[2];
            });
            no_play = $.map(players, function (token, index) {
                if ($.inArray(token.name, no_play) < 0) {
                    players.splice(index, 1, false);
                    return token.name;
                }
            });
            players = $.map(players, function (token) {
                if (token) {
                    return token.name;
                }
            });
            dj_records.push("<table><tr><th>Rank</th><th>Icon</th><th>DJ</th><th>Score</th></tr>");
            rival_records.push("<table><tr><th>Rank</th><th>Icon</th><th>Rival DJ</th><th>Score</th></tr>");
            for (i = 0, ilen = data.length; i < ilen; i += 1) {
                if (players.length < 1) {
                    if (exit_on_zero < 1) {
                        break;
                    }
                    exit_on_zero -= 1;
                }
                dj_records.push("<tr><td>" + data[i][0] + '</td><td><img src="./images/icon/' + data[i][1] + '" /></td><td>' + data[i][2] + "</td><td>" + data[i][3] + "</td></tr>");
                found = $.inArray(data[i][2], players);
                if (found > -1) {
                    rival_records.push("<tr><td>" + data[i][0] + '</td><td><img src="./images/icon/' + data[i][1] + '" /></td><td>' + data[i][2] + "</td><td>" + data[i][3] + "</td></tr>");
                    players.splice(found, 1);
                }
            }
            for (i = 0, ilen = no_play.length; i < ilen; i += 1) {
                rival_records.push("<tr><td>-</td><td></td><td>" + no_play[i] + "</td><td>-</td></tr>");
            }
            return '<table><tr><td class="djrank">' + dj_records.join("") + '</table></td><td class="rivalrank">' + rival_records.join("") + "</table></td></tr></table>";
        },
        load_tab = function (event, ui) {
            // load tab content
            var chart = ui.newTab.children().text(),
                div = $("#" + chart).children(),
                name = div.first().text().replace(/\W/g, ""),
                url;
            if (chart.length === 2) {
                chart = "pop_" + chart;
            }
            url = "./database/" + (name === "Master" ? (name + "/" + chart) : (chart + "/" + name)) + ".json";
            if (div.last().text() === "Loading...") {
                $.ajax({
                    cache: false,
                    dataType: "json",
                    url: url.toLowerCase()
                }).done(function (data) {
                    div.last().empty().html(ranking_table(data.ranking));
                }).fail(function () {
                    div.last().empty().html("Unable to retrieve data.");
                });
            }
        },
        prune = {
            // functions to help ensure all field content from settings are unique
            f: function (field) {
                // get all ids from a field
                return $.map(field.tokenInput("get"), function (token) {
                    return token.id;
                });
            },
            g: function (id, array) {
                // check if an id exists in the given array
                return $.inArray(id, array) > -1 ? true : false;
            },
            m: function (token) {
                // remove id from #set_me if it exists in #set_rival
                if (prune.g(token.id, prune.f($("#set_rival")))) {
                    $("#set_me").tokenInput("remove", {id: token.id});
                }
            },
            r: function (token) {
                // remove id from #set_rival if it exists in #set_me
                if (prune.g(token.id, prune.f($("#set_me")))) {
                    $("#set_rival").tokenInput("remove", {id: token.id});
                }
            }
        },
        set_status = function (message) {
            // display a message to the user
            $("#set_status").empty();
            $("<span>" + message + "</span>").prependTo("#set_status").fadeOut(5000, function () { $(this).remove(); });
        };

    // tabs
    $("#tabs").tabs({
        active: false,
        collapsible: true,
        event: "mouseover",
        heightStyle: "content",
        activate: load_tab
    });

    // accordion
    $(".accordion").accordion({
        heightStyle: "content"
    });

    // autocomplete fields
    $.ajax({
        cache: false,
        dataType: "json",
        url: "./database/dj_index.json"
    }).done(function (data) {
        $("#set_me").tokenInput(data, {
            hintText: "Type a DJ name",
            theme: "facebook",
            onAdd: prune.m,
            prePopulate: settings.me.length > 0 ? settings.me : null,
            tokenLimit: 1
        });
        $("#set_rival").tokenInput(data, {
            hintText: "Type a DJ name",
            theme: "facebook",
            onAdd: prune.r,
            prePopulate: settings.rival.length > 0 ? settings.rival : null,
            preventDuplicates: true
        });
    }).fail(function () {
        $("#set_me").prop("disabled", true);
        $("#set_rival").prop("disabled", true);
        $("#set_apply").prop("disabled", true);
    });

    // apply button :V
    $("#set_apply").button().click(function () { set_status(apply_settings()); });

    load_settings();
});
