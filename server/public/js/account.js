"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('showPassword').addEventListener('click', function (e) {
    e.preventDefault();
    var pwd = document.getElementById('newPassword');
    var pwdMatch = document.getElementById('newPasswordRe');
    var oldPwd = document.getElementById('oldPassword');

    if (pwd.getAttribute('type') === 'password') {
      oldPwd.setAttribute('type', 'text');
      pwd.setAttribute('type', 'text');
      pwdMatch.setAttribute('type', 'text');
      this.innerText = 'Hide password';
    } else {
      oldPwd.setAttribute('type', 'password');
      pwd.setAttribute('type', 'password');
      pwdMatch.setAttribute('type', 'password');
      this.innerText = 'Show password';
    }
  });
  document.getElementById('submitNewPassword').addEventListener('click', function (e) {
    e.preventDefault();
    if (validPassword(true)) updatePassword();
  });
});

function showPasswordForm() {
  var passwordBtn = document.getElementById('changePasswordBtnDiv');
  var passwordForm = document.getElementById('passwordFormContainer');
  passwordBtn.classList.add('hidden');
  passwordBtn.classList.remove('shown');
  passwordForm.classList.remove('hidden');
  passwordForm.classList.add('shown');
}

function hidePasswordForm() {
  var passwordBtn = document.getElementById('changePasswordBtnDiv');
  var passwordForm = document.getElementById('passwordFormContainer');
  passwordForm.classList.remove('shown');
  passwordForm.classList.add('hidden');
  passwordBtn.classList.add('show');
  passwordBtn.classList.remove('hidden');
}

function updatePassword() {
  return _updatePassword.apply(this, arguments);
}

function _updatePassword() {
  _updatePassword = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var context;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            document.getElementById('submitNewPassword').disabled = true;
            showSpinner(document.getElementById('submitBtnDiv'));
            _context.next = 5;
            return submitPassword();

          case 5:
            context = _context.sent;
            hideElements($('.changePasswordAlert')); //check if server found any issues with password

            invalidPasswordServer(context);
            _context.next = 15;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context["catch"](0);
            console.log(_context.t0);
            hideElements($('.changePasswordAlert'));
            document.getElementById('alertError').display = 'block';

          case 15:
            removeSpinner(document.getElementById('submitBtnDiv'));
            document.getElementById('submitNewPassword').disabled = false;

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 10]]);
  }));
  return _updatePassword.apply(this, arguments);
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
  if (!validPassword && submit) $('#newPassword')[0].classList.add('usa-input--error');else if (validPassword) $('#newPassword')[0].classList.remove('usa-input--error');
  return validPassword;
}

function updateLengthValidationMark(field, req, submit) {
  var validPassword = true;
  if (submit) clearInnerText($('.passwordError'));

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
/* name: validPassword
   preconditions: user has clicked submit on change password form, or just entered input
                  into New password field   
   postconditions: determine if user has entered valid new password
   description:
*/


function validPassword() {
  var submit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var newPassword = $('#newPassword')[0];
  var newPasswordRe = $('#newPasswordRe')[0];
  var lowerCase = /[a-z]/g;
  var upperCase = /[A-Z]/g;
  var numbers = /[0-9]/g;
  var special = /\W|_/g;
  var minLength = 8;
  var validPassword = updateRegexValidationMarks(newPassword, [{
    regex: lowerCase,
    elements: $('.lowercaseReq')
  }, {
    regex: upperCase,
    elements: $('.uppercaseReq')
  }, {
    regex: numbers,
    elements: $('.numberReq')
  }, {
    regex: special,
    elements: $('.specialReq')
  }], submit);
  validPassword = updateLengthValidationMark(newPassword, {
    minLength: minLength,
    elements: $('.minCharReq')
  }, submit) && validPassword;

  if (submit && validPassword && newPassword.value !== newPasswordRe.value) {
    $('#newPasswordReError')[0].innerText = 'Password re-entry mismatch';
    $('#newPasswordReError')[0].style.display = 'block';
    newPasswordRe.classList.add('usa-input--error');
    validPassword = false;
  } else {
    newPasswordRe.classList.remove('usa-input--error');
    $('#newPasswordReError')[0].style.display = 'none';
    validPassword = validPassword && true;
  }

  return validPassword;
}
/* name: invalidPasswordServer
   preconditions: ajax req was made to server. Server determined something
                  the user sent was invalid.
   postconditions: user is notified of reason server rejected
   description: this method should rarely ever be called. Only two cases when this
                method should actually run. 1. user enters wrong password as "Old
		password" field. 2. if user tampers with client side
		validation checking and bypasses validate password in
		account.js (this file). Server runs additional validation
		to catch this, in which case this method will run.
*/


function invalidPasswordServer(context) {
  if (context.passwordUpdated) {
    //pword updated in db
    document.getElementById('alertSuccess').style.display = 'block';
    document.getElementById('passwordFormContainer').style.display = 'none';
  } else {
    //figure out which method to give user and where on screen to place
    //new password doesn't meet criteria
    //(8+ char, 1+ uppercase, 1+ lowercase, 1+ number, 1+ special char)
    if (context.invalidNewPassword) {
      document.getElementById('alertInfo').style.display = 'block';
      document.getElementById('newPasswordError').innerText = context.invalidMessage;
      document.getElementById('newPasswordError').style.display = 'block';
    } //new password re-entry mismatch
    else if (context.invalidNewPasswordRe) {
        document.getElementById('alertWarning').style.display = 'block';
        document.getElementById('newPasswordReError').innerText = context.invalidMessage;
        document.getElementById('newPasswordReError').style.display = 'block';
      } //incorect old password was provided by user
      else if (context.invalidOldPassword) {
          document.getElementById('alertInfo').style.display = 'block';
          document.getElementById('oldPasswordError').innerText = context.invalidMessage;
          document.getElementById('oldPasswordError').style.display = 'block';
        } else {
          //server error occurred
          document.getElementById('alertError').style.display = 'block';
          document.getElementById('passwordFormContainer').style.display = 'none';
        }
  }
}