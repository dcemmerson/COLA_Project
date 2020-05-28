"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  // different versions of this page could be delivered depending on
  // user status, so only attach event listeners if they exist on
  // this version of page
  var reqBut = document.getElementById('submitEmail');

  if (reqBut) {
    reqBut.addEventListener('click', function (e) {
      e.preventDefault();
      processEmail();
    });
  }
});

function processEmail() {
  return _processEmail.apply(this, arguments);
} //regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript


function _processEmail() {
  _processEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var button, buttonContainer, emailInput, email, emailErrorSpan, response, res;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            //hide any error messages
            //	document.getElementById('invalid').style.display = 'none';
            button = document.getElementById('submitEmail');
            buttonContainer = document.getElementById('submitButtonContainer');
            emailInput = document.getElementById('email');
            email = emailInput.value.trim();
            emailErrorSpan = document.getElementById('emailError');
            disableElements([button, emailInput]);
            showSpinner(buttonContainer);

            if (validateEmail(email, emailInput, emailErrorSpan)) {
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

            if (!res || !res.success) {
              enableElements([button, emailInput]);
              removeSpinner(buttonContainer);
            }

            return _context.finish(24);

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 20, 24, 27]]);
  }));
  return _processEmail.apply(this, arguments);
}

function validateEmail(email, emailInput, errorSpan) {
  var showErrors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (showErrors) {
    // remove errors caused by previous submission attempts
    // and add errors back if necessary
    errorSpan.style.display = 'none';
    emailInput.classList.remove('usa-input--error');

    if (!re.test(String(email).toLowerCase())) {
      emailInput.classList.add('usa-input--error');
      errorSpan.innerText = "Please enter valid email";
      errorSpan.style.display = 'block';
      return false;
    }

    return true;
  } else {
    // as user types, we just want to remove email error if they enter
    // already tried submitting and now are entering valid email
    if (re.test(String(email).toLowerCase())) {
      errorSpan.style.display = 'none';
      emailInput.classList.remove('usa-input--error');
      return true;
    }

    return false;
  } // this statement doesn't ever execute    


  return true;
}

function processServerResponse(context) {
  var emailForm = document.getElementById('loginFormOuterContainer');
  var invalidSpan = document.getElementById('invalid');
  invalidSpan.style.display = 'none';

  if (context.success) {
    document.getElementById('submitEmail').innerText = 'Redirecting...';
    window.location = context.redirect;
  } else if (context.notFound) {
    invalidSpan.innerHTML = 'Email not found';
    invalidSpan.style.display = 'block';
  } else if (context.alreadyVerified) {
    invalidSpan.innerHTML = 'Account already verified - <a href="/login" class="sm usa-link">Login</a>';
    invalidSpan.style.display = 'block';
  } else {
    document.getElementById('errorAlert').style.display = 'block';
    document.getElementById('loginFormOuterContainer').style.display = 'none';
    emailForm.style.display = 'none';
  }
}