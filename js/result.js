/*=====================================*/
/*Name: result.js*/
/*Description: Functions to display the output in a new window*/
/*Sorted: Alphabetically*/
/*List of functions:
    -displayCurrents
    -displayVoltage
    -showResult
*/
/*=====================================*/


/*Generates the table containing the output currents, then displays it.*/
function displayCurrents(m_ac, m_dc) {
    "use strict";
    var i, t, r, h, d, txt,
        currentsort = function (a, b) {   //sorts by branch points, which are stored in the [1] and [2] components of m_ac and m_dc
            return (a[1] > b[1]) ? 1 : ((a[1] < b[1]) ? -1 : (a[2] > b[2] ? 1 : -1));
        };
    /*Creates the table and its header.*/
    t = document.createElement("table");
    r = document.createElement("tr");
    h = document.createElement("th");
    txt = document.createTextNode("Current");
    h.appendChild(txt);
    r.appendChild(h);
    h = document.createElement("th");
    txt = document.createTextNode("Value (Ampere)");
    h.appendChild(txt);
    r.appendChild(h);
    t.appendChild(r);
    m_ac.sort(currentsort);
    m_dc.sort(currentsort);
    /*Fill the table with output values. The output is prettified to hide implicit values, when possible. Five digits after the decimal point.*/
    for (i = 0; i < Line.cur_ID; ++i) {
        r = document.createElement("tr");
        d = document.createElement("td");
        txt = document.createTextNode("I" + m_ac[i][1] + "→" + m_ac[i][2]);
        d.appendChild(txt);
        r.appendChild(d);
        d = document.createElement("td");
        txt = document.createTextNode("");
        if (m_dc[i][0] !== 0) {
            txt.nodeValue = txt.nodeValue + (Math.floor(m_dc[i][0] * 10000) / 10000);
        }
        if (m_dc[i][0] !== 0 && abs(m_ac[i][0]) !== 0) {
            txt.nodeValue = txt.nodeValue + " + ";
        }
        if (abs(m_ac[i][0]) !== 0) {
            //this includes a conversion from phasor to sinusoidal function
            txt.nodeValue = txt.nodeValue + ((Math.floor(abs(m_ac[i][0])) !== 1) ? (Math.floor(abs(m_ac[i][0]) * 10000) / 10000) + "⋅" : "") + "sin(" + ((omega !== 1) ? omega : "") + ((arg(m_ac[i][0]) !== 0) ? ((arg(m_ac[i][0]) > 0) ? "t +" : "t ") + (Math.floor(arg(m_ac[i][0]) * 10000) / 10000) : "t") + ")";
        }
        if (m_dc[i][0] === 0 && abs(m_ac[i][0]) === 0) {
            txt.nodeValue = txt.nodeValue + "0";
        }
        d.appendChild(txt);
        r.appendChild(d);
        t.appendChild(r);
    }
    result_w.document.getElementById("divcurrent").appendChild(t);
}

/*Generates the table containing the output voltages, then displays it.*/
function displayVoltage(m_ac, m_dc) { //finestra w, matrice m_ac, matrice m_dc
    "use strict";
    var i, t, r, h, d, p, txt;
    /*Creates the table and its header.*/
    t = document.createElement("table");
    r = document.createElement("tr");
    h = document.createElement("th");
    txt = document.createTextNode("Voltage");
    h.appendChild(txt);
    r.appendChild(h);
    h = document.createElement("th");
    txt = document.createTextNode("Value (Volt)");
    h.appendChild(txt);
    r.appendChild(h);
    t.appendChild(r);
    /*Fill the table with output values. The output is prettified to hide implicit values, when possible. Five digits after the decimal point.*/
    for (i = 0; i < Point.cur_ID - 1; ++i) {
        r = document.createElement("tr");
        d = document.createElement("td");
        txt = document.createTextNode("V" + (i + 1));
        d.appendChild(txt);
        r.appendChild(d);
        d = document.createElement("td");
        txt = document.createTextNode("");
        if (m_dc[i] !== 0) {
            txt.nodeValue = txt.nodeValue + (Math.floor(m_dc[i] * 10000) / 10000);
        }
        if (m_dc[i] !== 0 && abs(m_ac[i]) !== 0) {
            txt.nodeValue = txt.nodeValue + " + ";
        }
        if (abs(m_ac[i]) !== 0) {
            //this includes a conversion from phasor to sinusoidal function
            txt.nodeValue = txt.nodeValue + ((Math.floor(abs(m_ac[i])) !== 1) ? (Math.floor(abs(m_ac[i]) * 10000) / 10000) + "⋅" : "") + "sin(" + ((omega !== 1) ? omega : "") + ((arg(m_ac[i]) !== 0) ? ((arg(m_ac[i]) > 0) ? "t +" : "t ") + (Math.floor(arg(m_ac[i]) * 10000) / 10000) : "t") + ")";
        }
        if (m_dc[i] === 0 && abs(m_ac[i]) === 0) {
            txt.nodeValue = txt.nodeValue + "0";
        }
        d.appendChild(txt);
        r.appendChild(d);
        t.appendChild(r);
    }
    result_w.document.getElementById("divvoltage").appendChild(t);
}

/*Opens a new window to display the output.*/
function showResult(voltagesDC, voltagesAC, currentsDC, currentsAC) {
    "use strict";
    //If any kind of division by zero happened through the process, it means that something was wrong in the circuit topology. Ohmulator works fine for disconnected circuits too, though floating voltages are meaningless. It's better to warn the user about this.
    if (divbyzero) {
        window.alert("Warning: The topology of your circuit is disconnected (or almost disconnected).\nIf your're interested in finding the voltages too, don't forget to connect all the subgraphs with a wire!");
    }
    result_w = window.open('', 'Ohmulator: Solution', 'width=400, height=600');
    result_w.document.open();
    result_w.document.writeln('<!DOCTYPE html>');
    result_w.document.writeln('<html lang="en"><head>');
    result_w.document.writeln('<title>Ohmulator: Solution</title>');
    result_w.document.writeln('<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">');
    result_w.document.writeln('<link rel="icon" href="img/favicon.png" type="image/png">');
    result_w.document.writeln('<link rel="stylesheet" type="text/css" href="css/resultstyle.css">');
    result_w.document.writeln('</head><body>');
    result_w.document.writeln('<div class="divtable" id="divvoltage"></div>');
    result_w.document.writeln('<p class="resultnote">Note: the ground node is the point 0.</p>');
    result_w.document.writeln('<div class="divtable" id="divcurrent"></div>');
    displayVoltage(voltagesAC, voltagesDC);
    displayCurrents(currentsAC, currentsDC);
    result_w.document.writeln('</body>');
    result_w.document.close();
}