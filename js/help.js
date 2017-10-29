/*=====================================*/
/*Name: help.js*/
/*Description: Functions to display info about this application*/
/*Sorted: Alphabetically*/
/*List of functions:
    -help
    -showHelpDescription
*/
/*=====================================*/


/*Opens the help modal window*/
function help() {
    "use strict";
    var modalcontainer, modalhelp;
    modalhelp = document.getElementById("helpbox");
    modalhelp.style.display = "block";
    modalcontainer = document.getElementById("modalcontainer");
    modalcontainer.style.display = "block";
}

/*Within the help window, displays the selected help information.*/
function showHelpDescription(index) {
    "use strict";
    var helptextbox, desc, br, i;
    helptextbox = document.getElementById("helptextbox");
    while (helptextbox.firstChild) {
        helptextbox.removeChild(helptextbox.firstChild);
    }
    for (i = 0; i < helpdescriptions[index].length; ++i) {
        desc = document.createTextNode(helpdescriptions[index][i]);
        helptextbox.appendChild(desc);
        br = document.createElement("br");
        helptextbox.appendChild(br);
    }
}