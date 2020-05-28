"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function submitPassword() {
  return _submitPassword.apply(this, arguments);
}

function _submitPassword() {
  _submitPassword = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var context, resp;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            context = {};
            context.oldPassword = document.getElementById('oldPassword').value;
            context.newPassword = document.getElementById('newPassword').value;
            context.newPasswordRe = document.getElementById('newPasswordRe').value;
            _context.next = 6;
            return fetch('/update_password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(context)
            });

          case 6:
            resp = _context.sent;
            _context.next = 9;
            return resp.json();

          case 9:
            return _context.abrupt("return", _context.sent);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _submitPassword.apply(this, arguments);
}