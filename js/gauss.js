/*=====================================*/
/*Name: gauss.js*/
/*Description: Implementations of the Gauss elimination algorithm, both for real and complex numbers*/
/*Sorted: Alphabetically*/
/*List of functions:
    -complexGaussElimination
    -gaussElimination
*/
/*=====================================*/


/*Performs Gaussian elimination with partial pivoting on (n)*(n+1) matrices and returns the result as array.
Supports only complex numbers.
Note: division by zero are handled in a non-standard way, for legit reasons.*/
function complexGaussElimination(A) {
    "use strict";
    var n, i, j, k, maxElement, maxRow, aux, c, x;
    n = A.length;           //number of rows
    //Transforms the matrix to upper triangular.
    for (i = 0; i < n; i++) {
        maxRow = i;
        maxElement = abs(A[i][i]);
        //search for the maximum modulus element among those beneath in the same column (partial pivoting)
        for (j = i + 1; j < n; j++) {
            if (abs(A[j][i]) > maxElement) {
                maxRow = j;
                maxElement = abs(A[j][i]);
            }
        }
        //swap the row with the maximum element's one
        for (j = i; j < n + 1; j++) {
            aux = A[maxRow][j];
            A[maxRow][j] = A[i][j];
            A[i][j] = aux;
        }
        //reduces the rows, one by one, column by column
        for (j = i + 1; j < n; j++) {
            c = opp(div(A[j][i], A[i][i]));
            for (k = i; k < n + 1; k++) {
                if (i === k) {
                    A[j][k] = new Complex(0, 0);
                } else {
                    A[j][k] = add(A[j][k], mul(c, A[i][k]));
                }
            }
        }
    }
    //x is the result array
    x = [];
    //Starts from the bottom of the triangular matrix to generate the result.
    for (i = n - 1; i >= 0; i--) {
        x[i] = div(A[i][n], A[i][i]);       //known term divided by the diagonal element
        //Substitutes the new value in the previous equations
        for (j = i - 1; j >= 0; j--) {
            A[j][n] = sub(A[j][n], mul(x[i], A[j][i]));
        }
    }
    //Format the output, 5 decimal digits.
    for (i = n - 1; i >= 0; i--) {
        x[i].re = Math.round(x[i].re * 10000) / 10000;
        x[i].im = Math.round(x[i].im * 10000) / 10000;
    }
    
    return x;
}

/*Performs Gaussian elimination with partial pivoting on (n)*(n+1) matrices and returns the result as array.
Supports only real numbers.
Note: division by zero are handled in a non-standard way, for legit reasons.*/
function gaussElimination(A) {      //con pivoting parziale
    "use strict";
    var n, i, j, k, maxElement, maxRow, aux, c, x;
    n = A.length;           //number of rows
    //Transforms the matrix to upper triangular.
    for (i = 0; i < n; i++) {
        maxRow = i;
        maxElement = Math.abs(A[i][i]);
        //search for the maximum modulus element among those beneath in the same column (partial pivoting)
        for (j = i + 1; j < n; j++) {
            if (Math.abs(A[j][i]) > maxElement) {
                maxRow = j;
                maxElement = Math.abs(A[j][i]);
            }
        }
        //swap the row with the maximum element's one
        for (j = i; j < n + 1; j++) {
            aux = A[maxRow][j];
            A[maxRow][j] = A[i][j];
            A[i][j] = aux;
        }
        //reduces the rows, one by one, column by column
        for (j = i + 1; j < n; j++) {
            c = -A[j][i] / A[i][i];
            /*If you're a mathematician, I feel sorry for you. Here 0/0=0, this is necessary in order to provide a meaningful output when there are floating voltages. Not very common, but may happen. I just suggest you not to recycle this function for other projects, as the answer might be physically inconsistent for them.*/
            if (isNaN(c)) {
                divbyzero = true;
                c = 0;
            }
            for (k = i; k < n + 1; k++) {
                if (i === k) {
                    A[j][k] = 0;
                } else {
                    A[j][k] += c * A[i][k];
                }
            }
        }
    }
    //x is the result array
    x = [];
    //Starts from the bottom of the triangular matrix to generate the result.
    for (i = n - 1; i >= 0; i--) {
        x[i] = A[i][n] / A[i][i];           //known term divided by the diagonal element
        if (isNaN(x[i])) {                  //again, this is engineering, not math, so 0/0=0 here. Necessarily.
            divbyzero = true;
            x[i] = 0;
        }
        //Substitutes the new value in the previous equations
        for (j = i - 1; j >= 0; j--) {
            A[j][n] = A[j][n] - (x[i] * A[j][i]);
        }
    }
    //Format the output, 5 decimal digits.
    for (i = n - 1; i >= 0; i--) {
        x[i] = Math.round(x[i] * 10000) / 10000;
    }
    
    return x;
}