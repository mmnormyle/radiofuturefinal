﻿import { FrameBuilder } from "./FrameBuilder";
import { Media } from "./Contracts";

declare var Spinner: any;

// Oh god this code is scary

export interface UICallbacks {
    uiSendChatMessage: any;
    uiSearch: (query: string, page: number) => void;
    uiNameChange: any;
    uiQueueMedia: (media: Media) => void;
    uiGoToMedia: (newQueuePosition: number) => void;
    uiDeleteMedia: (mediaId: number, position: number) => void;
    uiRequestSyncWithUser: (userId: number) => void;
}

export class UI {

    private colors: any;
    private spinner: any;
    private callbacks: UICallbacks;
    private mobileBrowser: boolean;
    private frameBuilder: FrameBuilder;
    private currentPage: number;
    private currentQuery: string;

    constructor(mobileBrowser: boolean, callbacks: UICallbacks) {
        this.colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
        this.mobileBrowser = mobileBrowser;
        this.frameBuilder = new FrameBuilder();
        this.callbacks = callbacks;
        this.initialize();
    }

    private triangle(element: JQuery, facingRight: boolean) {
        element.width(0);
        element.height(0);
        var parentHeight = element.parent().height();
        var length = parentHeight * .10;
        element.css('border', '0');
        element.css('border-top', `${length}px solid transparent`);
        element.css('border-bottom', `${length}px solid transparent`);
        if (facingRight) {
            element.css('border-left', `${1.5 * length}px solid white`);
            element.css('border-right', '0');
        }
        else {
            element.css('border-right', `${1.5 * length}px solid white`);
            element.css('border-left', '0');
        }
    }

    private initialize() {
        this.setupSpinnerUI();
        this.setupInfoRolloverUI();
        this.setupInputUI();
        if (this.mobileBrowser) {
            this.setupSelectorsUI();
            this.select($("#btn_sel_queue"), $("#div_queue_results"));
        }
        this.triangle($("#btn_next"), true);
        this.triangle($("#btn_previous"), false);
    }

    select = function (btnSel, divToFade) {
        $(".span_sel").removeClass('sel_selected');
        btnSel.addClass('sel_selected');
        $(".stuff").hide();
        divToFade.show();
    }

    private setupSelectorsUI = () => {
        $("#btn_sel_queue").click(() => {
            this.select($("#btn_sel_queue"), $("#div_queue_results"));
        });
        $("#btn_sel_search").click(() => {
            this.select($("#btn_sel_search"), $("#div_search"));
        });
        $("#btn_sel_users").click(() => {
            this.select($("#btn_sel_users"), $("#div_user_results"));
        });
    } 

    public sessionReady = () => {
        $("#div_loading").hide();
        this.spinner.stop();
        $("#div_everything").animate({opacity: 1}, 'fast');
        var divLinkHelp = $(document.createElement('div'));
        divLinkHelp.addClass('arrow_box');
        divLinkHelp.html('send this link to people!');
        divLinkHelp.appendTo(document.body);
        setTimeout(() => {
            divLinkHelp.fadeOut();
        }, 5000);
    } 

    private setupSpinnerUI() {
        var opts = {
            lines: 13 // The number of lines to draw
            , length: 28 // The length of each line
            , width: 14 // The line thickness
            , radius: 42 // The radius of the inner circle
            , scale: 1 // Scales overall size of the spinner
            , corners: 1 // Corner roundness (0..1)
            , color: '#000' // #rgb or #rrggbb or array of colors
            , opacity: 0.25 // Opacity of the lines
            , rotate: 0 // The rotation offset
            , direction: 1 // 1: clockwise, -1: counterclockwise
            , speed: 1 // Rounds per second
            , trail: 60 // Afterglow percentage
            , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
            , zIndex: 2e9 // The z-index (defaults to 2000000000)
            , className: 'spinner' // The CSS class to assign to the spinner
            , top: '50%' // Top position relative to parent
            , left: '50%' // Left position relative to parent
            , shadow: false // Whether to render a shadow
            , hwaccel: false // Whether to use hardware acceleration
            , position: 'absolute' // Element positioning
        }
        var target = document.getElementById('div_loading');
        this.spinner = new Spinner(opts).spin(target);
    }

    private fadeOut = (overall, results) => {
        results.fadeOut();
        let dropper = overall.find('.dropper');
        dropper.removeClass('arrow-up');
        dropper.addClass('arrow-down');
    }

    private fadeIn = (overall, results) => {
        results.fadeIn();
        let dropper = overall.find('.dropper');
        dropper.removeClass('arrow-down');
        dropper.addClass('arrow-up');
    }

    private setupFadeUI(overall: JQuery, results) {
        overall.mouseenter((e) => {
            if (!results.is(':visible')) {
                this.fadeIn(overall, results);
            }
        });
        overall.mouseleave((e) => {
            if (results.is(':visible')) {
                this.fadeOut(overall, results);
            }
        });
    }

    private setupMobileClickUI(dropper, overall, results) {
        dropper.click(() => {
            if (!results.is(':visible')) {
                this.fadeIn(overall, results);
            }
            else {
                this.fadeOut(overall, results);
            }
        });
    }

    private setupInfoRolloverUI() {
        var divUsersOverall = $("#div_users_overall");
        var divQueueOverall = $("#div_queue_overall");
        var divUserResults = $("#div_user_results");
        var divQueueResults = $("#div_queue_results");
        if (!this.mobileBrowser) {
            this.setupFadeUI(divUsersOverall, divUserResults); 
            this.setupFadeUI(divQueueOverall, divQueueResults);
        }
        else {
            this.setupMobileClickUI(divUsersOverall.children(".dropper"), divUsersOverall, divUserResults);
            this.setupMobileClickUI(divQueueOverall.children(".dropper"), divQueueOverall, divQueueResults);
        }
    }

    private searchTextChanged(text) {
        var divResults = $("#div_search_results");
        if(text.length==0) {
            divResults.fadeOut();
        }
    }

    private setupInputUI() {
        var inputSearch = $("#input_search");
        inputSearch.keypress((e) => {
            if (e.which == 13) {
                this.searchEnterPressed(inputSearch);
            }
        });
        $("#btn_search").click(() => {
            this.searchEnterPressed(inputSearch);
        });
        var input_name = $("#input_name");
        input_name.keypress((e) => {
            if (e.which == 13) {
                this.userNameChange(input_name);
            }
        });
        if (!this.mobileBrowser) {
            var input_chat = $("#input_chat");
            input_chat.keypress((e) => {
                if (e.which == 13) {
                    this.callbacks.uiSendChatMessage(input_chat.val());
                    input_chat.val("");
                }
            });
        }
        $("#div_stuff, #div_current_content").click(() => {
            $("#div_search_results").fadeOut();
            $("#input_search").val("");
        });
        $("#input_search").bind("propertychange input paste", (event) => {
            this.searchTextChanged($("#input_search").val());
        });
    }

    public onSearchResults(results: Media[]) {
        var divResults = $("#div_search_results");
        divResults.html("");
        for (let i = 0; i < results.length; i++) {
            let media = results[i];
            var divSearchResult = $(document.createElement('div'));
            divSearchResult.addClass('div_result search_stuff');
            divSearchResult.appendTo(divResults);
            var imgThumb = document.createElement('img');
            $(imgThumb).addClass('img_result search_stuff');
            imgThumb.src = media.ThumbURL;
            $(imgThumb).appendTo(divSearchResult);
            var innerDiv = document.createElement('div');
            $(innerDiv).addClass('div_inner_results search_stuff');
            $(innerDiv).appendTo(divSearchResult);
            var spanTitle = document.createElement('p');
            $(spanTitle).addClass('result_title search_stuff');
            $(spanTitle).appendTo(innerDiv);
            $(spanTitle).text(media.Title);
            var spanDescription = document.createElement('p');
            $(spanDescription).addClass('result_description search_stuff');
            $(spanDescription).appendTo(innerDiv);
            $(spanDescription).html(media.Description);
            divSearchResult.click(() => {
                $("#div_search_results").fadeOut();
                $("#input_search").val("");
                this.callbacks.uiQueueMedia(media);
            });
        }
        if (results.length == 0) {
            var divResults = $("#div_search_results");
            divResults.html("");
            divResults.html("<p id='p_searching'>no results found, or something screwed up</p>");
            divResults.fadeIn();
        }
        // TODO: these dont have to be added every time
        if (results.length == 5) {
            var pagingDiv = $(document.createElement('div'));
            pagingDiv.addClass("div_outer_paging");
            pagingDiv.appendTo(divResults);
            var previousDiv = $(document.createElement('div'));
            previousDiv.appendTo(pagingDiv);
            previousDiv.addClass('div_paging');
            previousDiv.click(() => {
                this.previousPage();
            });
            previousDiv.text('previous page');
            if (this.currentPage == 0) {
                previousDiv.hide();
            }
            var nextDiv = $(document.createElement('div'));
            nextDiv.appendTo(pagingDiv);
            nextDiv.addClass('div_paging');
            nextDiv.click(() => {
                this.nextPage();
            });
            nextDiv.text('next page');
        }

        var notFoundDiv = $(document.createElement('div'));
        notFoundDiv.addClass("div_not_found");
        notFoundDiv.appendTo(divResults);
        notFoundDiv.html("didn't find what you're looking for?")
        notFoundDiv.click(() => {
            this.customSearch();
        });


        $("#input_search").blur();
        if (!divResults.is(':visible')) {
            divResults.show();
        }
    }

    private errorPlaceholder(el: JQuery, error: string) {
        el.val("");
        el.attr("placeholder", error);
    }

    customSearch = () => {
        var divResults = $("#div_search_results");
        var html = `
            <div id="div_not_found_search">
               <input class="notfoundinput" placeholder="Episode name" id="input_episode"></input>
               <input class="notfoundinput" placeholder="Show name" id="input_show"></input>
               <input class="notfoundinput" placeholder="MP3 URL" id="input_mp3_url"></input>
               <button style="cursor: pointer" id="btn_not_found">queue</button>
            </div>`;
        divResults.html(""); 
        divResults.html(html);
        $("#btn_not_found").click(() => {
            var episode = $("#input_episode");
            var show = $("#input_show");
            var mp3url = $("#input_mp3_url");
            var valid = true;
            if (!episode.val() || episode.val() == "") {
                valid = false;
                this.errorPlaceholder(episode, "Enter an episode name");
            }
            if (episode.val().length > 400) {
                valid = false;
                this.errorPlaceholder(episode, "Enter a shorter episode name");
            }
            if (!show.val() || show.val() == "") {
                valid = false;
                this.errorPlaceholder(show, "Enter a show name");
            }
            if (show.val().length > 400) {
                valid = false;
                this.errorPlaceholder(show, "Enter a shorter show name");
            }
            if (!this.validURL(mp3url.val())) {
                valid = false;
                this.errorPlaceholder(mp3url, "Enter a valid url");
            }
            if (valid) {
                var media = new Media();
                media.MP3Source = mp3url.val();
                media.Title = episode.val();
                media.Show = show.val();
                this.callbacks.uiQueueMedia(media);
                divResults.fadeOut();
            }
        });
    }

    previousPage = () => {
        if (this.currentPage > 0) {
            this.displaySearching();
            this.currentPage -= 1;
            this.callbacks.uiSearch(this.currentQuery, this.currentPage);
        }
    }

    nextPage = () => {
        this.displaySearching();
        this.currentPage += 1;
        this.callbacks.uiSearch(this.currentQuery, this.currentPage);
    }

    displaySearching() {
        var divResults = $("#div_search_results");
        divResults.html("");
        divResults.html("<p id='p_searching'>searching</p>");
        divResults.fadeIn();
    }

    private searchEnterPressed(input_search) {
        this.currentPage = 0;
        this.currentQuery = input_search.val();
        if (this.currentQuery && this.currentQuery != "") {
            this.callbacks.uiSearch(this.currentQuery, this.currentPage);
            this.displaySearching();
        }
    }

    public updateQueue(queue: Media[], userIdMe: number, queuePosition: number) {

        // TODO: this should get out of here
        var hasNext = (queuePosition + 1) < queue.length;
        var hasPrevious = queuePosition > 0;
        if (hasNext) {
            $("#btn_next").show();
        }
        else {
            $("#btn_next").hide();
        }
        if (hasPrevious) {
            $("#btn_previous").show();
        }
        else {
            $("#btn_previous").hide();
        }

        var length = queue.length;
        var summary = length + " things in the playlist";
        if (length == 1) {
            summary = length + " thing in the playlist";
        }
        else if (length <= 0) {
            summary = "Nothing in the playlist.";
        }
        $("#p_queue_summary").text(summary);

        var queueResults = $("#div_queue_results");
        queueResults.html("");
        // TODO: need to make this seperate from search results probably
        for (let i = 0; i < length; i++) {
            let media = queue[i];
            let divQueueResult = $(document.createElement('div'));
            divQueueResult.addClass('div_queue_result');
            divQueueResult.appendTo(queueResults);
            var imgThumb = document.createElement('img');
            $(imgThumb).addClass('img_result');
            if (media.ThumbURL && media.ThumbURL != "") {
                imgThumb.src = media.ThumbURL;
            }
            else {
                $(imgThumb).css('background', this.colors[i]);
            }
            $(imgThumb).appendTo(divQueueResult);
            var innerDiv = document.createElement('div');
            $(innerDiv).addClass('div_inner_results');
            $(innerDiv).appendTo(divQueueResult);
            $(innerDiv).click(() => {
                this.callbacks.uiGoToMedia(i);
            });
            var spanTitle = document.createElement('p');
            $(spanTitle).addClass('result_title');
            $(spanTitle).appendTo(innerDiv);
            $(spanTitle).text(media.Title);
            if (!this.mobileBrowser) {
                var spanDescription = document.createElement('p');
                $(spanDescription).addClass('result_description');
                $(spanDescription).appendTo(innerDiv);
                $(spanDescription).html(media.Description);
            }
            if (userIdMe == media.UserId) {
                var deleteX = document.createElement('span');
                $(deleteX).text('X');
                $(deleteX).addClass('span_delete');
                $(deleteX).click(() => {
                    this.callbacks.uiDeleteMedia(media.Id, i);
                });
                $(deleteX).appendTo(divQueueResult);
            }
            
            if (queuePosition == i) {
                $(divQueueResult).addClass('queue_result_selected');
            }
        }
    }

    validURL = (str): boolean => {
        if (!str || str.length < 3) {
            return false;
        } 
        if (str.substring(0, 4) !== "http") {
            return false;
        }
        var last = str.substring(str.length - 3, str.length);
        if (last.toUpperCase().includes("MP3")) {
            return false;
        }
        return true;
    }


    public updateUsersList(users, userIdMe: number) {
        var num = users.length;
        var summary = users.length + " users listening";
        if (num == 1) {
            summary = users.length + " user listening";
        }
        $("#p_users_summary").text(summary);
        var userResults = $("#div_inner_user_results");
        userResults.html("");
        for (var i = 0; i < users.length; i++) {
            let user = users[i];
            let thisIsMe = (user.Id === userIdMe);
            let color = this.colors[i % this.colors.length];
            let currentHTML = "";
            var syncHTML = thisIsMe ? 'you' : 'sync';
            var syncHTMLMobile = thisIsMe ? 'you' : 'sync with ' + user.Name;
            currentHTML =
                `<div class="user_result_outer"> 
                    <div class="user_result_block" style="background:${color};">${syncHTML}</div> 
                    <span class="user_result_span"> ${user.Name} </span> 
                </div>`;

            var cur = $($.parseHTML(currentHTML));
            var outer = cur.filter('.user_result_outer');

            if (!thisIsMe) {
                $(outer).click(() => this.callbacks.uiRequestSyncWithUser(user.Id));
            }

            outer.appendTo(userResults);
        }

    }

    public userNameChange(name_input) {
        name_input.hide();
        $("#div_inner_user_results").show();
        this.callbacks.uiNameChange(name_input.val());
    }

    public onChatMessage(userName: string, msg: string, color: string) {
        //TODO: color stuff
        var ul_chat = $("#ul_chat");
        var html = '<li tabindex="1" class="chat"><span style="margin: 0; color: ' + color + ';">' + userName + ': </span><span>' + msg + '</span></li>';
        ul_chat.append(html);
        ul_chat.children().last().focus();
    }
}