"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var LINESPACING = 10;
document.addEventListener('DOMContentLoaded', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
  var subscriptionList;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return fetchUserSubscriptionList();

        case 2:
          subscriptionList = _context2.sent;
          initializeForm();
          document.getElementById('subscribeAdditional').addEventListener('click', function () {
            hideElements($('.alert'));
            document.getElementById('infoContainer').style.display = "block";
            document.getElementById('subscriptionFormContainer').style.display = "block";
          });
          document.getElementById('previewPrevTemplate').addEventListener('click', function (e) {
            e.preventDefault();
            var tempSelect = document.getElementById('templateSelect');
            var templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

            if (validPreview()) {
              templatePreview(templateId);
            }
          });
          document.getElementById('downloadPrevTemplate').addEventListener('click', /*#__PURE__*/function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e) {
              var tempSelect, templateId;
              return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      e.preventDefault();
                      tempSelect = document.getElementById('templateSelect');
                      templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

                      if (!validPreview(true)) {
                        _context.next = 8;
                        break;
                      }

                      this.disabled = true;
                      _context.next = 7;
                      return templateDownload(templateId);

                    case 7:
                      this.disabled = false;

                    case 8:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function (_x) {
              return _ref2.apply(this, arguments);
            };
          }()); //when user exits modal, reset modal to be ready to user to preview
          //another template

          $('#previewTemplateModal').on('hidden.bs.modal', function () {
            clearCanvas(document.getElementById('previewCanvas'));
            document.getElementById('previewTemplateLabel').innerText = "";
          });

        case 8:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2);
})));

function pdfToCanvas(uint8arr) {
  return new Promise(function (resolve, reject) {
    var loadingTask = pdfjsLib.getDocument(uint8arr);
    loadingTask.promise.then(function (pdf) {
      pdf.getPage(1).then(function (page) {
        var scale = 1;
        var viewport = page.getViewport({
          scale: scale
        });
        var canvas = document.getElementById('previewCanvas');
        var context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext);
        resolve();
      })["catch"](function (err) {
        console.log(err);
        reject("Error generating preview");
      });
    });
  });
}

function clearUserSubscriptions() {
  var tbody = document.getElementById('subscriptionTbody');

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  document.getElementById('subscriptionsTable').style.display = 'none';
  document.getElementById('noActiveSubscriptions').style.display = 'none';
}

function clearDropdown(dropdown) {
  while (dropdown.firstChild) {
    dropdown.removeChild(dropdown.firstChild);
  }
}

function newSubscriptionSuccess(postId) {
  hideElements(document.getElementsByClassName('alert'));
  hideElements([document.getElementById('subscriptionFormContainer')]);
  var successContainer = document.getElementById('successContainer');
  successContainer.style.display = 'block'; /////////////// find which post this postId corresponds to ////////////////

  for (var _i = 0, _Object$entries = Object.entries($('#postSelect option')); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        num = _Object$entries$_i[0],
        option = _Object$entries$_i[1];

    if (option.getAttribute('data-COLARatesId') == postId) {
      document.getElementById('successSpan').innerText = option.innerText;
      return;
    }
  }
}
/* name: initializeForm
   preconditions: subscription html DOM content has loaded
   postcondition: if user refreshed page and has a template still selected,
   check if that template is of type doc/docx. If not, then
   highlight it with red border and place x in alert box.
   We didn't use refresh flag on window to ensure there is
   no browser incapatability, as not running this initial
   validation check could cause user confusion if they
   refresh page.
*/


function initializeForm() {
  var tempVal = document.getElementsByClassName('templateVal');
  var upTemp = document.getElementById('uploadTemplate');
  var prevTemp = document.getElementById('templateSelect');
  var reg = /(\.doc|\.docx)$/i; // check if there is a template selected, if so, run
  // post validation, otherwise don't and just leave checkmarks
  // on alert validation to help user understand the alert is responsive

  if (upTemp.value && !reg.exec(upTemp.value)) {
    //ending of file is not .doc or .doc
    removeClasses(tempVal, ['val', 'invalBlank']);
    addClasses(tempVal, ['invalid']);
    upTemp.classList.add('usa-input--error');
    validatePost();
  } else if (prevTemp.selectedIndex !== 0 && !reg.exec(prevTemp[prevTemp.selectedIndex].value)) {
    //ending of file is not .doc or .doc
    removeClasses(tempVal, ['val', 'invalBlank']);
    addClasses(tempVal, ['invalid']);
    prevTemp.classList.add('usa-input--error');
    validatePost();
  }
}

function validPreview() {
  var download = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var prevTemp = document.getElementById('templateSelect');
  document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
  document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
  document.getElementById('downloadTemplateSpan').classList.remove('downloadSuccess', 'downloadError');

  if (prevTemp.selectedIndex === 0) {
    prevTemp.classList.add('usa-input--error');

    if (download) {
      document.getElementById('previousTemplateErrorMsgDownload').style.display = 'block';
    } else {
      document.getElementById('previousTemplateErrorMsgPreview').style.display = 'block';
    }

    return false;
  } else {
    prevTemp.classList.remove('usa-input--error');
    return true;
  }
}

function validatePost() {
  var submit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var postVals = document.getElementsByClassName('postVal');
  var postSelect = document.getElementById('postSelect'); //////////////////// check for selected post ///////////////////

  if (postSelect.selectedIndex === 0) {
    removeClasses(postVals, ['val']);
    addClasses(postVals, ['invalBlank']);
    var valid = false;
    if (submit) postSelect.classList.add('usa-input--error');
  } else {
    removeClasses(postVals, ['invalBlank']);
    addClasses(postVals, ['val']);
    postSelect.classList.remove('usa-input--error');
    var valid = true;
  }

  return valid;
}

function validateSubscription() {
  var submit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var valid = false;
  var tempVals = document.getElementsByClassName('templateVal');
  var upTemp = document.getElementById('uploadTemplate');
  var prevTemp = document.getElementById('templateSelect');
  var reg = /(\.doc|\.docx)$/i;
  valid = validatePost(submit); ////////////////// check for template - ensure doc/docx ending ///////

  if (!upTemp.value && prevTemp.selectedIndex === 0) {
    removeClasses(tempVals, ['val', 'invalid']);
    addClasses(tempVals, ['invalBlank']);

    if (submit) {
      upTemp.classList.add('usa-input--error');
      prevTemp.classList.add('usa-input--error');
    }

    valid = false;
  } else if (!reg.exec(upTemp.value) && !reg.exec(prevTemp[prevTemp.selectedIndex].value)) {
    //ending of file is not .doc or .doc
    removeClasses(tempVals, ['val', 'invalBlank']);
    addClasses(tempVals, ['invalid']);

    if (submit) {
      document.getElementById('infoContainer').style.display = 'none';
      document.getElementById('warningContainer').style.display = 'block';
    }

    if (upTemp.value) {
      upTemp.classList.add('usa-input--error');
    } else if (prevTemp.value) {
      prevTemp.classList.add('usa-input--error');
    }

    valid = false;
  } else {
    //everything looks okay
    removeClasses(tempVals, ['invalBlank', 'invalid']);
    addClasses(tempVals, ['val']);
    upTemp.classList.remove('usa-input--error');
    prevTemp.classList.remove('usa-input--error');
    valid = valid && true;
    document.getElementById('uploadTemplateErrorMsg').style.display = 'none';
    document.getElementById('previousTemplateErrorMsg').style.display = 'none';
    document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
    document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
  }

  return valid;
}

function displayUnsubscribeAlert(element, post, country, tok, subscriptionId) {
  element.getElementsByClassName('unsubscribeMsgSpan')[0].innerText = "".concat(country, " (").concat(post, ")");
  element.style.display = 'block';
  $('#undoLink')[0].setAttribute('data-tok', tok);
  $('#undoLink')[0].setAttribute('data-post', post);
  $('#undoLink')[0].setAttribute('data-country', country);
  $('#undoLink')[0].setAttribute('data-subscriptionId', subscriptionId);
  $('#undoLink')[0].removeEventListener('click', restoreSubscription);
  $('#undoLink')[0].addEventListener('click', restoreSubscription);
}

function restoreSubscription(e) {
  e.preventDefault();
  var undoLink = document.getElementById('undoLink');
  deleteSubscription(null, undoLink.getAttribute('data-tok'), undoLink.getAttribute('data-post'), undoLink.getAttribute('data-country'), undoLink.getAttribute('data-subscriptionId'));
}

function checkEmptySubscriptions() {
  var table = document.getElementById('subscriptionsTable');
  var tbody = document.getElementById('subscriptionTbody');
  var msgDiv = document.getElementById('noActiveSubscriptions');
  var isVisibleRow = false; //iterate through table to check if there are any visible rows

  tbody.childNodes.forEach(function (row) {
    if (row.style.display !== "none") isVisibleRow = true;
  });

  if (!isVisibleRow) {
    table.style.display = 'none';
    msgDiv.style.display = 'block';
  } else {
    table.style.display = 'table';
    msgDiv.style.display = 'none';
  }
}

function dismissAlert(alert) {
  alert.style.display = 'none';
  document.getElementById('unsubscribeAlertBlank').style.display = 'block';
}

function populateTemplateDropdown(dropdown, templates) {
  var option = document.createElement('option');
  dropdown.appendChild(option);
  templates.forEach(function (template) {
    option = document.createElement('option');
    option.setAttribute('data-templateId', template.id);
    option.innerText = template.name;
    dropdown.appendChild(option);
  });
}

function addSubscriptionToTable(sub) {
  var trs = document.getElementById('subscriptionTbody').getElementsByClassName('subscriptionRow');
  populateSubscriptionTable({
    subscriptionList: [sub]
  });
  sortRows(document.getElementById('subscriptionsTable'));
}

function checkPreviousAllowance99() {
  var prevs = document.getElementsByClassName('prevAllowance');

  for (var i = 0; i < prevs.length; i++) {
    if (prevs[i].innerText.match('n/a') && prevs[i].parentElement.style.display !== "none") {
      document.getElementById('prevAllowanceWarning').style.display = 'flow';
      return;
    }
  }

  document.getElementById('prevAllowanceWarning').style.display = 'none';
}

function populateSubscriptionTable(res) {
  var rowNum = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var tbody = document.getElementById('subscriptionTbody');
  res.subscriptionList.forEach(function (sub) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-subscriptionId', sub.subscriptionId);
    tr.setAttribute('class', 'subscriptionRow');
    addTableIcons(tr, sub);
    var td1 = document.createElement('td');
    td1.setAttribute('class', 'td countryName tdCell');
    td1.setAttribute('data-value', sub.country);
    td1.innerText = sub.country;
    tr.appendChild(td1);
    var td2 = document.createElement('td');
    td2.setAttribute('class', 'td postName tdCell');
    td2.setAttribute('data-value', sub.post);
    td2.innerText = sub.post;
    tr.appendChild(td2);
    var td3 = document.createElement('td');
    td3.setAttribute('class', 'td prevAllowance tdCell');
    td3.setAttribute('data-value', sub.prevAllowance);
    td3.innerText = sub.prevAllowance + '%';
    tr.appendChild(td3);

    if (sub.prevAllowance === -99) {
      td3.innerText = 'n/a';
      var sup = document.createElement('sup');
      sup.innerText = '*';
      td3.appendChild(sup);
    }

    var td4 = document.createElement('td');
    td4.setAttribute('class', 'td tdCell');
    td4.setAttribute('data-value', sub.allowance);
    td4.innerText = sub.allowance + '%';
    tr.appendChild(td4);
    var td5 = document.createElement('td');
    td5.setAttribute('class', 'td tdCell');
    td5.setAttribute('data-value', Date.parse(new Date(sub.effectiveDate)));
    td5.innerText = sub.effectiveDate;
    tr.appendChild(td5);

    if (rowNum === null) {
      tbody.appendChild(tr);
    } else {
      tbody.insertBefore(tr, tbody.childNodes[rowNum - 1]);
    }
  });
  checkPreviousAllowance99();
}
/* name: addTableIcons
   description: place email, download, preview, and delete font awesome icons in
                this table tr row. Attach event listeners and necessary tokens and other
		values for event handles.
*/


function addTableIcons(tr, sub) {
  //we are adding 2 tr inside tdMain, then two td inside each tr
  var tdMain = document.createElement('td');
  var tr1 = document.createElement('tr');
  var tr2 = document.createElement('tr');
  var td1 = document.createElement('td');
  var td2 = document.createElement('td');
  var td3 = document.createElement('td');
  var td4 = document.createElement('td');
  tdMain.setAttribute('class', 'td tdButtons'); //preview doc button

  var prevBtn = document.createElement('button');
  prevBtn.setAttribute('class', 'btn-clear');
  prevBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
  prevBtn.setAttribute('title', "Preview ".concat(sub.country, " (").concat(sub.post, ") document"));
  prevBtn.addEventListener('click', function (e) {
    e.preventDefault();
    templatePreview(null, sub.tok);
  });
  var iPrev = document.createElement('i');
  iPrev.setAttribute('class', 'preview');
  prevBtn.appendChild(iPrev);
  td1.appendChild(prevBtn); //download doc button

  var downloadBtn = document.createElement('button');
  downloadBtn.setAttribute('class', 'btn-clear');
  downloadBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
  downloadBtn.setAttribute('title', "Download ".concat(sub.country, " (").concat(sub.post, ") document"));
  var iDl = document.createElement('i');
  iDl.setAttribute('class', 'downloadSubscription');
  downloadBtn.appendChild(iDl);
  downloadBtn.addEventListener('click', function (e) {
    e.preventDefault();
    downloadSubscription(iDl, sub.tok, sub.post, sub.country);
  });
  td2.appendChild(downloadBtn); //delete button

  var delBtn = document.createElement('button');
  delBtn.setAttribute('class', 'btn-clear');
  delBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
  delBtn.setAttribute('title', "Delete ".concat(sub.country, " (").concat(sub.post, ") subscription"));
  var iDel = document.createElement('i');
  iDel.setAttribute('class', 'trashCan');
  delBtn.appendChild(iDel);
  delBtn.addEventListener('click', function (e) {
    e.preventDefault();
    deleteSubscription(iDel, sub.tok, sub.post, sub.country, sub.subscriptionId);
  });
  td3.appendChild(delBtn); //fire off email button

  var emailBtn = document.createElement('button');
  emailBtn.setAttribute('class', 'btn-clear');
  emailBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
  emailBtn.setAttribute('title', "Send email for this subscription: ".concat(sub.country, " (").concat(sub.post, ") now"));
  var iEmail = document.createElement('i');
  iEmail.setAttribute('class', 'email');
  emailBtn.appendChild(iEmail);
  emailBtn.addEventListener('click', function (e) {
    e.preventDefault();
    fireSubscriptionEmail(iEmail, sub.tok, sub.post, sub.country);
  });
  td4.appendChild(emailBtn);
  tdMain.appendChild(tr1);
  tr1.appendChild(td1);
  tr1.appendChild(td2);
  tdMain.appendChild(tr2);
  tr2.appendChild(td3);
  tr2.appendChild(td4);
  tr.appendChild(tdMain);
}
/* name: updateTable
   precondition: subscriptionId must is id of valid subscription in db
                 del is boolean. true means we will hide this elemnet from table, else display.
   postconditions: table has been search for subscription id and tr corresponding to
                   subscriptionId has been either hidden or deleted depending on del.
*/


function updateTable(subscriptionId, del) {
  var tbody = document.getElementById('subscriptionTbody');
  var trs = tbody.getElementsByTagName('tr');

  for (var i = 0; i < trs.length; i++) {
    if (trs[i].getAttribute('data-subscriptionId') == subscriptionId) {
      if (del) {
        trs[i].style.display = 'none';
      } else {
        trs[i].style.display = 'table-row';
      }
    }
  }
}

function sortRows(table) {
  var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var sortCol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  // Use static class to keep track of sortCol and direction.
  // Necessary to sort table correctly when user adds new subscription.
  if (sortCol !== null) {
    // sort request is coming from user
    sortColG = sortCol;
  }

  var userRows = table.getElementsByClassName('subscriptionRow');
  var list = constructRowObjects(userRows, sortColG);

  if (sortCol !== null && element !== null && element.classList.contains('sortedDown')) {
    insertionSort(list, true);
    removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
    element.classList.remove('sort');
    element.classList.add('sortedUp');
    sortAscG = true;
  } else if (sortCol !== null && element !== null && element.classList.contains('sortedUp')) {
    insertionSort(list, false);
    removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
    element.classList.remove('sort');
    element.classList.add('sortedDown');
    sortAscG = false;
  } else if (sortCol !== null && element !== null) {
    // Then we need to sort ascending - user did not just re-sort by this column.
    insertionSort(list, true);
    removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
    element.classList.remove('sort');
    element.classList.add('sortedUp');
    sortAscG = false;
  } else {
    // This method was triggered by user creating new subscription and we
    // just need to resort the list in the same order it's already sorted
    insertionSort(list, sortAscG);
  }

  clearTableRows(table);
  displayTableRows(table, list);
}

function constructRowObjects(trs, sortCol) {
  var list = [];
  var val;

  for (var i = 0; i < trs.length; i++) {
    val = trs[i].getElementsByClassName('tdCell')[sortCol].getAttribute('data-value');
    list.push({
      element: trs[i],
      value: parseInt(val) ? parseInt(val) : val.toLowerCase() // val could be a string or number and need to sort accordingly

    });
  }

  return list;
}

function downloadFromPreview(_x2, _x3, _x4, _x5, _x6) {
  return _downloadFromPreview.apply(this, arguments);
} // Use these two global variables to keep track of sorting done since
// the static class below does not work on mobile...  :(


function _downloadFromPreview() {
  _downloadFromPreview = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(el, templateId, tok, post, country) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            el.classList.remove('downloadSubscriptionLg', 'downloadSubscriptionErrorLg', 'downloadSubscriptionSuccessLg');
            el.classList.add('fa', 'fa-spinner', 'fa-spin');
            _context3.prev = 2;

            if (!(templateId !== "null")) {
              _context3.next = 8;
              break;
            }

            _context3.next = 6;
            return templateDownload(templateId);

          case 6:
            _context3.next = 9;
            break;

          case 8:
            // download subscription with dynamic changes
            downloadSubscription(el, tok, post, country);

          case 9:
            el.classList.add('downloadSubscriptionSuccessLg');
            _context3.next = 16;
            break;

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3["catch"](2);
            console.log(_context3.t0);
            el.classList.add('downloadSubscriptionErrorLg');

          case 16:
            _context3.prev = 16;
            el.classList.remove('fa', 'fa-spinner', 'fa-spin');
            setTimeout(function () {
              el.classList.remove('downloadSubscriptionSuccessLg', 'downloadSubscriptionErrorLg');
              el.classList.add('downloadSubscriptionLg');
            }, 5000);
            return _context3.finish(16);

          case 20:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[2, 12, 16, 20]]);
  }));
  return _downloadFromPreview.apply(this, arguments);
}

var sortColG = 0;
var sortAscG = true; // use a static class here mainly to circument using global variables,
// as well as protect the sort column variable

/*
class Sort {
    static _col = 0;
    static _asc = true;
    
    static getCol(){
	return this._col;
    }

    static setCol(sc){
	this._col = sc;
    }

    static getAsc(){
	return this._asc;
    }

    static setAsc(asc){
	this._asc = asc;
    }
}
*/