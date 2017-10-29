/*=====================================*/
/*Name: validity.js*/
/*Description: Functions that perform checks of any kind, from input validation to graph topology inspection.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -checkIfLastACGenerator
    -checkIfLastDCGenerator
    -duplicateCircuitName
    -findNodesOnlyCurrentsAC
    -findNodesOnlyCurrentsDC
    -valueCheck
*/
/*=====================================*/


/*After deleting a generator, checks if it was the last AC generator. If so, AC analysis isn't required anymore, also we can set new values for omega.*/
function checkIfLastACGenerator(id) {
    "use strict";
    var i, found = false;
    if (branches[id].T !== "current" && branches[id].T !== "voltage") {
        return;
    }
    if (!isNaN(branches[id].expression)) {
        return;
    }
    for (i = 0; i < branches.length; ++i) {
        if (i !== id && isNaN(branches[i].expression)) {
            found = true;
        }
    }
    if (!found) {
        updateAllImpedance(omega, "removeomega");
        omega = null;
        ac_analysis = false;
    }
}

/*After deleting a generator, checks if it was the last DC generator. If so, a DC analysis isn't required anymore.*/
function checkIfLastDCGenerator(id, regime) {
    "use strict";
    var i, found = false;
    if (branches[id].T !== "current" && branches[id].T !== "voltage") {
        return;
    }
    if (isNaN(branches[id].expression)) {
        return;
    }
    for (i = 0; i < branches.length; ++i) {
        if (i !== id && (branches[i].T === "current" || branches[i].T === "voltage") && !isNaN(branches[i].expression)) {
            found = true;
        }
    }
    if (!found) {
        dc_analysis = false;
    }
}

/*Checks the validity of the name chosen by the user for its circuit. Particularly, it also checks if the name already existed in the database.*/
function duplicateCircuitName() {
    "use strict";
    var xmlHttp1, response, graphId, duplicatesignal, uploadbutton, nameregex;
    graphId = document.getElementById("uploadid").value;
    uploadbutton = document.getElementById("uploadbutton2");
    duplicatesignal = document.getElementById("duplicatesignal");
    nameregex = /^\w{6,}$/;
    /*check length*/
    if (!nameregex.test(graphId)) {
        duplicatesignal.style.backgroundColor = "red";
        duplicatesignal.title = "Too short";
        uploadbutton.disabled = true;
        return;
    }
    /*check if duplicate*/
    try {
        xmlHttp1 = new XMLHttpRequest();
    } catch (e1) {
        try {
            xmlHttp1 = new window.ActiveXObject("Msxml2.XMLHTTP");
        } catch (e2) {
            try {
                xmlHttp1 = new window.ActiveXObject("Microsoft.XMLHTTP");
            } catch (e3) {
                window.alert("Your browser doesn't support AJAX!");
                return;
            }
        }
    }
    xmlHttp1.onreadystatechange = function () {
        if (xmlHttp1.readyState === 4 && xmlHttp1.status === 200) {
            response = JSON.parse(xmlHttp1.responseText);
            //if there was an error in the request
            if (response.Error) {
                window.alert(response.Error);
            } else {
                //if not a duplicate, allow to submit
                if (response.duplicate === "no") {
                    duplicatesignal.style.backgroundColor = "green";
                    duplicatesignal.title = "Avalaible";
                    uploadbutton.disabled = false;
                } else {
                    duplicatesignal.style.backgroundColor = "red";
                    duplicatesignal.title = "Already used";
                    uploadbutton.disabled = true;
                }
            }
        }
    };
    xmlHttp1.open("POST", "php/checkduplicates.php", true);
    xmlHttp1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp1.send("graphname=" + graphId);
}

/*In AC analysis, detects the presence of nodes which have only adjacent current generators. Since this kind of circuits are impossible to solve, we need to identify them.*/
function findNodesOnlyCurrentsAC() {
    "use strict";
    var nodes_only_current = [], i;
    //First, suppose that all nodes are "bad" (have only current generators).
    for (i = 0; i < Point.cur_ID; ++i) {
        nodes_only_current[i] = true;
    }
    //Scan all branches: when a non-current one is found, it marks its two nodes as "good"
    for (i = 0; i < Line.cur_ID; ++i) {
        if (branches[i].T !== "current" && branches[i].T !== "currentalpha" && branches[i].T !== "currentbeta") {
            nodes_only_current[branches[i].point1ID] = false;
            nodes_only_current[branches[i].point2ID] = false;
        }
    }
    //Returns false if there's still a "bad" node...
    for (i = 0; i < Point.cur_ID; ++i) {
        if (nodes_only_current[i] === true) {
            return false;
        }
    }
    //...true otherwise!
    return true;
}

/*In AC analysis, detects the presence of nodes which have only adjacent current generators. Since this kind of circuits are impossible to solve, we need to identify them.*/
function findNodesOnlyCurrentsDC() {
    "use strict";
    var nodes_only_current = [], i, j, b, only_capacitors;
    /*At first, it assumes that every node has only current sources or capacitors. (not necessarily true)*/
    for (i = 0; i < Point.cur_ID; ++i) {
        nodes_only_current[i] = true;
    }
    /*Scan all branches. When a branch isn't a capacitor or current, the above assumption is refuted for the nodes of that branch.*/
    for (i = 0; i < Line.cur_ID; ++i) {
        if ((branches[i].T !== "current" && branches[i].T !== "currentalpha" && branches[i].T !== "currentbeta" && branches[i].T !== "capacitor") || (branches[i].T === "current" && isNaN(branches[i].expression))) {
            nodes_only_current[branches[i].point1ID] = false;
            nodes_only_current[branches[i].point2ID] = false;
        }
    }
    /*However, the case of all branches of a node being capacitors isn't an issue! For the nodes which resulted 'true' in the previous check, we also check whether those nodes had only capacitors; if so they can pass the test.*/
    for (i = 0; i < Point.cur_ID; ++i) {
        if (nodes_only_current[i] === true) {
            only_capacitors = true;
            for (j = 0; j < nodes[i].branches.length; ++j) {
                b = nodes[i].branches[j];
                if (branches[b].T !== "capacitor") {
                    only_capacitors = false;
                }
            }
            nodes_only_current[i] = !only_capacitors;
        }
    }
    /*If there are some nodes which didn't pass the above checks, then the function returns true, false otherwise.*/
    for (i = 0; i < Point.cur_ID; ++i) {
        if (nodes_only_current[i] === true) {
            return false;
        }
    }
    return true;
}

/*Validates the input of components. If the input is wrong, an error message is returned, then the value is modified to a default one.*/
function valueCheck() {
    "use strict";
    var omega_pos = -1,
        om,
        inputfield = document.getElementById("valuebutton"),
        stringvalue = inputfield.value,     //input value (string)
        insertedvalue = parseFloat(stringvalue),                        //input value (converted to float, if possible)
        ac_regex = /^[+\-]?((\.\d+)|(\d+(\.\d+)?)[\s]?[*]?[\s]?)?(sin|cos)[\s]?\([\s]?[+\-]?((\.\d+)|(\d+(\.\d+)?)[\s]?[*]?[\s]?)?t[\s]?[+\-]?((\.\d+)|(\d+(\.\d+)?))?[\s]?\)$/,   //regex for sinusoidal expressions
        voltregex = /^[+\-]?((\.\d+)|(\d+(\.\d+)?))?[\s]?[*]?[\s]?V([1-9][0-9]*|0)_([1-9][0-9]*|0)/,    //regex for controlled by voltage inputs
        currregex = /^[+\-]?((\.\d+)|(\d+(\.\d+)?))?[\s]?[*]?[\s]?I([1-9][0-9]*|0)_([1-9][0-9]*|0)/;    //regex for controlled by current inputs
    switch (selected_tool_name) {
    case "voltage":
    case "current":
        /*If it violates the format of both AC and DC.*/
        if (!ac_regex.test(stringvalue) && isNaN(stringvalue)) {
            window.alert("Error: invalid format for generators.\n\nExamples of valid formats are:\n 20.4\n+30.3sin(20t+3)\ncos ( 10.2 * t)");
            inputfield.value = 10;
            return;
        }
        //try to find the position of omega in the input
        omega_pos = stringvalue.search(/\(/i);
        //if omega is found, the generator is sinusoidal
        if (omega_pos !== -1) {
            //read the omega
            om = parseFloat(stringvalue.substr(omega_pos + 1));
            if (isNaN(om)) {    //if implicit
                om = 1;
            }
            if (om === 0) {    //if omega is 0, error
                window.alert("Error: the angular frequency can't be 0!");
                inputfield.value = 10;
            }
            //generators with different angular frequencies aren't supported by Ohmulator
            if (omega !== null && om !== omega) {
                window.alert("Error: circuits with periodic generators with different frequency values are not supported yet!");
                inputfield.value = 10;
                return;
            }
        }
        break;
    case "resistor":
    case "capacitor":
    case "inductor":
        if (isNaN(stringvalue)) {
            window.alert("Error: the value must be a number!");
            inputfield.value = 10;
            return;
        }
        break;
    case "voltagealpha":
    case "currentbeta":
        if (!voltregex.test(stringvalue)) {
            window.alert("Error: invalid format for controlled generators.\nExamples of valid formats are:\n20V1_3\n1.5*V2_5");
            inputfield.value = "2V1_2";
            return;
        }
        break;
    case "voltagebeta":
    case "currentalpha":
        if (!currregex.test(stringvalue)) {
            window.alert("Error: invalid format for controlled generators.\nExamples of valid formats are:\n20I1_3\n1.5*I2_5");
            inputfield.value = "2I1_2";
            return;
        }
        break;
    }
    /*If the value was empty (note: only for indep. generators and passive compon., empty controlled generators are identified earlier).*/
    if (stringvalue === "") {
        window.alert("Error: the value can't be empty!");
        inputfield.value = 10;
        return;
    }
    /*If the value was 0.*/
    if (insertedvalue === 0) {
        window.alert("Error: the value can't be 0!");
        inputfield.value = 10;   //dopo l'errore imposta value ad un valore arbitrario
    }
}