// ==UserScript==
// @name         Quest Unofficial Transcript Reordering
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  To make the undergraduate transcript reverse chronological instead of chronological
// @author       Thomas Dedinsky
// @match        https://quest.pecs.uwaterloo.ca/psc/SS/view/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(function() {
        var pages = document.getElementsByClassName("page");
        //Sections are the term sections (confusing name, indeed), headings are the top sections, extras are the extra sections (e.g. milestones)
        var sections = new Array(50);
        var headings = new Array(pages.length);
        var extras = new Array(5);
        var sectionNum = -1;
        var isExtra = false;
        var extraNum = 0;
        var sectionGap = 0;
        var elementCounter = 0;
        var pageNum = 0;
        //Storing the data, page by page
        for (pageNum = 0; pageNum < pages.length; pageNum++) {
            var elements = pages[pageNum].getElementsByClassName("textLayer")[0].getElementsByTagName("div");
            var isSection = false;
            elementCounter = 0;
            headings[pageNum] = new Array(25); //The array sizes are a bit generous, but make it so I don't have to deal with dynamic array allocation
            for (var pageElement = 0; pageElement < elements.length - 1; pageElement++, elementCounter++){
                //The purpose of the elementCounter is to properly iterate through a section indexing from 0 for storing purposes
                var element = elements[pageElement];
                //This is to check the start of an extra section if it happens to go onto a new page
                if (isExtra && !isSection && pageElement > 5 && pageNum != 0 && headings[0][elementCounter][0] != element.textContent) {
                    isSection = true;
                    elementCounter = 0;
                    extraNum++;
                }
                //This checks the start of the extra sections; meaning the term sections are finished
                if (element.textContent == "Milestones") {
                    isSection = true;
                    isExtra = true;
                    elementCounter = 0;
                    extras[extraNum] = new Array(100);
                }
                //This checks the start of a term section
                if (element.textContent.split(" ").length == 2 && (element.textContent.split(" ")[0] == "Fall" || element.textContent.split(" ")[0] == "Winter" || element.textContent.split(" ")[0] == "Spring") && element.textContent.split(" ")[1].length == 4 && (element.textContent.split(" ")[1].split("")[0] == "2" && element.textContent.split(" ")[1].split("")[1] == "0")) {
                    if (sectionNum == -1) {
                        sectionGap = parseFloat(element.style.top) - parseFloat(elements[pageElement-1].style.top);
                    }
                    isSection = true;
                    sectionNum++;
                    elementCounter = 0;
                    sections[sectionNum] = new Array(100);
                }
                //Storing the actual html into 3-d arrays
                //Note that the font-family and sizes are the same for every element, so it's pointless to store them
                if (isSection && !isExtra) {
                    sections[sectionNum][elementCounter] = [element.textContent, element.style.left, element.style.top, element.style.transform];
                } else if (isExtra) {
                    extras[extraNum][elementCounter] = [element.textContent, element.style.left, element.style.top, element.style.transform];
                } else {
                    headings[pageNum][elementCounter] = [element.textContent, element.style.left, element.style.top, (element.textContent == "Undergraduate Unofficial Transcript" ? "scaleX(" + (parseFloat(element.style.transform.substring(7)) + 0.155).toString() + ")" : element.style.transform)];
                }
            }
        }
        //Now we're reading and outputing html
        var sectionOffset = 0;
        var extraCounter = 0;
        for (pageNum = 0; pageNum < pages.length; pageNum++) {
            var maxHeight = parseFloat(pages[pageNum].getElementsByClassName("textLayer")[0].style.height);
            var currentHeight = 0;
            var html = '';
            //Html for the top sections
            for (elementCounter = 0; headings[pageNum][elementCounter] != null; elementCounter++) {
                html += '<div style="left: ' + headings[pageNum][elementCounter][1] + '; top: ' + headings[pageNum][elementCounter][2] + '; font-size: 13.3333px; font-family: sans-serif; color: #000; transform: ' + headings[pageNum][elementCounter][3] + ';">' + headings[pageNum][elementCounter][0] + '</div>\n';
            }
            currentHeight = parseFloat(headings[pageNum][elementCounter-1][2]);
            var tooHigh = false;
            //Making sure we don't go over the height limit
            while (!tooHigh) {
                var height = 0;
                var minHeight = 0;
                //The term sections output
                if (sectionOffset <= sectionNum) {
                    minHeight = parseFloat(sections[sectionNum - sectionOffset][0][2]);
                    for (elementCounter = 0; sections[sectionNum - sectionOffset][elementCounter] != null; elementCounter++) {}
                    //Getting the height of the block
                    height = parseFloat(sections[sectionNum - sectionOffset][elementCounter-1][2]) - minHeight;
                    if (currentHeight + sectionGap + height < maxHeight) {
                        currentHeight += sectionGap;
                        //Html for the term sections
                        for (elementCounter = 0; sections[sectionNum - sectionOffset][elementCounter] != null; elementCounter++) {
                            html += '<div style="left: ' + sections[sectionNum - sectionOffset][elementCounter][1] + '; top: ' + (parseFloat(sections[sectionNum - sectionOffset][elementCounter][2]) - minHeight + currentHeight).toString() + 'px; font-size: 13.3333px; font-family: sans-serif; color: #000; transform: ' + sections[sectionNum - sectionOffset][elementCounter][3] + ';">' + sections[sectionNum - sectionOffset][elementCounter][0] + '</div>\n';
                        }
                        currentHeight += height;
                        sectionOffset++;
                    } else {
                        tooHigh = true;
                    }
                //The extra sections output
                } else if (extraCounter <= extraNum) {
                    minHeight = parseFloat(extras[extraCounter][0][2]);
                    for (elementCounter = 0; extras[extraCounter][elementCounter] != null; elementCounter++) {}
                    //Getting the height of the block
                    height = parseFloat(extras[extraCounter][elementCounter-1][2]) - minHeight;
                    if (currentHeight + sectionGap + height < maxHeight) {
                        currentHeight += sectionGap;
                        //Html for the extra sections
                        for (elementCounter = 0; extras[extraCounter][elementCounter] != null; elementCounter++) {
                            html += '<div style="left: ' + extras[extraCounter][elementCounter][1] + '; top: ' + (parseFloat(extras[extraCounter][elementCounter][2]) - minHeight + currentHeight).toString() + 'px; font-size: 13.3333px; font-family: sans-serif; color: #000; transform: ' + extras[extraCounter][elementCounter][3] + ';">' + extras[extraCounter][elementCounter][0] + '</div>\n';
                        }
                        currentHeight += height;
                        extraCounter++;
                    }
                } else {
                    tooHigh = true;
                }
            }
            //Outputting the html
            //Unfortunately, despite the inspect element showing the new html, the actual page shows the old html
            //TODO: Investigate this issue
            html += '<div class="endOfContent"></div>';
            //console.log(html);
            pages[pageNum].innerHTML = '\n<div class="textLayer" style="width: ' + pages[pageNum].getElementsByClassName("textLayer")[0].style.width + '; height: ' + pages[pageNum].getElementsByClassName("textLayer")[0].style.height + '; opacity: 1">\n' + html + '</div>\n';
        }
    }, 3000);
})();