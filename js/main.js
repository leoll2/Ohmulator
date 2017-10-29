/*=====================================*/
/*Name: main.js*/
/*Description: This file contains some generic but fundamental functions, such as initialization and reset.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -begin
    -clickHandler
    -reset
    -run
*/
/*=====================================*/

/*This function gets executed after the page has been loaded. It's mostly used to initialize things.*/
function begin() {
    "use strict";
    var drawingboard = document.getElementById("drawingboard"),
        rectbuttons = document.getElementsByClassName("rectbutton"),
        i;
    
    /*Initialization of variables and properties*/
    dc_analysis = false;        //no kind of analysis is required at the beginning
    ac_analysis = false;
    omega = null;               //omega is set to null, as no AC generators are present at the beginning
    mouseoverpoint = false;     //mouseoverpoint is set to false, as the point can't be already on a point
    drawrectangle = drawingboard.getBoundingClientRect();   //initialize the drawing rectangle with the current size of the window
    changetool = function() {changeTool(this); };            //function to handle switching between tools
    buttonel = document.getElementById("resistorbutton");   //the selected button is the "resistor" at the beginning...
    selected_tool_name = "resistor";
    buttonel.style.backgroundColor = "orange";              //...and it's highlighted
    //Creates the SVG filters
    createFilters();
    //Adds events to elements
    drawingboard.onclick = function (e) {clickHandler(e); };    //handles the click on the drawing board
    for (i = 0; i < rectbuttons.length; ++i) {                  //handles the clicks on tool buttons
        rectbuttons[i].onclick = changetool;
    }
}

/*This function handles the clicks on the drawing board, which usually occur when the user is drawing the circuit. Since drawing a line requires two clicks, it's necessary to distinguish between "first" clicks and "second" clicks: here comes the property firstclick.
Also, it needs to retrieve the information about the position of the click. Finally, it invokes the appropriate action for the click, which may be, for example, plotting a line.*/
function clickHandler(evt) {
    "use strict";
    var x_click, y_click, valuestring;
    evt = (!evt) ? window.event : evt;  //for Internet Explorer
    
    /*Computes the x and y coordinates of the click, adjusts them when the user wants to click on an already existing point*/
    x_click = (mouseoverpoint === true) ? mouseoverpointX : (evt.clientX - drawrectangle.left + window.scrollX);
    y_click = (mouseoverpoint === true) ? mouseoverpointY : (evt.clientY - drawrectangle.top + window.scrollY);
    
    /*Handles the click depending on the selected tool*/
    switch (selected_tool_name) {
    //if the click happens while removing, just make sure to reset the firstclick property
    case "remove":
        clickHandler.firstclick = false;
        return;
    case "node":
        clickHandler.firstclick = false;
        addPoint(x_click, y_click);
        drawPoint(x_click, y_click);
        return;
    default:
        clickHandler.firstclick = !clickHandler.firstclick;     //it's always a first or second click, each time it reverses
        if (clickHandler.firstclick === false) {                //adds and draws (if possible) the element after the second click in the board
            clickHandler.id2 = addPoint(x_click, y_click);      //adds the (object of the) second point of the element...
            drawPoint(x_click, y_click);                        //...and draws it
            clickHandler.x2 = x_click;
            clickHandler.y2 = y_click;
            if (clickHandler.x1 !== clickHandler.x2 || clickHandler.y1 !== clickHandler.y2) {   //begin and end of a line shouldn't be the same point
                valuestring = document.getElementById("valuebutton").value;     //user input for the value of the element
                if (addLine(clickHandler.x1, clickHandler.y1, clickHandler.x2, clickHandler.y2, clickHandler.id1, clickHandler.id2, selected_tool_name, valuestring)) {   //if adding the line doesn't result in an error, it draws it too.
                    drawLine(clickHandler.x1, clickHandler.y1, clickHandler.x2, clickHandler.y2, selected_tool_name, valuestring);
                }
            }
        } else {        //if it's the first click in the board (that is the beginning of a line)
            clickHandler.id1 = addPoint(x_click, y_click);      //adds the (object of the) first point of the element...
            drawPoint(x_click, y_click);                        //...and draws it
            clickHandler.x1 = x_click;
            clickHandler.y1 = y_click;
        }
    }
}

/*Resets the drawing board and objects.*/
function reset() {
    "use strict";
    /*Clears the shapes in the drawing board.*/
    var shapes_to_delete = document.getElementsByClassName("shape");
    while (shapes_to_delete[0]) {
        shapes_to_delete[0].parentNode.removeChild(shapes_to_delete[0]);
    }
    
    clickHandler.firstclick = false;
    Point.cur_ID = 0;
    Line.cur_ID = 0;
    //Empties the objects arrays.
    nodes.length = 0;
    branches.length = 0;
    dc_analysis = false;
    ac_analysis = false;
    omega = null;
    unsetRemovalMode();
}

/*This function is executed when the user clicks on the "run" button. It performs preliminary checks on the topology of the circuit, trying to identify "pathological" configurations and errors, then effectively solves the circuit if possible.*/
function run() {
    "use strict";
    var voltagesAC = [], currentsAC = [], voltagesDC = [], currentsDC = [], i;
    /*divbyzero tracks eventual divisions by zero that may happen while solving. The only situations (except bugs, hopefully none) where we expect to trigger div by zero are disconnected topologies, or eventually almost-disconnected (only 1 branch connecting two blocks). Ohmulator is perfectly able to handle this situation, but still warns the user.*/
    divbyzero = false;
    //If it needs to perform an AC analysis, first makes sure that no voltage cycles or impossible nodes are present.
    if (ac_analysis === true) {
        //No nodes with only current sources allowed
        if (!findNodesOnlyCurrentsAC()) {
            window.alert("Error: There cannot be nodes with only current sources!");
            return;
        }
        //No loops of voltages and short circuits allowed
        if (!findConnectedComponents("voltage", "ac")) {    //findConnectedComponents also updates the partition property of the Node objects
            window.alert("Error: There is a loop of voltage generators and/or short circuits!");
            return;
        }
        //Find the voltages and currents of AC analysis
        voltagesAC = solveAC();
        currentsAC = calculateCurrentsAC(voltagesAC);
    } else {
        //if AC analysis wasn't needed, both AC voltages and currents are set to 0.
        for (i = 0; i < Point.cur_ID - 1; ++i) {
            voltagesAC[i] = new Complex(0, 0);
        }
        for (i = 0; i < Line.cur_ID; ++i) {
            currentsAC[i] = new Complex(0, 0);
        }
    }
    //If it needs to perform an DC analysis, first makes sure that no voltage loops or impossible nodes are present.
    if (dc_analysis === true) {
        //No nodes with only current sources or capacitors allowed
        if (!findNodesOnlyCurrentsDC()) {
            window.alert("Error: There are nodes with only current sources and/or capacitors!");
            return;
        }
        //No loops of voltages and short circuits allowed
        if (!findConnectedComponents("voltage", "dc")) {    //findConnectedComponents also updates the partition property of the Node objects
            window.alert("Error: There is a loop of voltage generators and/or short circuits!");
            return;
        }
        //Find the voltages and currents of DC analysis
        voltagesDC = solveDC();
        currentsDC = calculateCurrentsDC(voltagesDC);
    } else {
        //if DC analysis wasn't needed, both AC voltages and currents are set to 0.
        for (i = 0; i < Point.cur_ID - 1; ++i) {
            voltagesDC[i] = 0;
        }
        for (i = 0; i < Line.cur_ID; ++i) {
            currentsDC[i] = 0;
        }
    }
    /*Extends the currents array to include the indexes of the points too. This is useful for sorting (output formatting)*/
    for (i = 0; i < Line.cur_ID; ++i) {
        currentsDC[i] = [currentsDC[i], branches[i].point1ID, branches[i].point2ID];
        currentsAC[i] = [currentsAC[i], branches[i].point1ID, branches[i].point2ID];
    }
    /*Prints the result in a new window*/
    showResult(voltagesDC, voltagesAC, currentsDC, currentsAC);
}