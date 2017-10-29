/*=====================================*/
/*Name: values.js*/
/*Description: Functions to parse or generate values of any kind.*/
/*Sorted: Alphabetically*/
/*List of functions:
    -findBranchFromPoints
    -findImpedance
    -parseAlphaBetaFromControlled
    -parseControllerFromControlled
    -parseFromGenerator
    -updateAllImpedance
*/
/*=====================================*/


/*This function is used to find the id number of a branch, given the id of its two points. However, in order to provide additional info about
the orientation of the branch (that is, does it go from p1 to p2 or from p2 to p1?), the returned value includes a sign. Adding +1 to the result prevents the sign from being discarded when the result is 0; just make sure to subtract it after calling this function.*/
function findBranchFromPoints(p1, p2) {
    "use strict";
    var i;
    for (i = 0; i < Line.cur_ID - 1; ++i) {
        if (branches[i].point1ID === p1 && branches[i].point2ID === p2) {
            return i + 1;
        }
        if (branches[i].point1ID === p2 && branches[i].point2ID === p1) {
            return -(i + 1);
        }
    }
    window.alert("Line not found!");
    return null;
}

/*Calculates the impedance of a branch, which obviously depends on its type.*/
function findImpedance(tool, raw_value) {
    "use strict";
    switch (tool) {
    case "resistor":
        return new Complex(raw_value, 0);
    case "inductor":
        if (omega === null) {
            return new Complex(0, raw_value);
        } else {
            return new Complex(0, raw_value * omega);
        }
    case "capacitor":
        if (omega === null) {
            return new Complex(0, -1 / raw_value);
        } else {
            return new Complex(0, -1 / (raw_value * omega));
        }
    case "wire":
        return new Complex(0, 0);
    default:
        return new Complex(raw_value, 0);
    }
}

/*Parses the input string to extract the alpha or beta factor of controlled generators.*/
function parseAlphaBetaFromControlled(valuestring, regime) {
    "use strict";
    var alphabeta = parseFloat(valuestring);
    if (isNaN(alphabeta)) {
        if (regime === "dc") {
            return 1;
        } else if (regime === "ac") {
            return new Complex(1, 0);
        }
    } else {
        if (regime === "dc") {
            return alphabeta;
        } else if (regime === "ac") {
            return new Complex(alphabeta, 0);
        }
    }
}

/*Parses the input string to extract the controller of controller generators. The index parameter distinguishes between the first and second controller.*/
function parseControllerFromControlled(tool, valuestring, index) {
    "use strict";
    var pos;
    if (index === 1) {
        if (tool === "voltagealpha" || tool === "currentbeta") {
            pos = valuestring.search(/V/);
        } else if (tool === "voltagebeta" || tool === "currentalpha") {
            pos = valuestring.search(/I/);
        }
    } else if (index === 2) {
        pos = valuestring.search(/_/);
    }
    return parseInt(valuestring.substr(pos + 1), 10);
}

/*Parses the input string to extract the value of the generator. It returns a real number if regime is DC, a complex number (phasor) if the generator is sinusoidal.*/
function parseFromGenerator(valuestring, regime) {
    "use strict";
    var sin_pos = -1,
        cos_pos = -1,
        phi_pos = -1,
        omega_pos = -1,
        modulus = 1,
        om = 1,
        phi = 0;
    /*In DC it just parses a float*/
    if (regime === "dc") {
        if (!isNaN(valuestring)) {
            dc_analysis = true;
            return parseFloat(valuestring);
        } else {
            return 0;
        }
    }
    /*In AC regime, first it identifies the position of the parameters within the string, then reads them.
    It also handles the omega (angular frequency).*/
    if (regime === "ac") {
        sin_pos = valuestring.search(/sin/i);
        cos_pos = valuestring.search(/cos/i);
        phi_pos = Math.max(valuestring.lastIndexOf("+"), valuestring.lastIndexOf("-"));
        omega_pos = valuestring.search(/\(/i);
        //if the generator is sinusoidal
        if (sin_pos >= 0 || cos_pos >= 0) {
            ac_analysis = true;
            //attempt to read omega
            om = parseFloat(valuestring.substr(omega_pos + 1));
            if (isNaN(om)) {    //implicit omega
                om = 1;
            }
           //omega is initialized the first time a sinusoidal generator is added.
            if (omega === null) {
                omega = om;
                updateAllImpedance(om, "addomega");
            }
        }
        //if the expression is sine-like
        if (sin_pos >= 0) {
            //if modulus is specified
            if (sin_pos > 0) {
                modulus = parseFloat(valuestring);
            }
            //if phi is specified
            if (phi_pos > 0) {
                phi = parseFloat(valuestring.substr(phi_pos));
            }
            return new Complex(modulus * Math.cos(phi), modulus * Math.sin(phi));
        }
        //if the expression is cosine-like
        if (cos_pos >= 0) {
            if (cos_pos > 0) {
                modulus = parseFloat(valuestring);
            }
            if (phi_pos > 0) {
                phi = parseFloat(valuestring.substr(phi_pos));
            }
            //cos(x)=sin(x + pi/2)
            return new Complex(modulus * Math.cos(phi + Math.PI / 2), modulus * Math.sin(phi + Math.PI / 2));
        }
        //if the generator isn't sinusoidal
        if (sin_pos < 0 && cos_pos < 0) {
            return new Complex(0, 0);
        }
    }
}

/*When the first sinusoidal generator is added (or the last is removed), this function updates all the impedances in the circuit, multiplying them by the new omega value (or dividing by the old one).*/
function updateAllImpedance(om, mode) {
    "use strict";
    var i;
    switch (mode) {
    case "addomega":
        for (i = 0; i < Line.cur_ID; ++i) {
            if (branches[i].T === "inductor") {
                branches[i].V_AC = mul(branches[i].V_AC, new Complex(om, 0));
            } else if (branches[i].T === "capacitor") {
                branches[i].V_AC = div(branches[i].V_AC, new Complex(om, 0));
            }
        }
        break;
    case "removeomega":
        for (i = 0; i < Line.cur_ID; ++i) {
            if (branches[i].T === "inductor") {
                branches[i].V_AC = div(branches[i].V_AC, new Complex(om, 0));
            } else if (branches[i].T === "capacitor") {
                branches[i].V_AC = mul(branches[i].V_AC, new Complex(om, 0));
            }
        }
        break;
    }
}