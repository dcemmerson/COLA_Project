"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.addEventListener('DOMContentLoaded', function () {
  var previewAnchors = document.getElementsByClassName('previewDefaultTemplate');
  document.getElementById('jumpToTemplateLooks').addEventListener('click', function (e) {
    e.preventDefault();
    window.location.hash = 'templateLooks';
    $('#templateLooks button')[0].setAttribute('aria-expanded', 'true');
    $('#templateLooks .usa-accordion__content')[0].hidden = false;
  }); //when user exits modal, reset modal to be ready to user to preview
  //another template

  $('#previewTemplateModal').on('hidden.bs.modal', function () {
    clearCanvas(document.getElementById('previewCanvas'));
    document.getElementById('previewTemplateLabel').innerText = "";
  }); //when user enters modal, fire fetch req for default template file

  $('#previewTemplateModal').on('show.bs.modal', function () {
    defaultTemplatePreview();
  });
});

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

function defaultTemplatePreview() {
  return _defaultTemplatePreview.apply(this, arguments);
}

function _defaultTemplatePreview() {
  _defaultTemplatePreview = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var label, docContainer;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            label = document.getElementById('previewTemplateLabel');
            docContainer = document.getElementById('canvasSpinnerContainer');
            label.innerText = "Loading ";
            showSpinner(docContainer, '-lg');
            showSpinner(label);
            $('#previewTemplateModal').modal({
              keyboard: true,
              focus: true
            });
            fetch("/preview_default_template").then(function (response) {
              if (response.status == 200) return response.json();
              throw new Error("Error retrieving file");
            }).then(function (res) {
              if (!res.success) throw new Error("Error retrieving file");
              removeSpinner(label);
              label.innerHTML = "<i id=\"downloadTemplateSpan\" class=\"mr-3 downloadTemplate\" onClick=\"defaultTemplateDownload()\"></i> ".concat(res.filename);
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

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _defaultTemplatePreview.apply(this, arguments);
}

function defaultTemplateDownload() {
  var dlts = document.getElementById('downloadTemplateSpan');
  dlts.classList.remove('downloadTemplate', 'downloadTemplateError', 'downloadTemplateSuccess');
  dlts.classList.add('fa', 'fa-spinner', 'fa-spin');
  return fetch("/download_default_template").then(function (response) {
    if (response.status == 200) return response.json();
    throw new Error("Error retrieving file");
  }).then(function (res) {
    if (!res.success) throw new Error("Error retrieving file");
    clientDownloadFile(res);
    dlts.classList.add('downloadTemplateSuccess');
  })["catch"](function (err) {
    console.log(err);
    dlts.classList.add('downloadTemplateError');
  })["finally"](function () {
    dlts.classList.remove('fa', 'fa-spinner', 'fa-spin');
    setTimeout(function () {
      dlts.classList.remove('downloadTemplateSuccess', 'downloadTemplateError');
      dlts.classList.add('downloadTemplate');
    }, 5000);
  });
}