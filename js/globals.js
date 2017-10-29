/*=====================================*/
/*Name: globals.js*/
/*Description: This file stores all the javascript global variables used within the project*/
/*Sorted: Logically*/
/*List of functions: -*/
/*=====================================*/

var drawrectangle,                  //getBoundingClientRect of the drawing board
    omega,                          //angular frequency of ac generators (if any)
    mouseoverpoint,                 //true if the mouse is hovering on a point in the drawing board, false otherwise
    mouseoverpointX,                //if mouseoverpoint is true, the X of that point
    mouseoverpointY,                //if mouseoverpoint is true, the Y of that point
    mouseoverpointID,               //if mouseoverpoint is true, the ID number of that point
    nodes = [],                     //array of all nodes
    branches = [],                  //array of all branches
    result_w,                       //window to display the result
    dc_analysis,                    //true if a DC analysis is needed, false otherwise
    ac_analysis,                    //true if a AC analysis is needed, false otherwise
    divbyzero,                      //true if a division by zero happened while solving,
    selected_tool_name,             //name of the selected component
    buttonel,                       //button of the tool being used
    changetool,                     //function to handle button clicks
    redpoint,                       //function to highlight points
    blackpoint,                     //function to highlight points
    redline,                        //function to highlight lines
    blackline,                      //function to highlight lines
    redsymbol,                      //function to highlight lines
    blacksymbol,                    //function to highlight lines
    rmpoint,                        //function to remove points
    rmline,                         //function to remove lines
    rmsymbol,                       //function to remove symbols
    filters = [["wire", "wire"], ["resistor", "resistor"], ["inductor", "inductor"], ["capacitor", "capacitor"], ["voltage", "voltage"], ["current", "current"], ["currentalpha", "controlled_current_alpha"], ["currentbeta", "controlled_current_beta"], ["voltagealpha", "controlled_voltage_alpha"], ["voltagebeta", "controlled_voltage_beta"]],
    helpdescriptions = [["Welcome to Ohmulator!", "", "This interactive online web-application helps you in solving electric circuits, specifically DC (Direct Current) and AC (Alternating Current) ones. It offers a very simple and intuitive interface, which allows you to draw and solve your circuits quickly.", "", "You don't need to download anything, (almost) everything runs inside your browser. No registration required, no payment, no cookies. This is completely free, enjoy it!"],
        ["Ohmulator is very easy to learn!", "", "First of all, select an electrical component from the bottom toolbar. Then, insert its value in the input field. The units of measure are implicit (don't write them!) and use the SI. For more information about the format, please check the \"Technical details\" section. Now, just click twice in the white board to draw your component. Repeat these steps until your circuit is complete.", "", "Once you've drawn your circuit, click the \"Run\" button to solve it. If you have made any mistake, no problem, just use the \"Remove\" button to delete the wrong elements. Click the \"Reset\" button to clean the whole board.", "", "When you don't know the meaning of any button, check the \"Features\" section, or just hold the mouse on it to see a description."],
        ["COMMAND BUTTONS", "", "-Reset: completely cleans the blackboard", "-Run: solves the circuit", "-Download: load from our server your previously saved circuit, or one of the default example circuits.", "-Upload: save the currently drawn circuit into our server", "-Help: you already know its purpose...", "", "-Remove: click on the object to remove", "", "COMPONENTS", "", "-Node: a point, not really a physical component", "-Line: a short circuit between two points", "-Resistor: just a simple resistance", "-Inductor: a coil that stores energy when current flows through it", "-Capacitor: two metallic plates which store energy when a potential difference is applied to them", "-Voltage generator: a perfect battery, always outputs its nominal voltage", "-Current generator: always outputs the same current, independently of anything else", "-Controlled generators: voltage/current generators whose output depends on another voltage/current in the circuit", "", "-Input: write here the value/expression of your component just before drawing it"],
        ["Ohmulator uses a fresh implementation (i.e. I made it!) of the node-voltage analysis method to solve the circuits. The equation system is then solved by Gaussian elimination, which I adapted for complex numbers.", "", "UNITS OF MEASURE", "They're implicit in the input, even though they're displayed in the board. They follow the Internation Standard: Ohm, Volt, Ampere, Farad and Henry.", "", "INPUT FORMAT", "For passive components (resistor, capacitor, inductor) the value must be a positive number, and respectively represents resistance, capacitance and inductance. Node and line (short circuit) don't require any input.", "For independent generator, the value can be either a number (in that case, the generator is assumed to work in DC regime) or an expression like:", "[modulus]sin([pulsation]t+[phase]), in which case the generator works in AC regime. The quantities between square brackets represent optional parameters.", "For controlled by voltage generators, the expression must be like:", "[amplification]V[nodeA]_[nodeB]", "while controlled current sources are like:", "[amplification]I[nodeA]_[nodeB].", "It may seem difficult, but it's not!", "", "Anyway, when you switch to a new component, the input field will display an example of allowed format."], ["My name is Leonardo Lai, I'm from Terni (Italy) and I currently live and study in Pisa (Italy), where I'm trying to achieve a BS in Computer Engineering. I've developed Ohmulator as a project for an exam, \"Web design\".", "", "If you want to contact me for any reason, use one of the following:", "Mail: leonardo[dot]lai[at]live[dot]com", "Linkedin: linkedin.com/in/leonardo-lai-b9407ba1"], ["Oh, you have stumbled upon a bug?", "That's bad, I'm sorry, but it's also great because I may fix it once for all!", "", "Please, send me a mail (the address is in \"Author\"), accurately describing what happened and whether you're able to reproduce the issue. If possible, upload the buggy circuit too and tell me the name.", "", "Thanks a lot for your support!"]];