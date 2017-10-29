/*=====================================*/
/*Name: tools.js*/
/*Description: Functions that allow the user to select a component to draw.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -changeTool
*/
/*=====================================*/

/*This function is executed everytime the user clicks on a tool button. It sets the new tool as current item, updates default values, highlights the button and so on.*/
function changeTool(el) {
    "use strict";
    var buttonID, valuebutton, unitbutton;
    //first, disable removal mode
    unsetRemovalMode();
    //highlights button
    if (buttonel) {
        buttonel.style.backgroundColor = "#77fcff";
    }
    buttonID = el.getAttribute("id");
    buttonel = document.getElementById(buttonID);
    buttonel.style.backgroundColor = "orange";
    valuebutton = document.getElementById("valuebutton");
    unitbutton = document.getElementById("unitbutton");
    document.getElementById("valuebutton").disabled = false;
    switch (buttonID) {
    case "removebutton":
        selected_tool_name = "remove";
        document.getElementById("valuebutton").disabled = true;
        //re-enable removal mode
        setRemovalMode();
        break;
    case "nodebutton":
        selected_tool_name = "node";
        document.getElementById("valuebutton").disabled = true;
        break;
    case "resistorbutton":
        selected_tool_name = "resistor";
        valuebutton.value = 10;
        unitbutton.value = "Ω";
        break;
    case "inductorbutton":
        selected_tool_name = "inductor";
        valuebutton.value = 0.001;
        unitbutton.value = "H";
        break;
    case "capacitorbutton":
        selected_tool_name = "capacitor";
        valuebutton.value = 0.00001;
        unitbutton.value = "F";
        break;
    case "voltagebutton":
        selected_tool_name = "voltage";
        valuebutton.value = "300sin(50t)";
        unitbutton.value = "V";
        break;
    case "currentbutton":
        selected_tool_name = "current";
        valuebutton.value = "20sin(50t)";
        unitbutton.value = "A";
        break;
    case "wirebutton":
        selected_tool_name = "wire";
        //it's not possible to select the value of wires
        document.getElementById("valuebutton").disabled = true;
        valuebutton.value = 0;
        unitbutton.value = "";
        break;
    case "currentalphabutton":
        selected_tool_name = "currentalpha";
        valuebutton.value = "2I1_2";
        unitbutton.value = "A";
        break;
    case "currentbetabutton":
        selected_tool_name = "currentbeta";
        valuebutton.value = "2V1_2";
        unitbutton.value = "A";
        break;
    case "voltagealphabutton":
        selected_tool_name = "voltagealpha";
        valuebutton.value = "2V1_2";
        unitbutton.value = "V";
        break;
    case "voltagebetabutton":
        selected_tool_name = "voltagebeta";
        valuebutton.value = "2I1_2";
        unitbutton.value = "V";
        break;
    default:
        selected_tool_name = "resistor";
        valuebutton.value = 10;
        unitbutton.value = "Ω";
    }
}