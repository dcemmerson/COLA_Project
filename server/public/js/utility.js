"use strict";

document.addEventListener('DOMContentLoaded', function () {
  displayReturnToTop();
});

function hiddenTimer(element) {
  var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;
  setTimeout(function () {
    element.hidden = true;
  }, time);
}

function classTimer(element, from, to, fin) {
  var time = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  element.classList.remove(from);
  element.classList.add(to);

  if (time) {
    setTimeout(function () {
      element.classList.remove(to);
      element.classList.add(fin);
    }, time);
  }
}

function showSpinner(element) {
  var lg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var insertFirst = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var i = document.createElement('i');
  i.setAttribute('class', "fa fa-spinner fa-spin spinner".concat(lg));

  if (insertFirst && element.firstChild) {
    element.insertBefore(i, element.firstChild);
  } else {
    element.appendChild(i);
  }
}

function removeSpinner(element) {
  var lg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  try {
    var spinners = element.getElementsByClassName("fa fa-spinner fa-spin spinner".concat(lg));

    for (var i = 0; i < spinners.length; i++) {
      element.removeChild(spinners[i]);
    }
  } catch (err) {
    console.log("No spinner to remove");
    console.log(err);
  }
}
/* name: showPopover
   preconditions: el is a jquery object containing the element on which to show popover
   postconditions: popover with borderColor shown for time milliseconds
*/


function showPopover(el) {
  var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;
  var borderColor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'rgba(0, 0, 0, 0.2';
  $('.popover').css('border-color', borderColor);
  el.popover('show');
  setTimeout(function (popel) {
    popel.popover('dispose');
  }, time, el);
}

function setErrorBorder(el) {
  var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;
  el.classList.add('errorBorder');
  setTimeout(function (el) {
    el.classList.remove('errorBorder');
  }, time, el);
}
/* name: scrollSave
   preconditions: arr is an array of elements for which we want to save the scroll x/y values
   postconditions: return an array of objects that contains references to each element along
                   with the saved scroll x/y values.
*/


function scrollSave(arr) {
  var context = [];
  arr.forEach(function (el) {
    context.push({
      element: el,
      scrollY: el.scrollTop,
      scrollX: el.scrollLeft
    });
  });
  return context;
}
/* name: scrollRestore
   preconditions: arr is array of objects. Each object should be of format:
                    {element: element, scrollY: scrollY, scrollX: scrollX}. Best when
		    used in combination wiht scrollSave
   postconditions: scroll x/y values updated for all elements in arr
*/


function scrollRestore(arr) {
  document.getElementsByTagName('html')[0].style.scrollBehavior = "auto";
  arr.forEach(function (el) {
    el.element.scrollTo(el.scrollX, el.scrollY);
  });
  document.getElementsByTagName('html')[0].style.scrollBehavior = "smooth";
}

function addClasses(elements, classes) {
  var _loop = function _loop(i) {
    classes.forEach(function (cl) {
      elements[i].classList.add(cl);
    });
  };

  for (var i = 0; i < elements.length; i++) {
    _loop(i);
  }
}

function removeClasses(elements, classes) {
  var _loop2 = function _loop2(i) {
    classes.forEach(function (cl) {
      elements[i].classList.remove(cl);
    });
  };

  for (var i = 0; i < elements.length; i++) {
    _loop2(i);
  }
}

function hideElements(elements) {
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.display = 'none';
  }
}

function clearInnerText(elements) {
  for (var i = 0; i < elements.length; i++) {
    elements[i].innerText = '';
  }
}

function clearCanvas(canvas) {
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.classList.remove('light-border');
  canvas.height = '1rem';
}

function displayReturnToTop() {
  var html = document.getElementsByTagName('html')[0];
  var body = document.getElementsByTagName('body')[0];

  if (html.clientHeight + 100 < body.clientHeight) {
    var rtt = document.getElementsByClassName('usa-footer__return-to-top')[0];
    rtt.style.display = 'block';
  }
}

function disableElements(elements) {
  for (var i = 0; i < elements.length; i++) {
    elements[i].disabled = true;
  }
}

function enableElements(elements) {
  for (var i = 0; i < elements.length; i++) {
    elements[i].disabled = false;
  }
}

function disableForm(form) {
  var elements = form.elements;

  for (var i = 0; i < elements.length; i++) {
    elements[i].disabled = true;
  }
}

function enableForm(form) {
  var elements = form.elements;

  for (var i = 0; i < elements.length; i++) {
    elements[i].disabled = false;
  }
}

function clientDownloadFile(res) {
  var a = document.createElement('a'); //    var data = new File(new Uint8Array(res.file.data), res.filename);

  var uint8arr = new Uint8Array(res.file.data);
  var data = new Blob([uint8arr]); //    var data = new Blob(uint8arr);

  var url = window.URL.createObjectURL(data);
  a.href = url;
  a.download = res.filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}
/********************* table sorting methods *************************/


function clearTableGroups(table) {
  var tbody = table.getElementsByTagName('tbody');

  while (tbody.length > 0) {
    tbody[0].remove();
  }
}

function clearTableRows(table) {
  var tbody = table.getElementsByTagName('tbody')[0];

  while (tbody.childNodes.length > 0) {
    tbody.childNodes[0].remove();
  }
}

function displayTableGroups(table, list) {
  list.forEach(function (l) {
    table.appendChild(l.element);

    if (l.nextElement) {
      table.appendChild(l.nextElement);
    }
  });
}

function displayTableRows(table, list) {
  var tbody = table.getElementsByTagName('tbody')[0];
  list.forEach(function (l) {
    tbody.appendChild(l.element);

    if (l.nextElement) {
      tbody.appendChild(l.nextElement);
    }
  });
}

function removeSortClasses(elements) {
  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.remove('sort', 'sortedUp', 'sortedDown');
    elements[i].classList.add('sort');
  }
}

function insertionSort(list) {
  var asc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var element;
  var key;
  var j;
  var temp;

  for (var i = 1; i < list.length; i++) {
    key = list[i].value;
    j = i;

    if (asc) {
      while (j > 0 && key < list[j - 1].value) {
        j--;
      }
    } else {
      while (j > 0 && key > list[j - 1].value) {
        j--;
      }
    }

    element = list[i];
    list.splice(i, 1);
    list.splice(j, 0, element);
  }
}
/* Call this method after DOMContentLoaded to force user browser
   to download all icons used in css background images.
   There has been an issue with mobile browsers not downloading
   icons on demand.
*/


function downloadIcons() {
  var cache = document.getElementById('iconCache');
  var classList = ['downloadSubscription', 'downloadSubscriptionError', 'downloadSubscriptionSuccess', 'downloadSubscriptionSecondary', 'downloadSubscriptionLg', 'downloadSubscriptionErrorLg', 'downloadSubscriptionSuccessLg', 'downloadSubscriptionSecondaryLg', 'email', 'emailSuccess', 'emailError', 'preview', 'previewSecondary', 'trashCan', 'trashCanSecondary'];
  classList.forEach(function (cl) {
    var i = document.createElement('i');
    i.classList.add(cl);
    cache.appendChild(i);
  });
}