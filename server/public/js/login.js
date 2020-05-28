"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('submitCredentials').addEventListener('click', function (e) {
    e.preventDefault();
    processCredentials();
  });
  displayReturnToTop();
});

function processCredentials() {
  return _processCredentials.apply(this, arguments);
} //regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript


function _processCredentials() {
  _processCredentials = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var button, buttonContainer, emailInput, email, emailErrorSpan, password, response, res;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            //hide any error messages
            document.getElementById('invalid').style.display = 'none';
            document.getElementById('unverified').style.display = 'none';
            button = document.getElementById('submitCredentials');
            buttonContainer = document.getElementById('submitButtonContainer');
            emailInput = document.getElementById('email');
            email = emailInput.value.trim();
            emailErrorSpan = document.getElementById('emailError');
            password = document.getElementById('pwd').value;
            disableElements([button, email]);
            showSpinner(buttonContainer);

            if (validateEmail(email, emailInput, emailErrorSpan)) {
              _context.next = 13;
              break;
            }

            return _context.abrupt("return");

          case 13:
            hideElements(document.getElementsByClassName('usa-alert'));
            _context.next = 16;
            return submitRequest(email, password);

          case 16:
            response = _context.sent;
            _context.next = 19;
            return response.json();

          case 19:
            res = _context.sent;
            processServerResponse(res);
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](0);
            console.log(_context.t0);
            processServerResponse({
              error: true
            });

          case 27:
            _context.prev = 27;

            if (!res || !res.success) {
              enableElements([button, email]);
              removeSpinner(buttonContainer);
            }

            return _context.finish(27);

          case 30:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 23, 27, 30]]);
  }));
  return _processCredentials.apply(this, arguments);
}

function validateEmail(email, emailInput, errorSpan) {
  //remove errors caused by previous submission attempts
  errorSpan.style.display = 'none';
  emailInput.classList.remove('usa-input--error');
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (!re.test(String(email).toLowerCase())) {
    emailInput.classList.add('usa-input--error');
    errorSpan.innerText = "Please enter valid email";
    errorSpan.style.display = 'block';
    return false;
  }

  return true;
}

function processServerResponse(context) {
  var emailForm = document.getElementById('formOuterContainer');

  if (context.success) {
    document.getElementById('submitCredentials').innerText = 'Redirecting...';
    window.location = context.redirect;
  } else if (context.invalid) {
    if (!context.isVerified) {
      document.getElementById('unverifiedEmail').innerText = context.unverifiedEmail;
      document.getElementById('unverified').style.display = 'block';
    } else {
      document.getElementById('invalid').style.display = 'block';
    }
  } else {
    document.getElementById('errorAlert').style.display = 'block';
    document.getElementById('loginFormOuterContainer').style.display = 'none';
  }
}