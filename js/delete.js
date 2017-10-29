/*=====================================*/
/*Name: delete.js*/
/*Description: Functions to support the manual deletion of elements*/
/*Sorted: Alphabetically*/
/*List of functions:
    -adaptControlledGenerators
    -deleteImage
    -deleteObject
    -highlightElement
    -removeElement
    -setRemovalMode
    -unsetRemovalMode
*/
/*=====================================*/


/*Sometimes, after removing an element, it's necessary to adjust (or even remove!) some controlled generators, if we want to keep them in a consistent state. For example, if we have a generator whose expression is 3V4_5, removing the point 4 must cause the deletion of the controlled gen. too, as it lost its controller. On the contrary, removal of point 1 cause a shift in point indexes, so it should become 3V3_4.*/
function adaptControlledGenerators(id, type) {
    "use strict";
    var i, element, controller_id, to_remove = [];
    switch (type) {
    /*If the removed element was a point, controlled generators involving that point (or points with higher ID) must be adjusted or removed.*/
    case "point":
        for (i = 0; i < branches.length; ++i) {
            switch (branches[i].T) {
            case "voltagealpha":
            case "currentbeta":
                /*Marks the generators to remove, making a list of them, but doesn't remove them immediately!*/
                if (branches[i].VA === id || branches[i].VB === id) {   //if the controller was removed
                    to_remove.push(i);
                }
                /*Adapts the generators involving higher ID than the removed point.*/
                if (branches[i].VA > id) {
                    --branches[i].VA;
                }
                if (branches[i].VB > id) {
                    --branches[i].VB;
                }
                branches[i].expression = branches[i].V_DC + "V" + branches[i].VA + "_" + branches[i].VB;
                element = document.getElementById("testolinea" + i);
                element.textContent = branches[i].expression + ((branches[i].T === "voltagealpha") ? "V" : "A");
                break;
            case "voltagebeta":
            case "currentalpha":
                controller_id = branches[i].I;
                branches[i].expression = branches[i].V_DC + "I" + branches[controller_id].point1ID + "_" + branches[controller_id].point2ID;
                element = document.getElementById("testolinea" + i);
                element.textContent = branches[i].expression + ((branches[i].T === "voltagebeta") ? "V" : "A");
                break;
            }
        }
        /*Finally deletes the previously marked elements. Note that it also performs another nested adapt-check, since other generators may depend on the one we might have just removed.*/
        to_remove.sort(function (a, b) {return b - a; });    //sorts in desc. order, so as to keep consistent the indexes stored in the array in the removal process here below. 
        for (i = 0; i < to_remove.length; ++i) {
            deleteImage(to_remove[i], "line");
            deleteObject(to_remove[i], "line");
            adaptControlledGenerators(to_remove[i], "line");
        }
        break;
    /*If the removed element was a line, controlled generators involving that line (or lines with higher ID) must be adjusted or removed.*/
    case "line":
        for (i = 0; i < branches.length; ++i) {
            switch (branches[i].T) {
            case "voltagebeta":
            case "currentalpha":
                if (branches[i].I === id) {
                    to_remove.push(i);
                }
                if (branches[i].I > id) {
                    --branches[i].I;
                }
                break;
            }
        }
        to_remove.sort(function (a, b) {return b - a; });
        for (i = 0; i < to_remove.length; ++i) {
            deleteImage(to_remove[i], "line");
            deleteObject(to_remove[i], "line");
            adaptControlledGenerators(to_remove[i], "line");
        }
        break;
    }
}

/*Deletes the graphic representation of a component in the drawing board.*/
function deleteImage(id, type) {
    "use strict";
    var element, i;
    switch (type) {
    case "point":
        /*deletes the circle*/
        element = document.getElementById("punto" + id);
        element.parentNode.removeChild(element);
        /*deletes its label*/
        element = document.getElementById("testopunto" + id);
        element.parentNode.removeChild(element);
        /*adapts the id of subsequent points*/
        for (i = id + 1; i < Point.cur_ID; ++i) {
            element = document.getElementById("punto" + i);
            element.setAttribute("id", "punto" + (i - 1));
            element = document.getElementById("testopunto" + i);
            element.textContent = i - 1;
            element.setAttribute("id", "testopunto" + (i - 1));
        }
        break;
    case "line":
        /*deletes the lines*/
        element = document.getElementById("linea" + id + "a");
        element.parentNode.removeChild(element);
        element = document.getElementById("linea" + id + "b");
        element.parentNode.removeChild(element);
        /*deletes the label*/
        element = document.getElementById("testolinea" + id);
        element.parentNode.removeChild(element);
        /*deletes the symbol*/
        element = document.getElementById("symbol" + id);
        element.parentNode.removeChild(element);
        /*adapts the id of subsequent lines*/
        for (i = id + 1; i < Line.cur_ID; ++i) {
            element = document.getElementById("linea" + i + "a");
            element.setAttribute("id", "linea" + (i - 1) + "a");
            element = document.getElementById("linea" + i + "b");
            element.setAttribute("id", "linea" + (i - 1) + "b");
            element = document.getElementById("testolinea" + i);
            element.setAttribute("id", "testolinea" + (i - 1));
            element = document.getElementById("symbol" + i);
            element.setAttribute("id", "symbol" + (i - 1));
        }
        break;
    }
}

/*Deletes and object given its index in the list and type*/
function deleteObject(id, type) {
    "use strict";
    var i, j;
    switch (type) {
    case "point":
        nodes.splice(id, 1);
        //decrease the id of subsequent points
        for (i = id; i < nodes.length; ++i) {
            --nodes[i].id;
        }
        //adapt the point1ID and point2ID of each line, where needed
        for (i = 0; i < branches.length; ++i) {
            if (branches[i].point1ID > id) {
                --branches[i].point1ID;
            }
            if (branches[i].point2ID > id) {
                --branches[i].point2ID;
            }
        }
        //decrease the counter of points
        --Point.cur_ID;
        break;
    case "line":
        checkIfLastACGenerator(id);
        checkIfLastDCGenerator(id);
        branches.splice(id, 1);
        //decrease the id of subsequent branches
        for (i = id; i < branches.length; ++i) {
            --branches[i].id;
        }
        //adapt the branches array of each point, where needed
        for (i = 0; i < nodes.length; ++i) {
            for (j = 0; j < nodes[i].branches.length; ++j) {
                if (nodes[i].branches[j] === id) {
                    nodes[i].branches.splice(j, 1);
                    --j;
                    continue;
                }
                if (nodes[i].branches[j] > id) {
                    --nodes[i].branches[j];
                }
            }
        }
        //decrease the counter of lines
        --Line.cur_ID;
        break;
    }
    //adjusts controlled generators to the recent changes
    adaptControlledGenerators(id, type);
}

/*Highlights an element with a specific color. This can be also used to un-highlight, just by passing the default color as argument.*/
function highlightElement(id, type, color) {
    "use strict";
    var i, idnumber, element;
    switch (type) {
    case "point":
        element = document.getElementById(id);
        element.setAttributeNS(null, "stroke", color);
        idnumber = parseInt(id.substr(5), 10);
        //highlights adjacent lines too
        for (i = 0; i < branches.length; ++i) {
            if (branches[i].point1ID === idnumber || branches[i].point2ID === idnumber) {
                highlightElement("linea" + i + "a", "line", (color === "red") ? "red" : "#787878");
                highlightElement("linea" + i + "b", "line", (color === "red") ? "red" : "#787878");
            }
        }
        break;
    case "line":
    case "symbol":
        idnumber = parseInt(id.substr((type === "line") ? 5 : 6), 10);  //line id begins with "linea", symbol with "symbol"
        element = document.getElementById("linea" + idnumber + "a");
        element.setAttributeNS(null, "stroke", color);
        element.setAttributeNS(null, "stroke-width", ((color === "red") ? "4px" : "1.5px"));
        element = document.getElementById("linea" + idnumber + "b");
        element.setAttributeNS(null, "stroke", color);
        element.setAttributeNS(null, "stroke-width", ((color === "red") ? "4px" : "1.5px"));
        break;
    }
}

/*Removes the selected element and, eventually, the adjacent ones. This function is a high-level one, as it relies on other subfunctions to effectively perform these operations.*/
function removeElement(id, type) {
    "use strict";
    var i, j, idnumber, element;
    //Ask the user if he really wants to remove
    if (!confirm("Are you sure you want to remove this element?")) {
        return;
    }
    switch (type) {
    case "point":
        idnumber = parseInt(id.substr(5), 10);
        deleteImage(idnumber, "point");
        //delete adjacent lines
        for (i = 0; i < branches.length; ++i) {
            if (branches[i].point1ID === idnumber || branches[i].point2ID === idnumber) {
                deleteImage(i, "line");
                deleteObject(i, "line");
                //after deleting the line, we must check again the same index in branches, as it shifted
                --i;
            }
        }
        /*Deletes the node as object*/
        deleteObject(idnumber, "point");
        break;
    case "line":
    case "symbol":
        /*Find the id number of the line to be removed*/
        idnumber = parseInt(id.substr((type === "line") ? 5 : 6), 10);  //line id begins with "linea", symbol with "symbol"
        deleteImage(idnumber, "line");
        /*Deletes the branch as object*/
        deleteObject(idnumber, "line");
        break;
    }
}

/*Enables removal mode, which includes onhover highlighting and onclick actions.*/
function setRemovalMode() {
    "use strict";
    var points, lines, symbols, i;
    points = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle");
    lines = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "line");
    symbols = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "rect");
    
    redpoint = function () {highlightElement(this.id, "point", "red"); };
    blackpoint = function () {highlightElement(this.id, "point", "#111111"); };
    redline = function () {highlightElement(this.id, "line", "red"); };
    blackline = function () {highlightElement(this.id, "line", "#787878"); };
    redsymbol = function () {highlightElement(this.id, "symbol", "red"); };
    blacksymbol = function () {highlightElement(this.id, "symbol", "#787878"); };
    rmpoint = function () {removeElement(this.id, "point"); };
    rmline = function () {removeElement(this.id, "line"); };
    rmsymbol = function () {removeElement(this.id, "symbol"); };
    
    for (i = 0; i < points.length; ++i) {
        /*enable highlighting of points on mouseover*/
        points[i].addEventListener("mouseover", redpoint, false);
        points[i].addEventListener("mouseout", blackpoint, false);
        /*enable removal of point on mouseclick*/
        points[i].addEventListener("click", rmpoint, false);
    }
    for (i = 0; i < lines.length; ++i) {
        /*enable highlighting of lines on mouseover*/
        lines[i].addEventListener("mouseover", redline, false);
        lines[i].addEventListener("mouseout", blackline, false);
        /*enable removal of line on mouseclick*/
        lines[i].addEventListener("click", rmline, false);
    }
    for (i = 0; i < symbols.length; ++i) {
        /*enable highlighting of lines on mouseover*/
        symbols[i].addEventListener("mouseover", redsymbol, false);
        symbols[i].addEventListener("mouseout", blacksymbol, false);
        /*enable removal of line on mouseclick*/
        symbols[i].addEventListener("click", rmsymbol, false);
    }
}

/*Disables removal mode.*/
function unsetRemovalMode() {
    "use strict";
    var points, lines, symbols, i;
    points = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "circle");
    lines = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "line");
    symbols = document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "rect");
    
    mouseoverpoint = false;
    
    for (i = 0; i < points.length; ++i) {
        /*disable highlighting of points on mouseover*/
        points[i].removeEventListener("mouseover", redpoint, false);
        points[i].removeEventListener("mouseout", blackpoint, false);
        /*disable removal of point on mouseclick*/
        points[i].removeEventListener("click", rmpoint, false);
    }
    for (i = 0; i < lines.length; ++i) {
        /*disable highlighting of lines on mouseover*/
        lines[i].removeEventListener("mouseover", redline, false);
        lines[i].removeEventListener("mouseout", blackline, false);
        /*disable removal of line on mouseclick*/
        lines[i].removeEventListener("click", rmline, false);
    }
    for (i = 0; i < symbols.length; ++i) {
        /*disable highlighting of lines on mouseover*/
        symbols[i].removeEventListener("mouseover", redsymbol, false);
        symbols[i].removeEventListener("mouseout", blacksymbol, false);
        /*disable removal of line on mouseclick*/
        symbols[i].removeEventListener("click", rmsymbol, false);
    }
}