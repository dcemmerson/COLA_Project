import * as utility from './utility.js';

var pdfjsLib = null;

document.addEventListener('DOMContentLoaded', () => {
    let previewAnchors = document.getElementsByClassName('previewDefaultTemplate');

    document.getElementById('jumpToTemplateLooks').addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = 'templateLooks';
        $('#templateLooks button')[0].setAttribute('aria-expanded', 'true');
        $('#templateLooks .usa-accordion__content')[0].hidden = false;
    });

    //when user exits modal, reset modal to be ready to user to preview
    //another template
    $('#previewTemplateModal').on('hidden.bs.modal', () => {
        utility.clearCanvas(document.getElementById('previewCanvas'));
        document.getElementById('previewTemplateLabel').innerText = "";
    });
    //when user enters modal, fire fetch req for default template file
    $('#previewTemplateModal').on('show.bs.modal', () => {
        defaultTemplatePreview();
    });

});

export function setPdfJsLib(pjl){
    pdfjsLib = pjl;
}

function pdfToCanvas(uint8arr) {
    return new Promise((resolve, reject) => {
        var loadingTask = pdfjsLib.getDocument(uint8arr);
        loadingTask.promise.then(function (pdf) {
            pdf.getPage(1)
                .then(function (page) {
                    var scale = 1;
                    var viewport = page.getViewport({ scale: scale });

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

                })
                .catch(err => {
                    console.log(err);
                    reject("Error generating preview");
                })
        });
    })
}


async function defaultTemplatePreview() {
    var label = document.getElementById('previewTemplateLabel');
    var docContainer = document.getElementById('canvasSpinnerContainer');

    label.innerText = "Loading ";
    utility.showSpinner(docContainer, '-lg');
    utility.showSpinner(label);
    $('#previewTemplateModal').modal({ keyboard: true, focus: true });


    fetch(`/preview_default_template`, {
	method: 'GET',
	credentials: 'same-origin'})
        .then(response => {
            if (response.status == 200)
                return response.json();
            throw new Error("Error retrieving file");
        })
        .then(res => {
            if (!res.success)
                throw new Error("Error retrieving file");
            utility.removeSpinner(label);

	    label.innerText = res.filename;
	    addTemplateDownload(label);

            let uint8arr = new Uint8Array(res.file.data);
            return pdfToCanvas(uint8arr);
        })
        .then(() => {
            document.getElementById('previewCanvas').classList.add('light-border');
        })
        .catch(err => {
            console.log(err);
            label.innerText = err;
        })
        .finally(() => {
            utility.removeSpinner(docContainer, '-lg');
            docContainer.innerText = "";
        })

}

function addTemplateDownload(el){
    let i = document.createElement('i');
    i.setAttribute('id', 'downloadTemplateSpan');
    i.setAttribute('class', 'mr-3 downloadTemplate');

    i.addEventListener('click', defaultTemplateDownload);
    
    el.insertBefore(i, el.childNodes[0]);
}

function defaultTemplateDownload() {
    var dlts = document.getElementById('downloadTemplateSpan');
    dlts.classList.remove('downloadTemplate', 'downloadTemplateError', 'downloadTemplateSuccess');
    dlts.classList.add('fa', 'fa-spinner', 'fa-spin');
    
    return fetch(`/download_default_template`, {
	method: 'GET',
	credentials: 'same-origin'})
        .then(response => {
            if (response.status == 200)
                return response.json();
            throw new Error("Error retrieving file");
        })
        .then(res => {
            if (!res.success)
                throw new Error("Error retrieving file");

            utility.clientDownloadFile(res);

            dlts.classList.add('downloadTemplateSuccess');
        })
        .catch(err => {
            console.log(err);
            dlts.classList.add('downloadTemplateError');
        })
        .finally(() => {
	    dlts.classList.remove('fa', 'fa-spinner', 'fa-spin');

	    setTimeout(() => {
		dlts.classList.remove('downloadTemplateSuccess', 'downloadTemplateError');
		dlts.classList.add('downloadTemplate');
	    }, 5000);
        })

}
