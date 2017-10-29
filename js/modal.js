/*=====================================*/
/*Name: modal.js*/
/*Description: Functions to handle modal windows*/
/*Sorted: Alphabetically*/
/*List of functions:
    -closeModal
*/
/*=====================================*/


/*Closes all the modal windows.*/
function closeModal() {
    "use strict";
    var modalcontainer, modaldownload, modalupload, modalhelp;
    modaldownload = document.getElementById("downloadbox");
    modaldownload.style.display = "none";
    modalupload = document.getElementById("uploadbox");
    modalupload.style.display = "none";
    modalhelp = document.getElementById("helpbox");
    modalhelp.style.display = "none";
    modalcontainer = document.getElementById("modalcontainer");
    modalcontainer.style.display = "none";
}