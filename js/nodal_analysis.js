/*=====================================*/
/*Name: nodal_analysis.js*/
/*Description: Implementation of the nodal analysis algorithms.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -calculateCurrentsAC
    -calculateCurrentsDC
    -findConnectedComponents
    -getIntensityExpressionAC
    -getIntensityExpressionDC
    -solveAC
    -solveDC
*/
/*=====================================*/


/*Calculates the AC currents in branches, given the list (array) of voltages.*/
function calculateCurrentsAC(voltages) {
    "use strict";
    var i, j, currents = [], expression = [];
    for (i = 0; i < branches.length; ++i) {
        //initializes the currents to 0
        currents[i] = new Complex(0, 0);
        /*Find the current expression, the multiplies it by the voltages.*/
        expression = getIntensityExpressionAC(branches[i], branches[i].point2ID);
        for (j = 0; j < Point.cur_ID - 1; ++j) {
            currents[i] = add(currents[i], mul(expression[j], voltages[j]));
        }
        //known term is finally added
        currents[i] = add(currents[i], expression[Point.cur_ID - 1]);
    }
    //Format the output, 5 decimal digits.
    for (i = 0; i < branches.length; ++i) {
        currents[i].re = Math.floor(currents[i].re * 10000) / 10000;
        currents[i].im = Math.floor(currents[i].im * 10000) / 10000;
    }
    return currents;
}

/*Calculates the DC currents in branches, given the list (array) of voltages.*/
function calculateCurrentsDC(voltages) {
    "use strict";
    var i, j, currents = [], expression = [];
    for (i = 0; i < branches.length; ++i) {
        //initializes the currents to 0
        currents[i] = 0;
        /*Find the current expression, the multiplies it by the voltages.*/
        expression = getIntensityExpressionDC(branches[i], branches[i].point2ID);
        for (j = 0; j < Point.cur_ID - 1; ++j) {
            currents[i] = currents[i] + expression[j] * voltages[j];
        }
        //known term is finally added
        currents[i] = currents[i] + expression[Point.cur_ID - 1];
    }
    //Format the output, 5 decimal digits.
    for (i = 0; i < branches.length; ++i) {
        currents[i] = Math.floor(currents[i] * 10000) / 10000;
    }
    return currents;
}

/*Detects independent paths of generators, whose type is passed as parameter.
This function modifies the "partition" property of Node objects, making so that nodes in the same path have the same partition number.
The function behaves slightly different for AC and DC, because in the latter regime inductors are equivalent to wires.
It also spots eventual loops of generators, returning false if there are any, true otherwise.*/
function findConnectedComponents(generator_type, regime) {
    "use strict";
    var i, j, point1, point2, to_be_set, to_be_changed;
    for (i = 0; i < Point.cur_ID; i++) {
        nodes[i].partition = -1;    //initialize all partitions to -1 (logical value for "node not belonging to any path")
    }
    /*For each branch, if it's a generator (controlled or not), wire or inductor (only in DC), we update the partition of its nodes.*/
    for (i = 0; i < branches.length; i++) {
        if (branches[i].T === generator_type || branches[i].T === "wire" || (branches[i].T === "inductor" && regime === "dc") || branches[i].T === (generator_type + "alpha") || branches[i].T === (generator_type + "beta")) {
            point1 = branches[i].point1ID;
            point2 = branches[i].point2ID;
            /*If both nodes don't have a partition, the minimum between their indexes is chosen as partition id.*/
            if ((nodes[point1].partition === -1) && (nodes[point2].partition === -1)) {
                nodes[point1].partition = nodes[point2].partition = Math.min(point1, point2);
                continue;
            }
            /*If one of the points doesn't have a partition, it inherits the partition id from the other point (if the former has higher index), or becomes itself a partition root and then updates all the partitions of other points (if lower index).*/
            if ((nodes[point1].partition === -1) || (nodes[point2].partition === -1)) {
                //Partition id to be used
                to_be_set = (nodes[point1].partition === -1) ? Math.min(nodes[point2].partition, point1) : Math.min(nodes[point1].partition, point2);
                //Partition id to be changed
                to_be_changed = Math.max(nodes[point1].partition, nodes[point2].partition);
                nodes[point1].partition = nodes[point2].partition = to_be_set;
                //Updates the partition of other nodes, if necessary.
                for (j = 0; j < Point.cur_ID; j++) {
                    if (nodes[j].partition === to_be_changed) {
                        nodes[j].partition = to_be_set;
                    }
                }
                continue;
            }
            /*If the two points already belong to the same partition, then a loop of generators exists.*/
            if (nodes[point1].partition === nodes[point2].partition) {
                return false;
            }
            /*If the two points belong to different partitions (not -1), the lowest one is chosen.*/
            to_be_set = Math.min(nodes[point1].partition, nodes[point2].partition);     //the lowest
            to_be_changed = Math.max(nodes[point1].partition, nodes[point2].partition); //the highest       
            nodes[point1].partition = nodes[point2].partition = to_be_set;
            /*Update the partition of other nodes where needed*/
            for (j = 0; j < Point.cur_ID; j++) {
                if (nodes[j].partition === to_be_changed) {
                    nodes[j].partition = to_be_set;
                }
            }
        }
    }
    return true;
}

/*Finds the current expression of a branch in AC analysis. Since this function is (sometimes) recursive, as we may need to apply Kirchhoff current law (KCL) to determine the current, the junction parameter represents the node to which we apply Kirchhoff. This function returns the coefficients (Z-parameter matrix) of the current expression (phasor) flowing through the branch. The coefficients are n: (n-1) for each voltage, plus one for current generators.*/
function getIntensityExpressionAC(line, junction) {
    "use strict";
    //result and subresult are arrays of n+1 elements. The first n are voltages (index is shifted by 1), the last is the known term (current)
    var i, j, branchID, result = [], subresult = [];
    //Initializes the result array to 0.
    for (i = 0; i < Point.cur_ID; ++i) {
        result[i] = new Complex(0, 0);
    }
    
    switch (line.T) {
    //For current sources, we simply add to the known term.
    case "current":
        result[Point.cur_ID - 1] = line.V_AC;
        return result;
    //For current sources depending on current, first we must calculate the controller current, then we simply multiply it for alpha.
    case "currentalpha":
        subresult = getIntensityExpressionAC(branches[line.I], branches[line.I].point2ID);
        for (i = 0; i < Point.cur_ID; ++i) {
            result[i] = mul(line.V_AC, subresult[i]);   //V_AC stores alpha
        }
        return result;
    //For current sources depending on voltages, the expression is like beta*(vA - vB).
    case "currentbeta":
        if (line.VA > 0) {
            result[line.VA - 1] = line.V_AC;   //V_AC stores beta
        }
        if (line.VB > 0) {
            result[line.VB - 1] = opp(line.V_AC);
        }
        return result;
    //For passive components, we simply divide the potential difference by impedance.
    case "resistor":
    case "inductor":
    case "capacitor":
        if (line.point1ID > 0) {
            result[line.point1ID - 1] = div(new Complex(1, 0), line.V_AC);    //V_AC stores impedance
        }
        if (line.point2ID > 0) {
            result[line.point2ID - 1] = div(new Complex(-1, 0), line.V_AC);
        }
        return result;
    /*For the other components, we can't directly get the intensity expression, we must use KCL.
    This is where the function is recursive. It's easier to understand with an example. Suppose that you have a series of two wires, connected like A----B----C. Here, you want to determine the current of AB, so you apply KCL to the node B. Now, when you try to calculate the currents flowing through B, you need to determine the current of BC, which is another wire. You need to apply KCL again, but to which node (B or C)? Necessarily C because the previous "request" came from node B, otherwise you would have a reference loop (AB depends on BC and viceversa). The parameter junction is exactly that information about the "request" sender.*/
    case "voltage":
    case "wire":
    case "voltagealpha":
    case "voltagebeta":
        //if the request came from point1, we'll forward it to point2.
        junction = (line.point1ID === junction) ? line.point2ID : line.point1ID;
        //KCL: we sum all the current coming from adjacent branches.
		for (i = 0; i < nodes[junction].branches.length; ++i) {
            branchID = nodes[junction].branches[i];
            if (branchID === line.id) {continue; }          //in KCL, we obviously ignore the unknown branch.
            subresult = getIntensityExpressionAC(branches[branchID], junction); //expression of the adjacent branch
            if (branches[branchID].point2ID === junction) { //if its current is flowing into the node
                for (j = 0; j < Point.cur_ID; ++j) {
                    result[j] = (line.point2ID === junction) ? sub(result[j], subresult[j]) : add(result[j], subresult[j]);
                }
            } else {                                        //if its current is flowing out of the node
                for (j = 0; j < Point.cur_ID; ++j) {
                    result[j] = (line.point2ID === junction) ? add(result[j], subresult[j]) : sub(result[j], subresult[j]);
                }
            }
        }
		return result;
    }
}

/*Finds the current expression of a branch in DC analysis. Since this function is (sometimes) recursive, as we may need to apply Kirchhoff current law (KCL) to determine the current, the junction parameter represents the node to which we apply Kirchhoff. This function returns the coefficients (Z-parameter matrix) of the current expression (phasor) flowing through the branch. The coefficients are n: (n-1) for each voltage, plus one for current generators.*/
function getIntensityExpressionDC(line, junction) {
    "use strict";
    //result and subresult are arrays of n+1 elements. The first n are voltages (index is shifted by 1), the last is the known term (current)
    var i, j, branchID, result = [], subresult = [];
    //Initializes the result array to 0.
    for (i = 0; i < Point.cur_ID; ++i) {
        result[i] = 0;
    }
    
    switch (line.T) {
    //For current sources, we simply add to the known term.
    case "current":
        result[Point.cur_ID - 1] = line.V_DC;
        return result;
    //For current sources depending on current, first we must calculate the controller current, then we simply multiply it for alpha.
    case "currentalpha":
        subresult = getIntensityExpressionDC(branches[line.I], branches[line.I].point2ID);
        for (i = 0; i < Point.cur_ID; ++i) {
            result[i] = line.V_DC * subresult[i];   //V_DC stores alpha
        }
        return result;
    //For current sources depending on voltages, the expression is like beta*(vA - vB).
    case "currentbeta":
        if (line.VA > 0) {
            result[line.VA - 1] = line.V_DC;        //V_DC stores beta
        }
        if (line.VB > 0) {
            result[line.VB - 1] = -line.V_DC;
        }
        return result;
    //For resistors, we simply divide the potential difference by resistance.
    case "resistor":
        if (line.point1ID > 0) {
            result[line.point1ID - 1] = 1 / line.V_DC;  //V_DC stores resistance
        }
        if (line.point2ID > 0) {
            result[line.point2ID - 1] = -1 / line.V_DC;
        }
        return result;
    //No current flows through capacitor in DC.
    case "capacitor":
        return result;
    /*For the other components, we can't directly get the intensity expression, we must use KCL.
    This is where the function is recursive. It's easier to understand with an example. Suppose that you have a series of two wires, connected like A----B----C. Here, you want to determine the current of AB, so you apply KCL to the node B. Now, when you try to calculate the currents flowing through B, you need to determine the current of BC, which is another wire. You need to apply KCL again, but to which node (B or C)? Necessarily C because the previous "request" came from node B, otherwise you would have a reference loop (AB depends on BC and viceversa). The parameter junction is exactly that information about the "request" sender.*/
    case "voltage":
    case "wire":
    case "inductor":    //inductor is like wire in DC
    case "voltagealpha":
    case "voltagebeta":
        //if the request came from point1, we'll forward it to point2.
        junction = (line.point1ID === junction) ? line.point2ID : line.point1ID;
        //KCL: we sum all the current coming from adjacent branches.
        for (i = 0; i < nodes[junction].branches.length; ++i) {
            branchID = nodes[junction].branches[i];
            if (branchID === line.id) {continue; }          //in KCL, we obviously ignore the unknown branch.
            subresult = getIntensityExpressionDC(branches[branchID], junction); //expression of the adjacent branch
            if (branches[branchID].point2ID === junction) { //if its current is flowing into the node
                for (j = 0; j < Point.cur_ID; ++j) {
                    result[j] = (line.point2ID === junction) ? (result[j] - subresult[j]) : (result[j] + subresult[j]);
                }
            } else {
                for (j = 0; j < Point.cur_ID; ++j) {        //if its current is flowing out of the node
                    result[j] = (line.point2ID === junction) ? (result[j] + subresult[j]) : (result[j] - subresult[j]);
                }
            }
        }
        return result;
    }
}

/*Performs AC analysis of the circuit, determining the matrix associated to the linear system of solving equations, then finally returns its solution (AC voltages of nodes).*/
function solveAC() {
    "use strict";
    var matrix = [], eq = [], i, j, k, l, controller1, controller2, expr = [], t, r, b_index;
    /*For each node we write an equation. Each equation has n terms: (n-1) variable coefficients and 1 known term.*/
nodes_cycle:
    for (i = 1; i < Point.cur_ID; ++i) {
        /*Initializes all the equation terms to 0.*/
        for (j = 0; j < Point.cur_ID; ++j) {
            eq[j] = new Complex(0, 0);
        }
branches_cycle:
        /*Each branch j adjacent to the node i contributes to some terms of the equation, depending on its type.*/
        for (j = 0; j < nodes[i].branches.length; ++j) {
            b_index = nodes[i].branches[j];     //branch index
            t = branches[b_index].T;            //type of the branch
            switch (t) {
            //At first, we ignore voltage generators and wires, so we skip to the next adjacent branch.
            case "voltage":
            case "wire":
            case "voltagealpha":
            case "voltagebeta":
                continue branches_cycle;
            //For current generator, we add (or sub, depending on its orientation) its value to the known term of the equation (last column).
            case "current":
                if (branches[b_index].point2ID === i) {     //direction of the generator
                    eq[Point.cur_ID - 1] = add(eq[Point.cur_ID - 1], branches[b_index].V_AC);
                } else {
                    eq[Point.cur_ID - 1] = sub(eq[Point.cur_ID - 1], branches[b_index].V_AC);
                }
                break;
            //For current controlled current sources, we find its current expression and add (or sub) it to the equation.
            case "currentalpha":
                controller1 = branches[b_index].I;
                expr = getIntensityExpressionAC(branches[controller1], branches[controller1].point2ID); //doesn't matter if point2ID or point1ID
                if (branches[b_index].point2ID === i) {     //direction of the generator
                    eq[Point.cur_ID - 1] = add(eq[Point.cur_ID - 1], mul(branches[b_index].V_AC, expr[Point.cur_ID - 1])); //known term; V_AC stores alpha
                    for (k = 0; k < Point.cur_ID - 1; ++k) {
                        eq[k] = sub(eq[k], mul(branches[b_index].V_AC, expr[k]));   //-alpha * voltage terms
                    }
                } else {
                    eq[Point.cur_ID - 1] = sub(eq[Point.cur_ID - 1], mul(branches[b_index].V_AC, expr[Point.cur_ID - 1])); //alpha * known term of expr
                    for (k = 0; k < Point.cur_ID - 1; ++k) {
                        eq[k] = add(eq[k], mul(branches[b_index].V_AC, expr[k]));   //+alpha * voltage terms
                    }
                }
                break;
            //For current sources controlled by potential difference, we add (or subtract) the factor beta to the controller terms of the equation
            case "currentbeta":
                controller1 = branches[b_index].VA;     //index of the first controller node
                controller2 = branches[b_index].VB;     //index of the second controller node
                if (branches[b_index].point2ID === i) {     //direction of the generator
                    if (controller1 > 0) {  //the ground doesn't have its own term in the equation
                        eq[controller1 - 1] = sub(eq[controller1 - 1], branches[b_index].V_AC); //-beta (in the first controller term)
                    }
                    if (controller2 > 0) {
                        eq[controller2 - 1] = add(eq[controller2 - 1], branches[b_index].V_AC); //+beta (in the second controller term)
                    }
                } else {
                    if (controller1 > 0) {
                        eq[controller1 - 1] = add(eq[controller1 - 1], branches[b_index].V_AC); //+beta
                    }
                    if (controller2 > 0) {
                        eq[controller2 - 1] = sub(eq[controller2 - 1], branches[b_index].V_AC); //-beta
                    }
                }
                break;
            /*For passive components, we need to calculate the self-admittance and mutual-admittance terms.*/
            case "resistor":
            case "inductor":
            case "capacitor":
                eq[i - 1] = add(eq[i - 1], (inv(branches[b_index].V_AC)));  //self-admittance
                if (branches[b_index].point1ID === i) {     //direction of the component
                    if (branches[b_index].point2ID !== 0) {
                        eq[branches[b_index].point2ID - 1] = sub(eq[branches[b_index].point2ID - 1], (inv(branches[b_index].V_AC)));    //mutual admittance
                    }
                } else {
                    if (branches[b_index].point1ID !== 0) {
                        eq[branches[b_index].point1ID - 1] = sub(eq[branches[b_index].point1ID - 1], (inv(branches[b_index].V_AC)));
                    }
                }
                break;
            }   //end of switch
        }   //end of branches_cycle
        /*Appends the new equation to the equations matrix*/
        matrix[matrix.length] = [];
        for (j = 0; j < Point.cur_ID; ++j) {
            matrix[matrix.length - 1][j] = eq[j];
        }
    }
    /*Our system of equations is incomplete yet. We've skipped voltage generators, wires and so on. Now, we must write as many equation as the skipped component. Again, the structure of the equation depends on the branch typology. Note that we're still following nodal analysis rules about equation writing.*/
    k = 0;      //k is used as index of the component of which we need to write an equation. It's initialized to 0, then a scan through all branches is performed.
    for (i = 1; i < Point.cur_ID; ++i) {
        //For each node adjacent to a "skipped component", that is all nodes with a non-negative partition number.
        if (nodes[i].partition !== -1) {
            r = nodes[i].partition;         //r is the index of the root node for the path to which i belongs.
            /*If i isn't the root itself, and ground isn't the root, we move (adding) the equation of i to the equation of the root.
            At the end, the root node will contain the sum of the equations of its nodes.
            On the contrary, we'll use non-root slots to hold the equations of each single skipped element (like voltage generators).
            */
            if ((i !== r) && (r !== 0)) {
                for (j = 0; j < Point.cur_ID; ++j) {
                    matrix[r - 1][j] = add(matrix[r - 1][j], matrix[i - 1][j]);
                }
            }
            /*If i isn't the root, we replace its content with the equation of one of the skipped components. There's no information loss in this replacement, since we've already moved its content elsewhere in the previous statements.*/
            if (i !== r) {
                //clear the equation
                for (j = 0; j < Point.cur_ID; ++j) {
                    matrix[i - 1][j] = new Complex(0, 0);
                }
                //find the next component of which we need to write an equation, k will be its index.
                while ((branches[k].T !== "voltage" && branches[k].T !== "wire" && branches[k].T !== "voltagealpha" && branches[k].T !== "voltagebeta") && (k < branches.length)) {  //cerca il prossimo gen. di tensione da scrivere
                    ++k;
                }
                //the equation pattern is something like v1 - v2 = <something>, where something depends on the type.
                if (branches[k].point1ID > 0) {    //+v2, unless ground node
                    matrix[i - 1][branches[k].point1ID - 1] = new Complex(-1, 0);
                }
                if (branches[k].point2ID > 0) {    //-v1, unless ground node
                    matrix[i - 1][branches[k].point2ID - 1] = new Complex(1, 0);
                }
                switch (branches[k].T) {
                //for independent voltage generators, <something> is exactly the value of the generator.
                case "voltage":
                    matrix[i - 1][Point.cur_ID - 1] = branches[k].V_AC;
                    break;
                //for voltages generators controlled by voltage, <something> is alpha*(vA-vB)
                case "voltagealpha":
                    controller1 = branches[k].VA;
                    controller2 = branches[k].VB;
                    if (controller1 > 0) {
                        matrix[i - 1][controller1 - 1] = sub(matrix[i - 1][controller1 - 1], branches[k].V_AC);   //-alpha*vB
                    }
                    if (controller2 > 0) {
                        matrix[i - 1][controller2 - 1] = add(matrix[i - 1][controller2 - 1], branches[k].V_AC);   //+alpha*vA
                    }
                    break;
                //For voltages generators controlled by current, first we need to find the current expression. Then <something> is beta*expression
                case "voltagebeta":
                    controller1 = branches[k].I;
                    expr = getIntensityExpressionAC(branches[controller1], branches[controller1].point2ID);
                    matrix[i - 1][Point.cur_ID - 1] = add(matrix[i - 1][Point.cur_ID - 1], mul(branches[k].V_AC, expr[Point.cur_ID - 1])); //alpha * known term of expr
                    for (l = 0; l < Point.cur_ID - 1; ++l) {
                        matrix[i - 1][l] = sub(matrix[i - 1][l], mul(branches[k].V_AC, expr[l]));   //alpha * each term of expr
                    }
                    break;
                }
                ++k;    //needed, otherwise we cycle on the same generator
            }
        }
    }
    /*Once the equation matrix is complete, we solve it through Gauss elimination and return the result (voltages)*/
    return complexGaussElimination(matrix);
}

/*Performs DC analysis of the circuit, determining the matrix associated to the linear system of solving equations, then finally returns its solution (DC voltages of nodes).*/
function solveDC() {
    "use strict";
    var matrix = [], eq = [], i, j, k, l, controller1, controller2, expr = [], t, r, b_index;
    /*For each node we write an equation. Each equation has n terms: (n-1) variable coefficients and 1 known term.*/
nodes_cycle:
    for (i = 1; i < Point.cur_ID; ++i) {
        /*Initializes all the equation terms to 0.*/
        for (j = 0; j < Point.cur_ID; ++j) {
            eq[j] = 0;
        }
branches_cycle:
        /*Each branch j adjacent to the node i contributes to some terms of the equation, depending on its type.*/
        for (j = 0; j < nodes[i].branches.length; ++j) {
            b_index = nodes[i].branches[j];     //branch index
            t = branches[b_index].T;            //type of the branch
            switch (t) {
            //At first, we ignore voltage generators, wires and inductors, so we skip to the next adjacent branch.
            case "voltage":
            case "wire":
            case "inductor":    //in DC, inductors are like wires!
            case "voltagealpha":
            case "voltagebeta":
                continue branches_cycle;     //se c'è un gen. di tensione, scriviamo l'equazione come fosse disabilitato
            /*For current generator, we add (or sub, depending on its orientation) its value to the known term of the equation (last column).
            Capacitors are just like current sources with 0 value!*/
            case "current":
            case "capacitor":
                if (branches[b_index].point2ID === i) {     //direction of the generator
                    eq[Point.cur_ID - 1] = eq[Point.cur_ID - 1] + branches[b_index].V_DC;
                } else {
                    eq[Point.cur_ID - 1] = eq[Point.cur_ID - 1] - branches[b_index].V_DC;
                }
                break;
            //For current controlled current sources, we find its current expression and add (or sub) it to the equation.
            case "currentalpha":
                controller1 = branches[b_index].I;
                expr = getIntensityExpressionDC(branches[controller1], branches[controller1].point2ID); //doesn't matter if point2ID or point1ID
                if (branches[b_index].point2ID === i) {
                    eq[Point.cur_ID - 1] = eq[Point.cur_ID - 1] + branches[b_index].V_DC * expr[Point.cur_ID - 1];  //known term; V_AC stores alpha
                    for (k = 0; k < Point.cur_ID - 1; ++k) {
                        eq[k] = eq[k] - branches[b_index].V_DC * expr[k];   //-alpha * voltage terms
                    }
                } else {
                    eq[Point.cur_ID - 1] = eq[Point.cur_ID - 1] - branches[b_index].V_DC * expr[Point.cur_ID - 1];  //alpha * known term of expr
                    for (k = 0; k < Point.cur_ID - 1; ++k) {
                        eq[k] = eq[k] + branches[b_index].V_DC * expr[k];   //+alpha * voltage terms
                    }
                }
                break;
            //For current sources controlled by potential difference, we add (or subtract) the factor beta to the controller terms of the equation
            case "currentbeta":
                controller1 = branches[b_index].VA;     //index of the first controller node
                controller2 = branches[b_index].VB;     //index of the second controller node
                if (branches[b_index].point2ID === i) {     //direction of the generator
                    if (controller1 > 0) {  //the ground doesn't have its own term in the equation
                        eq[controller1 - 1] = eq[controller1 - 1] - branches[b_index].V_DC; //-beta (in the first controller term)
                    }
                    if (controller2 > 0) {
                        eq[controller2 - 1] = eq[controller2 - 1] + branches[b_index].V_DC; //+beta (in the second controller term)
                    }
                } else {
                    if (controller1 > 0) {
                        eq[controller1 - 1] = eq[controller1 - 1] + branches[b_index].V_DC; //+beta
                    }
                    if (controller2 > 0) {
                        eq[controller2 - 1] = eq[controller2 - 1] - branches[b_index].V_DC; //-beta
                    }
                }
                break;
            /*For resistors, we need to calculate the self-conductance and mutual-conductance terms.*/
            case "resistor":
                eq[i - 1] = eq[i - 1] + 1 / (branches[b_index].V_DC);     //auto-conductance
                if (branches[b_index].point1ID === i) {                   //direction of the component
                    if (branches[b_index].point2ID !== 0) {
                        eq[branches[b_index].point2ID - 1] = eq[branches[b_index].point2ID - 1] - 1 / (branches[b_index].V_DC);     //mutual-conductance
                    }
                } else {
                    if (branches[b_index].point1ID !== 0) {
                        eq[branches[b_index].point1ID - 1] = eq[branches[b_index].point1ID - 1] - 1 / (branches[b_index].V_DC);
                    }
                }
                break;
            }   //end of switch
        }   //end of branches_cycle
        /*Appends the new equation to the equations matrix*/
        matrix[matrix.length] = [];
        for (j = 0; j < Point.cur_ID; ++j) {
            matrix[matrix.length - 1][j] = eq[j];
        }
    }
    /*Our system of equations is incomplete yet. We've skipped voltage generators, wires and so on. Now, we must write as many equation as the skipped component. Again, the structure of the equation depends on the branch typology. Note that we're still following nodal analysis rules about equation writing.*/
    k = 0;      //k is used as index of the component of which we need to write an equation. It's initialized to 0, then a scan through all branches is performed.
    for (i = 1; i < Point.cur_ID; ++i) {
        //For each node adjacent to a "skipped component", that is all nodes with a non-negative partition number.
        if (nodes[i].partition !== -1) {
            r = nodes[i].partition;         //r is the index of the root node for the path to which i belongs.
            /*If i isn't the root itself, and ground isn't the root, we move (adding) the equation of i to the equation of the root.
            At the end, the root node will contain the sum of the equations of its nodes.
            On the contrary, we'll use non-root slots to hold the equations of each single skipped element (like voltage generators).
            */
            if ((i !== r) && (r !== 0)) {
                for (j = 0; j < Point.cur_ID; ++j) {
                    matrix[r - 1][j] = matrix[r - 1][j] + matrix[i - 1][j];
                }
            }
            /*If i isn't the root, we replace its content with the equation of one of the skipped components. There's no information loss in this replacement, since we've already moved its content elsewhere in the previous statements.*/
            if (i !== r) {
                //clear the equation
                for (j = 0; j < Point.cur_ID; ++j) {
                    matrix[i - 1][j] = 0;
                }
                //find the next component of which we need to write an equation, k will be its index.
                while ((branches[k].T !== "voltage" && branches[k].T !== "wire" && branches[k].T !== "inductor" && branches[k].T !== "voltagealpha" && branches[k].T !== "voltagebeta") && (k < branches.length)) {  //cerca il prossimo gen. di tensione da scrivere
                    ++k;
                }
                //the equation pattern is something like v1 - v2 = <something>, where something depends on the type.
                if (branches[k].point1ID > 0) {     //+v2, unless ground node
                    matrix[i - 1][branches[k].point1ID - 1] = -1;
                }
                if (branches[k].point2ID > 0) {     //-v1, unless ground node
                    matrix[i - 1][branches[k].point2ID - 1] = 1;
                }
                switch (branches[k].T) {
                //for independent voltage generators, <something> is exactly the value of the generator.
                case "voltage":
                case "inductor":
                    matrix[i - 1][Point.cur_ID - 1] = branches[k].V_DC;
                    break;
                //for voltages generators controlled by voltage, <something> is alpha*(vA-vB)
                case "voltagealpha":
                    controller1 = branches[k].VA;
                    controller2 = branches[k].VB;
                    if (controller1 > 0) {
                        matrix[i - 1][controller1 - 1] = matrix[i - 1][controller1 - 1] - branches[k].V_DC;   //-alpha*vB
                    }
                    if (controller2 > 0) {
                        matrix[i - 1][controller2 - 1] = matrix[i - 1][controller2 - 1] + branches[k].V_DC;   //+alpha*vA
                    }
                    break;
                //For voltages generators controlled by current, first we need to find the current expression. Then <something> is beta*expression
                case "voltagebeta":
                    controller1 = branches[k].I;
                    expr = getIntensityExpressionDC(branches[controller1], branches[controller1].point2ID);
                    matrix[i - 1][Point.cur_ID - 1] = matrix[i - 1][Point.cur_ID - 1] + branches[k].V_DC * expr[Point.cur_ID - 1]; //alpha * known term of expr di expr
                    for (l = 0; l < Point.cur_ID - 1; ++l) {
                        matrix[i - 1][l] = matrix[i - 1][l] - branches[k].V_DC * expr[l];   //alpha * each term of expr
                    }
                    break;
                }
                ++k;    //needed, otherwise we cycle on the same generator
            }
        }
    }
    /*Once the equation matrix is complete, we solve it through Gauss elimination and return the result (voltages)*/
    return gaussElimination(matrix);
}