/*=====================================*/
/*Name: graphics.js*/
/*Description: Implementation of the graphical interface for circuit drawing.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -createFilters
    -drawLine
    -drawPoint
    -generateLabel
    -resize
*/
/*=====================================*/


/*Generates the SVG filters used to display components symbols in the drawing board.*/
function createFilters() {
    "use strict";
    var filter, feimage, i, drawingboard;
    
    drawingboard = document.getElementById("drawingboard");
    for (i = 0; i < filters.length; ++i) {
        filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("class", "filters");
        filter.setAttribute("id", filters[i][0]);
        filter.setAttribute("x", "0%");
        filter.setAttribute("y", "0%");
        filter.setAttribute("width", "100%");
        filter.setAttribute("height", "100%");
        feimage = document.createElementNS("http://www.w3.org/2000/svg", "feImage");
        feimage.setAttributeNS("http://www.w3.org/1999/xlink", "href", "img/" + filters[i][1] + ".png");
        filter.appendChild(feimage);
        drawingboard.appendChild(filter);
    }
}

/*Draws a line in the board.*/
function drawLine(x1, y1, x2, y2, tool, valuestring) {
    "use strict";
    var drawingboard = document.getElementById("drawingboard"),
        angleRadians = Math.atan2(y2 - y1, x2 - x1),        //this angle is used to rotate the label
        newline = document.createElementNS("http://www.w3.org/2000/svg", "line"),
        newrectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
        newtext = document.createElementNS("http://www.w3.org/2000/svg", "text"),
        textnode = document.createTextNode(generateLabel(tool, valuestring));
    /*Each branch is made of 3 parts: an image (component symbol) in the middle, and two lines connecting that image to the nodes.*/
    newline.setAttribute("class", "shape");
    newline.setAttribute("id", "linea" + (Line.cur_ID - 1) + "a");
    newline.setAttribute("x1", x1);
    newline.setAttribute("y1", y1);
    newline.setAttribute("x2", (0.5 * (x1 + x2 - 40 * Math.cos(angleRadians))));
    newline.setAttribute("y2", (0.5 * (y1 + y2 - 40 * Math.sin(angleRadians))));
    newline.setAttribute("stroke", "rgb(120,120,120)");
    newline.setAttribute("stroke-width", "1.5");
    //the lines are added in the DOM before labels, and consequently before circles. This is to prevent overlapping issues.
    drawingboard.insertBefore(newline, drawingboard.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")[0]);
    
    newline = document.createElementNS("http://www.w3.org/2000/svg", "line");
    newline.setAttribute("class", "shape");
    newline.setAttribute("id", "linea" + (Line.cur_ID - 1) + "b");
    newline.setAttribute("x1", 0.5 * (x1 + x2 + 40 * Math.cos(angleRadians)));
    newline.setAttribute("y1", 0.5 * (y1 + y2 + 40 * Math.sin(angleRadians)));
    newline.setAttribute("x2", x2);
    newline.setAttribute("y2", y2);
    newline.setAttribute("stroke", "rgb(120,120,120)");
    newline.setAttribute("stroke-width", "1.5");
    drawingboard.insertBefore(newline, drawingboard.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")[0]);
    
    newrectangle.setAttribute("class", "shape");
    newrectangle.setAttribute("id", "symbol" + (Line.cur_ID - 1));
    newrectangle.setAttribute("width", 40);
    newrectangle.setAttribute("height", 40);
    newrectangle.setAttribute("x", 0.5 * (x1 + x2 - 40));
    newrectangle.setAttribute("y", 0.5 * (y1 + y2 - 40));
    newrectangle.setAttribute("filter", "url(#" + tool + ")");
    newrectangle.setAttribute("transform", "rotate(" + ((angleRadians) * 180 / Math.PI) + ", " + (0.5 * (x1 + x2)) + ", " + (0.5 * (y1 + y2)) + ")");
    drawingboard.insertBefore(newrectangle, drawingboard.getElementsByTagNameNS("http://www.w3.org/2000/svg", "line")[0]);
    
    /*Adds a label to the branch*/
    newtext.setAttribute("class", "shape svgtext");
    newtext.setAttribute("id", "testolinea" + (Line.cur_ID - 1));
    newtext.setAttribute("x", ((x1 + x2) / 2) - 3 * valuestring.length);
    newtext.setAttribute("y", ((y1 + y2) / 2) - 18);
    newtext.setAttribute("transform", "rotate(" + ((Math.abs(angleRadians * 180 / Math.PI) <= 90) ? (angleRadians * 180 / Math.PI) : (180 + angleRadians * 180 / Math.PI)) + ", " + (0.5 * (x1 + x2)) + ", " + (0.5 * (y1 + y2)) + ")");
    newtext.setAttribute("style", "font-family: Calibri; font-size: 12px; stroke: #333333;");
    newtext.appendChild(textnode);
    drawingboard.insertBefore(newtext, drawingboard.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle")[0]);
}

/*Draws a point in the board.*/
function drawPoint(x, y) {
    "use strict";
    var drawingboard, newtext, newcircle, textnode;
    
    if (mouseoverpoint) {return; }       //if there's already a point at the specified position, don't draw another.
    drawingboard = document.getElementById("drawingboard");
    /*Creates a new circle element with appropriate attributes.*/
    newcircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    newcircle.setAttribute("class", "shape");
    newcircle.setAttribute("id", "punto" + (Point.cur_ID - 1));   //-1 perchè viene drawto dopo che il contatore è aumentato
    newcircle.setAttribute("cx", x);
    newcircle.setAttribute("cy", y);
    newcircle.setAttribute("r", 5);
    newcircle.setAttribute("stroke", "#111111");
    newcircle.setAttribute("stroke-width", 4);
    newcircle.setAttribute("fill", "#00F7FF");
    /*Highlighting on mouseover, to ease the mouse selection of points for the user.*/
    newcircle.onmouseover = function () {
        newcircle.setAttribute("r", 10);
        mouseoverpoint = true;
        mouseoverpointID = parseInt(newcircle.getAttribute("id").substr(5), 10);
        mouseoverpointX = parseFloat(newcircle.getAttribute("cx"));
        mouseoverpointY = parseFloat(newcircle.getAttribute("cy"));
    };
    newcircle.onmouseout = function () {
        newcircle.setAttribute("r", 5);
        mouseoverpoint = false;
    };
    /*Inserts the element in the DOM, at the end of the drawingboard section.*/
    drawingboard.appendChild(newcircle);
    /*Adds a label containing the id of that point.*/
    newtext = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newtext.setAttribute("class", "shape svgtext");
    newtext.setAttribute("id", "testopunto" + (Point.cur_ID - 1));
    newtext.setAttribute("x", x - 15);
    newtext.setAttribute("y", y - 10);
    newtext.setAttribute("style", "font-family: Times New Roman; font-size: 16px; stroke: #004e00; fill: #004e00;");
    textnode = document.createTextNode(Point.cur_ID - 1);
    newtext.appendChild(textnode);
    /*Inserts in the DOM right before the circle elements, in order to prevent SVG overlapping issues which may inhibit the selection/removal of nodes.*/
    drawingboard.insertBefore(newtext, drawingboard.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle")[0]);
}

/*Generates the appropriate text of branch labels.*/
function generateLabel(tool, valuestring) {
    "use strict";
    switch (tool) {
    case "resistor":
        return valuestring + "Ω";
    case "capacitor":
        return valuestring + "F";
    case "inductor":
        return valuestring + "H";
    case "current":
        return valuestring + "A";
    case "voltage":
        return valuestring + "V";
    case "currentalpha":
        return valuestring + "A";
    case "currentbeta":
        return valuestring + "A";
    case "voltagealpha":
        return valuestring + "V";
    case "voltagebeta":
        return valuestring + "V";
    default:
        return "";
    }
}

/*Updates the drawing board rectangle when the window gets resized, to ensure a consistent placing of the new points on the board*/
function resize() {
    "use strict";
    drawrectangle = document.getElementById("drawingboard").getBoundingClientRect();
}