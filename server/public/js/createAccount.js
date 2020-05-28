"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('showPassword').addEventListener('click', function (e) {
    e.preventDefault();
    var pwd = document.getElementById('password');
    var pwdMatch = document.getElementById('passwordRe');

    if (pwd.getAttribute('type') === 'password') {
      pwd.setAttribute('type', 'text');
      pwdMatch.setAttribute('type', 'text');
      this.innerText = 'Hide password';
    } else {
      pwd.setAttribute('type', 'password');
      pwdMatch.setAttribute('type', 'password');
      this.innerText = 'Hide password';
    }
  });
  document.getElementById('submitNewAccount').addEventListener('click', function (e) {
    e.preventDefault();

    if (validEmailAddMarks() && validPassword(true)) {
      createAccount();
    }
  });
});

function createAccount() {
  return _createAccount.apply(this, arguments);
}

function _createAccount() {
  _createAccount = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var context;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            //disable everything on form so user doesn't keep submitting or try
            //to make changes if RTT from server is slow				
            disableForm(document.getElementById('changePasswordForm'));
            removeServerErrors();
            showSpinner(document.getElementById('submitBtnDiv'));
            _context.next = 6;
            return submitCredentials();

          case 6:
            context = _context.sent;
            //check if server found any issues with email/password
            processServerResponse(context);
            _context.next = 15;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context["catch"](0);
            console.log(_context.t0); //	hideElements(document.getElementsByClassName('changePasswordAlert'));

            document.getElementById('alertError').style.display = 'block';
            document.getElementById('formInnerContainer').styl.display = 'none';

          case 15:
            _context.prev = 15;

            if (!context || !context.success) {
              removeSpinner(document.getElementById('submitBtnDiv'));
              enableForm(document.getElementById('changePasswordForm'));
            }

            return _context.finish(15);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 10, 15, 18]]);
  }));
  return _createAccount.apply(this, arguments);
}

function updateRegexValidationMarks(field, arr, submit) {
  var validPassword = true;
  arr.forEach(function (val) {
    if (field.value.match(val.regex) === null) {
      for (var i = 0; i < val.elements.length; i++) {
        val.elements[i].classList.remove('val', 'invalid', 'invalBlank');
      }

      validPassword = false;
      if (submit) for (var _i = 0; _i < val.elements.length; _i++) {
        val.elements[_i].classList.add('invalid');
      } else for (var _i2 = 0; _i2 < val.elements.length; _i2++) {
        val.elements[_i2].classList.add('invalBlank');
      }
    } else {
      for (var _i3 = 0; _i3 < val.elements.length; _i3++) {
        val.elements[_i3].classList.remove('invalBlank', 'invalid');

        val.elements[_i3].classList.add('val');
      }
    }
  });
  if (!validPassword && submit) document.getElementById('password').classList.add('usa-input--error');else if (validPassword) {
    document.getElementById('password').classList.remove('usa-input--error');
  }
  return validPassword;
}

function updateLengthValidationMark(field, req, submit) {
  var validPassword = true;
  if (submit) clearInnerText(document.getElementsByClassName('passwordError'));

  if (field.value.length < req.minLength) {
    for (var i = 0; i < req.elements.length; i++) {
      req.elements[i].classList.remove('val', 'invalid', 'invalBlank');
    }

    validPassword = false;
    if (submit) for (var _i4 = 0; _i4 < req.elements.length; _i4++) {
      req.elements[_i4].classList.add('invalid');
    } else for (var _i5 = 0; _i5 < req.elements.length; _i5++) {
      req.elements[_i5].classList.add('invalBlank');
    }
  } else {
    for (var _i6 = 0; _i6 < req.elements.length; _i6++) {
      req.elements[_i6].classList.remove('invalBlank', 'invalid');

      req.elements[_i6].classList.add('val');
    }
  }

  return validPassword;
}
/* name: validEmail
   preconditions: user has clicked submit on create account form 
   postconditions: determine if user has entered valid email address format
   description: calls validEmailAddMarks calls validEmail to check if email
                provided is valid, and adds markup/styling if not valid, else
		any markup/styling from previous calls is removed.
*/
//regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript


function validEmailAddMarks() {
  var emailInput = document.getElementById('email');
  var email = emailInput.value;
  var emailErrorSpan = document.getElementById('emailError'); //remove errors caused by previous submission attempts

  emailErrorSpan.style.display = 'none';
  emailInput.classList.remove('usa-input--error');

  if (!validEmail(emailInput)) {
    emailInput.classList.add('usa-input--error');
    emailErrorSpan.innerText = "Please enter valid email";
    emailErrorSpan.style.display = 'block';
    document.getElementById('email').classList.add('usa-input--error');
    return false;
  }

  return true;
}
/* name: validEmail
   preconditions: emailInput is user email input field.
   postconditions: regular epxression used to check if email address fits valid format.
                   returns true if valid, else false. Removes markup/styling if
		   email is valid format
  description: this method can be called from the "oninput" field in the html doc,
               or upon user submitting new account information.
*/


function validEmail() {
  var emailInput = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.getElementById('email');
  var email = emailInput.value;
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (!re.test(String(email).toLowerCase())) {
    return false;
  } //if user entered valid email, remove any potential errors, shown when user submitted


  emailInput.classList.remove('usa-input--error');
  document.getElementById('emailError').style.display = 'none';
  return true;
}
/* name: validPassword
   preconditions: user has clicked submit on create account form, or just entered input
                  into New password field   
   postconditions: determine if user has entered valid new password
   description:
*/


function validPassword() {
  var submit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var password = document.getElementById('password');
  var passwordRe = document.getElementById('passwordRe');
  var lowerCase = /[a-z]/g;
  var upperCase = /[A-Z]/g;
  var numbers = /[0-9]/g;
  var special = /\W|_/g;
  var minLength = 8;
  var validPassword = updateRegexValidationMarks(password, [{
    regex: lowerCase,
    elements: document.getElementsByClassName('lowercaseReq')
  }, {
    regex: upperCase,
    elements: document.getElementsByClassName('uppercaseReq')
  }, {
    regex: numbers,
    elements: document.getElementsByClassName('numberReq')
  }, {
    regex: special,
    elements: document.getElementsByClassName('specialReq')
  }], submit);
  validPassword = updateLengthValidationMark(password, {
    minLength: minLength,
    elements: document.getElementsByClassName('minCharReq')
  }, submit) && validPassword;

  if (submit && validPassword && password.value !== passwordRe.value) {
    document.getElementById('passwordReError').innerText = 'Password re-entry mismatch';
    document.getElementById('passwordReError').style.display = 'block';
    passwordRe.classList.add('usa-input--error');
    validPassword = false;
  } else {
    passwordRe.classList.remove('usa-input--error');
    document.getElementById('passwordReError').style.display = 'none';
    validPassword = validPassword && true;
  }

  return validPassword;
}
/* name: processServerResponse
   preconditions: ajax req was made to server. Server either changes user
                  password or notifies user if there was an issue
   postconditions: user is notified of reason server rejected, or password change
   description: this method should rarely ever be called and show user error.
                Errors should have been caught by client-side validation.
                Two possibilites when this method is called:
                1. user successfully creates account
		2. if user tampers with client side
		validation checking and bypasses validate password in
		recover.js (this file). Server runs additional validation
		to catch this, in which case this method will run and show issue.
*/


function processServerResponse(context) {
  if (context.accountCreated) {
    document.getElementById('submitNewAccount').innerText = 'Redirecting...';
    window.location = context.redirect;
  } else {
    //figure out which method to give user and where on screen to place
    //new password doesn't meet criteria
    //(8+ char, 1+ uppercase, 1+ lowercase, 1+ number, 1+ special char)
    if (context.userAlreadyExists || context.invalidEmail) {
      document.getElementById('emailError').innerText = context.invalidMessage;
      document.getElementById('emailError').style.display = 'block';
      document.getElementById('email').classList.add('usa-input--error');
    } else if (context.invalidNewPassword) {
      //	    document.getElementById('alertInfo').style.display = 'block';
      document.getElementById('passwordError').innerText = context.invalidMessage;
      document.getElementById('passwordError').style.display = 'block';
      document.getElementById('password').classList.add('usa-input--error');
    } //new password re-entry mismatch
    else if (context.invalidNewPasswordRe) {
        //	    document.getElementById('alertWarning').style.display = 'block';
        document.getElementById('passwordReError').innerText = context.invalidMessage;
        document.getElementById('passwordReError').style.display = 'block';
        document.getElementById('passwordRe').classList.add('usa-input--error');
      } else {
        document.getElementById('alertError').style.display = 'block';
        document.getElementById('formInnerContainer').style.display = 'none';
      }
  }
}

function removeServerErrors() {
  document.getElementById('emailError').innerText = '';
  document.getElementById('emailError').style.display = 'none';
  document.getElementById('passwordError').innerText = '';
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('passwordReError').innerText = '';
  document.getElementById('passwordReError').style.display = 'none';
}