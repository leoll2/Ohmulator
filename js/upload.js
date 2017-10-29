/*=====================================*/
/*Name: upload.js*/
/*Description: Functions to allow the upload of circuits to the server*/
/*Sorted: Alphabetically*/
/*List of functions:
    -upload
    -uploadClick
    -uploadHandler
*/
/*=====================================*/


/*Stores the current drawn circuit into the storage server.*/
function upload(graphId) {
    "use strict";
    var json_nodes, json_arcs, xmlHttp1, response;
    //stringifies the nodes and arcs objects.
    json_nodes = JSON.stringify(nodes);
    json_arcs = JSON.stringify(branches);
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
                return false;
            }
        }
    }
    xmlHttp1.onreadystatechange = function () {
        if (xmlHttp1.readyState === 4 && xmlHttp1.status === 200) {
            response = JSON.parse(xmlHttp1.responseText);
            if (response.Error) {      //if an error occurred while uploading the items
                window.alert(response.Error);
            } else {
                window.alert(response.Status);  //if no error occurred, should print a successful message
            }
        }
    };
    //Sends the request
    xmlHttp1.open("POST", "php/upload.php", true);
    xmlHttp1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp1.send("graphname=" + graphId + "&nodes=" + json_nodes + "&arcs=" + json_arcs + "&omega=" + omega);
}

/*This function executes when the user clicks the "upload" button in the toolbar. It open the upload modal window.*/
function uploadClick() {
    "use strict";
    var modalcontainer, modalupload, duplicatesignal, uploadid;
    uploadid = document.getElementById("uploadid");
    uploadid.value = "";
    duplicatesignal = document.getElementById("duplicatesignal");
    duplicatesignal.style.backgroundColor = "red";
    duplicatesignal.title = "Invalid name";
    modalupload = document.getElementById("uploadbox");
    modalupload.style.display = "block";
    modalcontainer = document.getElementById("modalcontainer");
    modalcontainer.style.display = "block";
}

/*This function executes when the user clicks the "load" button within the upload window. It closes that window and uploads the circuit.*/
function uploadHandler() {
    "use strict";
    var modalcontainer, modalupload, graphId;
    modalupload = document.getElementById("uploadbox");
    modalupload.style.display = "none";
    modalcontainer = document.getElementById("modalcontainer");
    modalcontainer.style.display = "none";
    graphId = document.getElementById("uploadid").value;
    //Uploads the circuit.
    upload(graphId);
}