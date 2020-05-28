"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('submitEmail').addEventListener('click', function (event) {
    event.preventDefault();
    processEmail();
  });
  displayReturnToTop();
});

function processEmail() {
  return _processEmail.apply(this, arguments);
} //regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript


function _processEmail() {
  _processEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var button, buttonContainer, emailInput, email, errorSpan, response, res;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            button = document.getElementById('submitEmail');
            buttonContainer = document.getElementById('submitButtonContainer');
            emailInput = document.getElementById('email');
            email = emailInput.value.trim();
            errorSpan = document.getElementById('emailError');
            disableElements([button, email]);
            showSpinner(buttonContainer);

            if (validateEmail(email, emailInput, errorSpan)) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("return");

          case 10:
            hideElements(document.getElementsByClassName('usa-alert'));
            _context.next = 13;
            return submitRequest(email);

          case 13:
            response = _context.sent;
            _context.next = 16;
            return response.json();

          case 16:
            res = _context.sent;
            processServerResponse(res);
            _context.next = 24;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](0);
            console.log(_context.t0);
            processServerResponse({
              error: true
            });

          case 24:
            _context.prev = 24;
            enableElements([button, email]);
            removeSpinner(buttonContainer);
            return _context.finish(24);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 20, 24, 28]]);
  }));
  return _processEmail.apply(this, arguments);
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
    var alert = document.getElementById('successAlert');
    emailForm.style.display = 'none';
  } else if (context.notFound) {
    var alert = document.getElementById('warningAlert');
  } else if (context.error) {
    var alert = document.getElementById('errorAlert');
    emailForm.style.display = 'none';
  }

  alert.style.display = 'block';
  alert.getElementsByClassName('alertEmail')[0].innerText = context.email;
}