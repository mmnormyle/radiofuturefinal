﻿import { Media } from "./Contracts";

export class FrameBuilder {

    mobileBrowser: boolean;

    constructor(mobileBrowser: boolean) {
        this.mobileBrowser = mobileBrowser;
    }

    public user(color: string, userId: number, userName: string, thisIsMe: boolean) : string {
        var currentHTML = "";
        var meHtml = thisIsMe ? 'onclick="requestSyncWithUser(' + userId + ')" ' : "";
        var syncHTML = thisIsMe ? 'you' : 'sync';
        var syncHTMLMobile = thisIsMe ? 'you' : 'sync with ' + userName;
        if (this.mobileBrowser) {
            currentHTML = '<div ' + meHtml + 'class="div_user" style="background: ' + color + ';"> ' + syncHTMLMobile + '</div>';
        }
        else {
            currentHTML =
                '<div style="text-align: left; display: flex; align-items: center;">' +
                '<div ' + meHtml + 'style="display: flex; align-items: center; justify-content: center; float: left; cursor: pointer; margin-right: 16px; height: 48px; width: 48px; background: ' + color + ';">' + syncHTML + '</div>' +
                       '<span style="margin-right: 16px; float: right;">' + userName + '</span>' +
                '</div>';
        }
        return currentHTML;
    }

    public media(media: Media, position: number, recommendedByMe: boolean) {
        var currentHTML = ""
        if (this.mobileBrowser) {
            // TODO: add delete UI
            currentHTML = '<img style="float: left; width: 33.33%; height: 20vw;" src="'  + media.ThumbURL + '"/>';
        }
        else {
            currentHTML =
                // TODO: perfect UI
                '<div onclick="deleteMedia(' + media.Id + ', ' + position + ')" style="cursor: click; text-align: left; display: flex; align-items: center;">' +
                    '<img style="height: 90px; width: 160px; margin-right: 16px;" src="' + media.ThumbURL + '"/>' +
                    '<span style="margin-right: 16px;">' + media.VideoTitle + '</span>' +
                '</div>';
        }
        return currentHTML;
    }
}