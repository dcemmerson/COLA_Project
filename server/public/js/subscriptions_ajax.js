"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* file contains elements related to preview/submit templates for subscriptions */
document.addEventListener('DOMContentLoaded', function () {
  /* register event handlers to ensure user does only one of the following:
     a. upload a new template to use when creating new subscription
     b. select a previous template to use with new subscription
  */
  document.getElementById('templateSelect').addEventListener('change', function (e) {
    document.getElementById('uploadTemplate').value = '';
    validateSubscription();
  });
  document.getElementById('uploadTemplate').addEventListener('input', function (e) {
    var select = document.getElementById('templateSelect');
    select.selectedIndex = 0;
    validateSubscription();
  });
  document.getElementById('submitNewSubscription').addEventListener('click', /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              e.preventDefault();
              document.getElementById('submitNewSubscription').disabled = true;
              showSpinner(document.getElementById('addNewSubscriptionButtons'));

              if (!validateSubscription(true)) {
                _context.next = 6;
                break;
              }

              _context.next = 6;
              return submitNewSubscription();

            case 6:
              document.getElementById('submitNewSubscription').disabled = false;
              removeSpinner(document.getElementById('addNewSubscriptionButtons'));

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
});

function templatePreview(templateId) {
  var tok = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var label = document.getElementById('previewTemplateLabel');
  var docContainer = document.getElementById('canvasSpinnerContainer');
  label.innerText = "Loading ";
  showSpinner(docContainer, '-lg');
  showSpinner(label);
  $('#previewTemplateModal').modal({
    keyboard: true,
    focus: true
  });
  var fe;

  if (templateId) {
    fe = fetch("/preview_template?templateId=".concat(templateId));
  } else {
    fe = fetch("/preview_subscription?tok=".concat(tok));
  }

  fe.then(function (response) {
    if (response.status == 200) return response.json();
    throw new Error("Error retrieving file");
  }).then(function (res) {
    if (!res.success) throw new Error("Error retrieving file");
    removeSpinner(label);
    label.innerHTML = "<i id=\"downloadFromPreview\" class=\"mr-3 downloadSubscriptionLg\" onClick=\"downloadFromPreview(this, '".concat(templateId, "', '").concat(tok, "', '").concat(res.post, "', '").concat(res.country, "')\"></i> ").concat(res.filename);
    var uint8arr = new Uint8Array(res.file.data);
    return pdfToCanvas(uint8arr);
  }).then(function () {
    document.getElementById('previewCanvas').classList.add('light-border');
  })["catch"](function (err) {
    console.log(err);
    label.innerText = err;
  })["finally"](function () {
    removeSpinner(docContainer, '-lg');
    docContainer.innerText = "";
  });
}

function templateDownload(templateId) {
  var dlts = document.getElementById('downloadTemplateSpan');
  dlts.classList.remove('downloadError', 'downloadSuccess');
  showSpinner(dlts, ' md', true);
  return fetch("/download_template?templateId=".concat(templateId)).then(function (response) {
    if (response.status == 200) return response.json();
    throw new Error("Error retrieving file");
  }).then(function (res) {
    if (!res.success) throw new Error("Error retrieving file");
    clientDownloadFile(res);
    dlts.classList.add('downloadSuccess');
  })["catch"](function (err) {
    console.log(err);
    dlts.classList.add('downloadError');
  })["finally"](function () {
    removeSpinner(dlts, ' md');
  });
}

function submitNewSubscription() {
  return _submitNewSubscription.apply(this, arguments);
}

function _submitNewSubscription() {
  _submitNewSubscription = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var uploadTemp, prevTemp, post, postId, upload, result, previous, tempFetch;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            uploadTemp = document.getElementById('uploadTemplate');
            prevTemp = document.getElementById('templateSelect');
            post = document.getElementById('postSelect');
            postId = post[post.selectedIndex].getAttribute('data-COLARatesId');
            showSpinner(document.getElementById('subscriptionsContainerSpinner'));
            document.getElementById('tableSpinner').display = 'inline-block';
            _context2.prev = 6;

            if (!uploadTemp.value) {
              _context2.next = 14;
              break;
            }

            upload = true;
            _context2.next = 11;
            return addNewSubscriptionWithTemplateFile(postId, uploadTemp);

          case 11:
            result = _context2.sent;
            _context2.next = 19;
            break;

          case 14:
            if (!(prevTemp.selectedIndex != 0)) {
              _context2.next = 19;
              break;
            }

            previous = true;
            _context2.next = 18;
            return addNewSubscriptionPrevTemplate(postId, prevTemp);

          case 18:
            result = _context2.sent;

          case 19:
            if (!result.success) {
              _context2.next = 28;
              break;
            }

            //reset post dropdown/files selection
            post.selectedIndex = 0;
            prevTemp.selectedIndex = 0;
            uploadTemp.value = "";
            newSubscriptionSuccess(postId);
            tempFetch = fetchUserTemplates();
            addSubscriptionToTable(result);
            _context2.next = 33;
            break;

          case 28:
            if (!result.error) {
              _context2.next = 32;
              break;
            }

            throw new Error(result.error);

          case 32:
            throw result;

          case 33:
            _context2.next = 40;
            break;

          case 35:
            _context2.prev = 35;
            _context2.t0 = _context2["catch"](6);
            console.log(_context2.t0);
            hideElements(document.getElementsByClassName('alert'));

            if (!result.success) {
              document.getElementById('warningContainer').style.display = 'block';

              if (upload) {
                document.getElementById('uploadTemplateErrorMsg').innerText = result.errorMessage;
                document.getElementById('uploadTemplateErrorMsg').style.display = 'block';
              } else {
                document.getElementById('previousTemplateErrorMsg').innerText = result.errorMessage;
                document.getElementById('previousTemplateErrorMsg').style.display = 'block';
              }
            } else {
              document.getElementById('errorContainer').style.display = 'block';
            }

          case 40:
            _context2.prev = 40;
            document.getElementById('tableSpinner').display = 'none';
            removeSpinner(document.getElementById('subscriptionsContainerSpinner'));
            checkEmptySubscriptions();
            return _context2.finish(40);

          case 45:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[6, 35, 40, 45]]);
  }));
  return _submitNewSubscription.apply(this, arguments);
}

function addNewSubscriptionPrevTemplate(_x2, _x3) {
  return _addNewSubscriptionPrevTemplate.apply(this, arguments);
}

function _addNewSubscriptionPrevTemplate() {
  _addNewSubscriptionPrevTemplate = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(postId, prevTemp) {
    var context, response;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            context = {
              postId: postId,
              templateId: prevTemp[prevTemp.selectedIndex].getAttribute('data-templateId')
            };
            _context3.next = 4;
            return fetch('/add_new_subscription_with_prev_template', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/JSON'
              },
              body: JSON.stringify(context)
            });

          case 4:
            response = _context3.sent;
            _context3.next = 7;
            return response.json();

          case 7:
            return _context3.abrupt("return", _context3.sent);

          case 10:
            _context3.prev = 10;
            _context3.t0 = _context3["catch"](0);
            console.log(_context3.t0);
            return _context3.abrupt("return", _context3.t0);

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 10]]);
  }));
  return _addNewSubscriptionPrevTemplate.apply(this, arguments);
}

function addNewSubscriptionWithTemplateFile(_x4, _x5) {
  return _addNewSubscriptionWithTemplateFile.apply(this, arguments);
}

function _addNewSubscriptionWithTemplateFile() {
  _addNewSubscriptionWithTemplateFile = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(postId, uploadTemp) {
    var fd, response;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(!window.File || !window.FileReader || !window.FileList || !window.Blob)) {
              _context4.next = 4;
              break;
            }

            console.log("File API not supported by broser");
            $('addSubscriptionMessageDiv').innerText = "Incompatible browser";
            return _context4.abrupt("return");

          case 4:
            _context4.prev = 4;
            fd = new FormData();
            fd.append('upload', uploadTemp.files[0]);
            fd.append('postId', postId);
            _context4.next = 10;
            return fetch('/add_new_subscription_with_template_file', {
              method: 'POST',
              body: fd
            });

          case 10:
            response = _context4.sent;
            _context4.next = 13;
            return response.json();

          case 13:
            return _context4.abrupt("return", _context4.sent);

          case 16:
            _context4.prev = 16;
            _context4.t0 = _context4["catch"](4);
            console.log(_context4.t0);
            return _context4.abrupt("return", _context4.t0);

          case 20:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[4, 16]]);
  }));
  return _addNewSubscriptionWithTemplateFile.apply(this, arguments);
}

function fetchUserTemplates() {
  return _fetchUserTemplates.apply(this, arguments);
}

function _fetchUserTemplates() {
  _fetchUserTemplates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var templateSelect, response, res;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            templateSelect = document.getElementById('templateSelect');
            clearDropdown(templateSelect);
            templateSelect.innerHTML = '<option>Loading...<i class="fa fa-spinner spinner"></i></option>';
            _context5.next = 6;
            return fetch('/get_user_template_list');

          case 6:
            response = _context5.sent;
            _context5.next = 9;
            return response.json();

          case 9:
            res = _context5.sent;
            clearDropdown(templateSelect);
            populateTemplateDropdown(templateSelect, res.templates);
            _context5.next = 18;
            break;

          case 14:
            _context5.prev = 14;
            _context5.t0 = _context5["catch"](0);
            console.log(_context5.t0);
            templateSelect.innerHTML = '<option>Error retrieving templates</option>';

          case 18:
            _context5.prev = 18;
            return _context5.finish(18);

          case 20:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[0, 14, 18, 20]]);
  }));
  return _fetchUserTemplates.apply(this, arguments);
}

function fetchUserSubscriptionList() {
  return _fetchUserSubscriptionList.apply(this, arguments);
}
/* name: deleteSubscription
   preconditions: tok contains all necessary info needed in /delete_subscriptions route,
                    most importantly subscriptionId and makeActive (bool)
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been either deactivated or reactivated, depending on
                   calling context and token
*/


function _fetchUserSubscriptionList() {
  _fetchUserSubscriptionList = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var response, res;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            clearUserSubscriptions();
            _context6.next = 4;
            return fetch('/get_user_subscription_list');

          case 4:
            response = _context6.sent;
            _context6.next = 7;
            return response.json();

          case 7:
            res = _context6.sent;
            removeSpinner(document.getElementById('subscriptionsContainerSpinner'));
            populateSubscriptionTable(res);
            checkEmptySubscriptions();
            _context6.next = 16;
            break;

          case 13:
            _context6.prev = 13;
            _context6.t0 = _context6["catch"](0);
            console.log(_context6.t0);

          case 16:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[0, 13]]);
  }));
  return _fetchUserSubscriptionList.apply(this, arguments);
}

function deleteSubscription(_x6, _x7, _x8, _x9, _x10) {
  return _deleteSubscription.apply(this, arguments);
}
/* name: downloadSubscription
   preconditions: tok contains all necessary info needed in /download_subscription route,
                    most importantly subscriptionId. Server validates requested template 
		    belongs to requester. 
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
                   if error occurred somewhere in process.
*/


function _deleteSubscription() {
  _deleteSubscription = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(thisEl, tok, post, country, subscriptionId) {
    var context, spinner, tableCover, response, res;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            context = {};
            spinner = document.getElementById('tableSpinner');
            tableCover = document.getElementById('tableCover');

            if (thisEl) {
              thisEl.parentNode.disabled = true;
              classTimer(thisEl, 'trashCan', 'trashCanSecondary');
            }

            tableCover.style.display = 'block';
            spinner.style.display = 'inline-block';
            _context7.next = 9;
            return fetch("/delete_subscription?tok=".concat(tok));

          case 9:
            response = _context7.sent;
            _context7.next = 12;
            return response.json();

          case 12:
            res = _context7.sent;
            hideElements(document.getElementsByClassName('unsubscribeAlert'));

            if (!res.deleted) {
              _context7.next = 19;
              break;
            }

            displayUnsubscribeAlert(document.getElementById('unsubscribeAlertSuccess'), res.post, res.country, res.tok, subscriptionId);
            updateTable(subscriptionId, true);
            _context7.next = 25;
            break;

          case 19:
            if (!res.restored) {
              _context7.next = 24;
              break;
            }

            displayUnsubscribeAlert(document.getElementById('resubscribeAlertSuccess'), res.post, res.country);
            updateTable(subscriptionId, false);
            _context7.next = 25;
            break;

          case 24:
            throw new Error("Error updating ".concat(res.country, " (").concat(res.post, ")"));

          case 25:
            _context7.next = 31;
            break;

          case 27:
            _context7.prev = 27;
            _context7.t0 = _context7["catch"](0);
            if (_context7.t0) console.log(_context7.t0);
            displayUnsubscribeAlert(document.getElementById('unsubscribeAlertError'), post, country);

          case 31:
            _context7.prev = 31;

            if (thisEl) {
              thisEl.parentNode.disabled = false;
              classTimer(thisEl, 'trashCanSecondary', 'trashCan');
            }

            tableCover.style.display = 'block'; //	tableCover.style.animation = 'slideCoverRemove 0.5s 1 forwards';

            spinner.style.display = 'none';
            checkEmptySubscriptions();
            checkPreviousAllowance99();
            return _context7.finish(31);

          case 38:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[0, 27, 31, 38]]);
  }));
  return _deleteSubscription.apply(this, arguments);
}

function downloadSubscription(thisEl, tok, post, country) {
  var spinner = document.getElementById('tableSpinner');
  spinner.style.display = 'inline-block';
  thisEl.parentNode.disabled = true;
  classTimer(thisEl, 'downloadSubscription', 'downloadSubscriptionSecondary');
  return fetch("/download_subscription?tok=".concat(tok)).then(function (response) {
    if (response.status == 200) return response.json();
    throw new Error("Error retrieving file");
  }).then(function (res) {
    if (!res.success) throw new Error("Error retrieving file");
    clientDownloadFile(res);
    classTimer(thisEl, 'downloadSubscriptionSecondary', 'downloadSubscriptionSuccess', 'downloadSubscription', 3000);
  })["catch"](function (err) {
    console.log(err);
    hideElements(document.getElementsByClassName('unsubscribeAlert'));
    document.getElementById('downloadSubscriptionAlertError').style.display = 'block';
    document.getElementById('downloadSubscriptionErrorMsgSpan').innerText = "".concat(country, " (").concat(post, ")");
    classTimer(thisEl, 'downloadSubscriptionSecondary', 'downloadSubscriptionError', 'downloadSubscription', 8000);
  })["finally"](function () {
    thisEl.parentNode.disabled = false;
    spinner.style.display = 'none';
  });
}
/* name: fireSubscriptionEmail
   preconditions: tok contains all necessary info needed in /fire_subscription_email route,
                    most importantly subscriptionId. Server validates requested template 
		    belongs to requester. 
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
                   if error occurred somewhere in process.
*/


function fireSubscriptionEmail(thisEl, tok, post, country) {
  var spinner = document.getElementById('tableSpinner');
  spinner.style.display = 'inline-block';
  thisEl.parentNode.disabled = true;
  classTimer(thisEl, 'email', 'emailSecondary');
  return fetch("/fire_subscription_email?tok=".concat(tok)).then(function (response) {
    if (response.status == 200) return response.json();
    throw new Error("Error retrieving file");
  }).then(function (res) {
    if (!res.success) throw new Error("Error retrieving file");
    classTimer(thisEl, 'emailSecondary', 'emailSuccess', 'email', 3000);
  })["catch"](function (err) {
    console.log(err);
    hideElements(document.getElementsByClassName('unsubscribeAlert'));
    document.getElementById('fireSubscriptionEmailAlertError').style.display = 'block';
    document.getElementById('fireSubscriptionEmailErrorMsgSpan').innerText = "".concat(country, " (").concat(post, ")");
    document.getElementById('fireSubscriptionEmailErrorToSpan').innerText = document.getElementById('userEmail').value;
    classTimer(thisEl, 'emailSecondary', 'emailError', 'email', 8000);
  })["finally"](function () {
    thisEl.parentNode.disabled = false;
    spinner.style.display = 'none';
  });
}