/*=====================================*/
/*Name: objects.js*/
/*Description: Objects used in the project (points and lines) and functions for their instantiation*/
/*Sorted: Logically*/
/*List of functions:
    -Point
    -Line
    -addPoint
    -addLine
*/
/*=====================================*/

/*The object Point is used to define the nodes belonging to a circuit.*/
function Point(x, y) {
    "use strict";
    this.id = Point.cur_ID;     //identifier
    this.x = x;                 //x coordinate
    this.y = y;                 //y coordinate
    this.branches = [];         //array containing the identifiers of the branches adjacent to the node
    this.partition = 0;         //this is used to find indipendent series of voltage generators (nodal analysis method)
    ++Point.cur_ID;             //each time a node is added, the counter is increased
}

Point.cur_ID = 0;       //the node counter is set to 0 at start

/*The object Line is used to define the branches belonging to a circuit*/
function Line(x1, y1, x2, y2, vdc, vac, t, p1, p2, exp) {
    "use strict";
    this.id = Line.cur_ID;      //identifier
    this.x1 = x1;               //x coordinate of the first point
    this.y1 = y1;               //y coordinate of the first point
    this.x2 = x2;               //x coordinate of the second point
    this.y2 = y2;               //y coordinate of the second point
    this.V_DC = vdc;            //the value of the branch in DC analysis. Always a real number.
    this.V_AC = vac;            //the value of the branch in AC analysis. Always a complex number.
    this.T = t;                 //type of the branch (resistor, current generator, ...)
    this.point1ID = p1;         //identifier of the first point
    this.point2ID = p2;         //identifier of the second point
    this.expression = exp;      //full string of the branch value, exactly as inputted by the user
    ++Line.cur_ID;              //each time a line is added, the counter is increased
}

Line.cur_ID = 0;

/*Creates a new node and returns its identifier.*/
function addPoint(x, y) {
    "use strict";
    if (mouseoverpoint) {           //when the users attempts to create a new node on top of an existing one...
        return mouseoverpointID;    //...nothing happens, except returning the identifier of that node
    }
    var newpoint = new Point(x, y);     //creates a new node
    nodes.push(newpoint);               //adds it to the list
    return Point.cur_ID - 1;            //returns its identifier
}

/*Creates a new branch. Returns true if everything goes fine, false otherwise.*/
function addLine(x1, y1, x2, y2, point1, point2, tool, valuestring) {
    "use strict";
    var vdc, vac, newline, i, p1, p2, fbfp;
    
    /*Checks if the user is trying to draw a line between two points where another line already exists.*/
    for (i = 0; i < Line.cur_ID; ++i) {
        if ((branches[i].point1ID === point1 && branches[i].point2ID === point2) || (branches[i].point1ID === point2 && branches[i].point2ID === point1)) {
            window.alert("You can't draw two or more lines between the same two points!");
            return false;
        }
    }
    
    /*vdc and vac are the values of the line, respectively in DC and AC regime. The meaning of the value varies from component to component. For passive components, it's the impedance, for generators it's the magnitude or its phasor, for controlled generators it represents the factor alpha/beta. Check the functions parseFromGenerator and parseAlphaBetaFromControlled for more details.*/
    switch (tool) {
    case "voltage":
    case "current":
        vdc = parseFromGenerator(valuestring, "dc");
        vac = parseFromGenerator(valuestring, "ac");
        break;
    case "currentalpha":
    case "currentbeta":
    case "voltagealpha":
    case "voltagebeta":
        vdc = parseAlphaBetaFromControlled(valuestring, "dc");
        vac = parseAlphaBetaFromControlled(valuestring, "ac");
        break;
    case "capacitor":
    case "inductor":
        vdc = 0;
        vac = findImpedance(tool, parseFloat(valuestring));
        break;
    default:
        vdc = parseFloat(valuestring);
        vac = findImpedance(tool, parseFloat(valuestring));
    }
    
    /*Creates the new line object*/
    newline = new Line(x1, y1, x2, y2, vdc, vac, tool, point1, point2, valuestring);
    
    /*If the tool is a controlled generator, more information are required. We need to add new properties, like the points of the controller voltage, or the index of the controller branch.*/
    switch (tool) {
    case "currentalpha":
    case "voltagebeta":
        p1 = parseControllerFromControlled(tool, valuestring, 1);
        p2 = parseControllerFromControlled(tool, valuestring, 2);
        /*This is quite tricky. Check the definition of findBranchFromPoints to find more info about its behaviour and returned value*/
        fbfp = findBranchFromPoints(p1, p2);
        if (fbfp === null) {
            --Line.cur_ID;
            return false;
        }
        if (fbfp > 0) {
            newline.I = fbfp - 1;
        } else {
            newline.I = -fbfp - 1;
            newline.V_DC = -newline.V_DC;
            newline.V_AC = opp(newline.V_AC);
        }
        break;
    case "currentbeta":
    case "voltagealpha":
        newline.VA = parseControllerFromControlled(tool, valuestring, 1);
        newline.VB = parseControllerFromControlled(tool, valuestring, 2);
        break;
    }
    
    /*Adds the new line to the global list, then to the internal list of involved points.*/
    branches.push(newline);
    nodes[point1].branches.push(Line.cur_ID - 1);
    nodes[point2].branches.push(Line.cur_ID - 1);
    return true;
}