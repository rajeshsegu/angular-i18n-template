(function () {
    "use strict";

    var walk = require('walk'),
        fs = require('fs'),
        jsdom = require('jsdom'),
        i18nJSON = require('./i18n.json'),
        walker, templatesPath;

    templatesPath = i18nJSON.templates;

    console.log("PATH:" + templatesPath);
    walker = walk.walk(templatesPath, {
        followLinks: false
        // directories with these keys will be skipped
        ,
        filters: [".DS_Store", ".git"]
        //fyi, to delete all .DS_Store files, use  "find . -name '*.DS_Store' -type f -delete" terminal command
    });

    walker.on("names", function (root, nodeNamesArray) {
        nodeNamesArray.sort(function (a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        });
    });

    walker.on("directories", function (root, dirStatsArray, next) {
        // dirStatsArray is an array of `stat` objects with the additional attributes
        // * type
        // * error
        // * name

        //console.log("+"+dirStatsArray[0].name);    
        next();
    });

    walker.on("file", function (root, fileStats, next) {
        if (fileStats.name.indexOf(".html") == -1) {
            next();
        }

        var fileNamePath = root + '/' + fileStats.name,
            relativeFileNamePath = fileNamePath.replace(templatesPath, "");
        fs.readFile(fileNamePath, "utf-8", function (err, data) {
            jsdom.env(data, ["http://code.jquery.com/jquery.js"], function (errors, window) {

                if(errors || !window.$){
                    return;
                }
                
                //Explore options to use *Sizzle.getText*jquery.js
                //Handle SCRIPT tags
                window.$("script[type='text/ng-template']").each(function (index, script) {
                    window.$("body").append(window.$(script).html());
                });
                window.$("script[type='text/ng-template']").remove();

                //Handle PLACEHOLDER
                window.$("input[placeholder]").each(function (index, input) {
                    var placeholder = window.$(input).attr("placeholder");
                    window.$("body").append("<span>" + placeholder + "</span>");
                });

                //Handle VALUE
                window.$("input[value]").each(function (index, input) {
                    var value = window.$(input).attr("value");
                    window.$("body").append("<span>" + value + "</span>");
                });
                
                //Handle TITLE
                window.$("*[title]").each(function (index, el) {
                    var title = window.$(el).attr("title");
                    //console.log("TITLE:"+title);
                    window.$("body").append("<span>" + title + "</span>");
                });

                var htmlText = window.$('body').text(),
                    tmp;

                //Strip Translated WEBUIMSG
                htmlText = htmlText.replace(/{{([^}]*)}}/g, "");
                //Strip Close Button
                htmlText = htmlText.replace(/x/g, "");
                //Strip White Spaces
                tmp = htmlText.replace(/\s+/g, "");

                //Beautify RESULT
                htmlText = htmlText.trim().replace(/\s+/g, ", ");
                console.log(relativeFileNamePath);
                if (tmp) {                    
                    console.log("===>" + htmlText);
                } else {
                    console.log(" -- PASS -- ");
                }

            });

            next();
        });
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
        next();
    });

    walker.on("end", function () {
        //console.log("all done");
    });
}());