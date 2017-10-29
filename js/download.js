/*=====================================*/
/*Name: download.js*/
/*Description: Functions to allow the download of circuits from the server*/
/*Sorted: Alphabetically*/
/*List of functions:
    -download
    -downloadClick
    -downloadHandler
    -loadCircuit
*/
/*=====================================*/


/*This function downloads the information of a specified circuit from the storage server.*/
function download(graphID) {
    "use strict";
    var xmlHttp1, xmlHttp2, xmlHttp3, response1, response2, response3, i;
    
    /*Creates a http request object*/
    try {
        xmlHttp1 = new XMLHttpRequest();
        xmlHttp2 = new XMLHttpRequest();
        xmlHttp3 = new XMLHttpRequest();
    } catch (e1) {
        try {
            xmlHttp1 = new window.ActiveXObject("Msxml2.XMLHTTP");
            xmlHttp2 = new window.ActiveXObject("Msxml2.XMLHTTP");
            xmlHttp3 = new window.ActiveXObject("Msxml2.XMLHTTP");
        } catch (e2) {
            try {
                xmlHttp1 = new window.ActiveXObject("Microsoft.XMLHTTP");
                xmlHttp2 = new window.ActiveXObject("Microsoft.XMLHTTP");
                xmlHttp3 = new window.ActiveXObject("Microsoft.XMLHTTP");
            } catch (e3) {
                window.alert("Your browser doesn't support AJAX!");
                return false;
            }
        }
    }
    /*When all the 3 requests have a response, it loads the circuit unless an error occured.*/
    xmlHttp3.onreadystatechange = xmlHttp2.onreadystatechange = xmlHttp1.onreadystatechange = function () {
        //all 3 requests ready
        if (xmlHttp1.readyState === 4 && xmlHttp1.status === 200 && xmlHttp2.readyState === 4 && xmlHttp2.status === 200 && xmlHttp3.readyState === 4 && xmlHttp3.status === 200) {
            response1 = JSON.parse(xmlHttp1.responseText);
            response2 = JSON.parse(xmlHttp2.responseText);
            response3 = JSON.parse(xmlHttp3.responseText);
            if (response1.Error) {      //if an error occured while loading nodes
                window.alert(response1.Error);
                return;
            }
            if (response2.Error) {      //if an error occurred while loading arcs
                window.alert(response2.Error);
                return;
            }
            if (response3.Error) {      //if an error occured while loading omega
                window.alert(response3.Error);
                return;
            }
            //If no error occurred, it loads the circuit
            loadCircuit(response1, response2, response3);
        }
    };
    //Sends the ajax requests
    xmlHttp1.open("POST", "php/download.php", true);
    xmlHttp1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp1.send("graphID=" + graphID + "&item=Nodes");
    xmlHttp2.open("POST", "php/download.php", true);
    xmlHttp2.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp2.send("graphID=" + graphID + "&item=Arc");
    xmlHttp3.open("POST", "php/download.php", true);
    xmlHttp3.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp3.send("graphID=" + graphID + "&item=Omega");
}

/*This function executes when the user clicks the download button in the toolbar. It shows the download modal window.*/
function downloadClick() {
    "use strict";
    var modalcontainer, modaldownload;
    modaldownload = document.getElementById("downloadbox");
    modaldownload.style.display = "block";
    modalcontainer = document.getElementById("modalcontainer");
    modalcontainer.style.display = "block";
}

/*This function executes when the user clicks the "load" button inside the download window. It hides the download modal window and starts the download of the circuit.*/
function downloadHandler() {
    "use strict";
    var loadmodebuttons, graphId;
    closeModal();
    loadmodebuttons = document.getElementsByName("loadmode");
    //The user can choose between loading from a default list or using an identifier.
    if (loadmodebuttons[0].checked) {
        graphId = document.getElementsByName("identifier")[0].value;
    }
    if (loadmodebuttons[1].checked) {
        graphId = document.getElementsByName("defaultoption")[0].value;
    }
    //Downloads the circuit.
    download(graphId);
}

/*Loads the circuit whose information are stored in the http response.*/
function loadCircuit(responsenodes, responsearc, responseomega) {
    "use strict";
    var i;
    reset();
    //Load omega
    if (responseomega.Omega === null) {
        omega = null;
    } else {
        omega = parseFloat(responseomega.Omega);
    }
    //Load nodes
    for (i = 0; i < responsenodes.length; ++i) {
        addPoint(parseFloat(responsenodes[i].X), parseFloat(responsenodes[i].Y));
        drawPoint(parseFloat(responsenodes[i].X), parseFloat(responsenodes[i].Y));
    }
    //Load arcs
    for (i = 0; i < responsearc.length; ++i) {
        addLine(parseFloat(responsearc[i].X1), parseFloat(responsearc[i].Y1), parseFloat(responsearc[i].X2), parseFloat(responsearc[i].Y2), parseInt(responsearc[i].Point1, 10), parseInt(responsearc[i].Point2, 10), responsearc[i].Type, responsearc[i].Expression);
        drawLine(parseFloat(responsearc[i].X1), parseFloat(responsearc[i].Y1), parseFloat(responsearc[i].X2), parseFloat(responsearc[i].Y2), responsearc[i].Type, responsearc[i].Expression);
    }
}