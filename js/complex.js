/*=====================================*/
/*Name: complex.js*/
/*Description: Object and methods to support complex numbers arithmetic*/
/*Sorted: Logically*/
/*List of functions:
    - Complex
    - add
    - sub
    - mul
    - div
    - abs
    - arg
    - opp
    - inv
*/
/*=====================================*/


/*Complex number object*/
function Complex(r, i) {
    "use strict";
    this.re = r;
    this.im = i;
}

/*Addition*/
function add(a, b) {
    "use strict";
    return new Complex(a.re + b.re, a.im + b.im);
}

/*Subtraction*/
function sub(a, b) {
    "use strict";
    return new Complex(a.re - b.re, a.im - b.im);
}

/*Multiplication*/
function mul(a, b) {
    "use strict";
    return new Complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

/*Division.
Note that divisions by zero return (0, 0) instead of something undefined, this is intentional and useful for our purposes.*/
function div(a, b) {
    "use strict";
    if (b.re === 0 && b.im === 0) {
        divbyzero = true;
        return new Complex(0, 0);   //if you're a mathematician, look away! 0/0=0 here, it's needed to make disconnected topology circuits work.
    }
    return new Complex(((a.re * b.re + a.im * b.im) / (b.re * b.re + b.im * b.im)),
                       ((a.im * b.re - a.re * b.im) / (b.re * b.re + b.im * b.im)));
}

/*Modulus*/
function abs(a) {
    "use strict";
    return Math.sqrt(a.re * a.re + a.im * a.im);
}

/*Angle (+pi, -pi)*/
function arg(a) {
    "use strict";
    return Math.atan2(a.im, a.re);
}

/*Opposite*/
function opp(a) {
    "use strict";
    return new Complex(-a.re, -a.im);
}

/*Inverse*/
function inv(a) {
    "use strict";
    if (a.re === 0 && a.im === 0) {
        return new Complex(Infinity, Infinity); //not correct at all, but better than NaN
    }
    return new Complex(a.re / (a.re * a.re + a.im * a.im), -a.im / (a.re * a.re + a.im * a.im));
}