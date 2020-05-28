"use strict";

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('GET_cola_rates').addEventListener('click', function (event) {
    event.preventDefault();
    GET_cola_rates();
  });
  document.getElementById('UPDATE_cola_rates').addEventListener('click', function (event) {
    event.preventDefault();
    UPDATE_cola_rates();
  });
});
/* this is only for testing purposes... 
   description: send ajax req to server to GET cola_rates
*/

function GET_cola_rates() {
  fetch('./GET_cola_rates').then()["catch"](function (err) {
    return console.log(err);
  });
}

function UPDATE_cola_rates() {
  fetch('/UPDATE_cola_rates').then()["catch"](function (err) {
    return console.log(err);
  });
}