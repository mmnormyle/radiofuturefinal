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
        this.frameBuilder = new FrameBuilder(mobileBrowser);
        this.callbacks = callbacks;
        this.initialize();
    }

    private initialize() {
        this.setupSpinnerUI();
        this.setupInfoRolloverUI();
        this.setupInputUI();
    }

    public sessionReady = () => {
        $("#div_loading").hide();
        this.spinner.stop();
        $("#div_everything").animate({opacity: 1}, 'fast');
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

    private dropperSwitch(dropper: JQuery) {
        if (dropper.hasClass('arrow-down')) {
            dropper.removeClass('arrow-down');
            dropper.addClass('arrow-up');
        }
        else {
            dropper.removeClass('arrow-up');
            dropper.addClass('arrow-down');
        }
    }

    private setupFadeUI(overall: JQuery, results) {
        overall.mouseenter((e) => {
            if (!results.is(':visible')) {
                results.fadeIn();
                let dropper = overall.find('.dropper');
                this.dropperSwitch(dropper);
            }
        });
        overall.mouseleave((e) => {
            if (results.is(':visible')) {
                results.fadeOut();
                let dropper = overall.find('.dropper');
                this.dropperSwitch(dropper);
            }
        });
    }

    private setupInfoRolloverUI() {
        if (!this.mobileBrowser) {
            this.setupFadeUI($("#div_users_overall"), $("#div_user_results"));
            this.setupFadeUI($("#div_queue_overall"), $("#div_queue_results"));
            this.setupFadeUI($("#div_chat_overall"), $("#div_chat_results"));
            this.setupFadeUI($("#div_cc_overall"), $("#div_cc_results"));
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
        jQuery(document.body).on("click", ":not(#div_search_results, #div_search_results *)", (event) => {
            $("#div_search_results").fadeOut();
            $("#input_search").val("");
        });​​​​​​​
        $("#input_search").bind("propertychange input paste", (event) => {
            this.searchTextChanged($("#input_search").val());
        });
    }

    public onSearchResults(results: Media[]) {
        var divResults = $("#div_search_results");
        divResults.show();
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
                this.callbacks.uiQueueMedia(media);
            });
        }
        if (results.length == 0) {
            var divResults = $("#div_search_results");
            divResults.html("");
            divResults.html("<p id='p_searching'>no results found, or something screwed up</p>");
            divResults.fadeIn();
        }
        // TODO: this doesnt have to be added every time
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

        $("#input_search").blur();
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
            summary = "Nothing in the playlist. Queue something!";
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
            imgThumb.src = media.ThumbURL;
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
            var spanDescription = document.createElement('p');
            $(spanDescription).addClass('result_description');
            $(spanDescription).appendTo(innerDiv);
            $(spanDescription).html(media.Description);
            var deleteX = document.createElement('span');
            $(deleteX).text('X');
            $(deleteX).addClass('span_delete');
            $(deleteX).click(() => {
                this.callbacks.uiDeleteMedia(media.Id, i);
            });
            $(deleteX).appendTo(divQueueResult);
            if (queuePosition == i) {
                $(divQueueResult).css({
                    "border-color": "#ffa79c",
                    "border-width": "2px",
                    "border-style": "solid"
                });
            }
        }
   }


    public updateUsersList(users, userIdMe: number) {
        var num = users.length;
        var summary = users.length + " users listening";
        if (num == 1) {
            summary = users.length + " user listening";
        }
        $("#p_users_summary").text(summary);
        var userResults = $("#div_user_results");
        var html = [];
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var thisIsMe = (user.Id === userIdMe);
            var currentHTML = this.frameBuilder.user(this.colors[i % this.colors.length], user.Id, user.Name, thisIsMe);
            html.push(currentHTML);
        }
        userResults.html(html.join(""));
    }

    public userNameChange(name_input) {
        name_input.hide();
        $("#input_search").fadeIn();
        this.callbacks.uiNameChange(name_input.val());
    }

    public onChatMessage(userName: string, msg: string, color: string) {
        //TODO: color stuff
        var ul_chat = $("#ul_chat");
        var html = '<li class="chat"><span style="margin: 0; color: ' + color + ';">' + userName + ': </span><span>' + msg + '</span></li>';
        ul_chat.append(html);
        if (ul_chat.length >= 10) {
            ul_chat.children()[0].remove(); 
        }
    }
}