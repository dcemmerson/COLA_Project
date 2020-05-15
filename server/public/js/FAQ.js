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
        clear_canvas(document.getElementById('previewCanvas'));
        document.getElementById('previewTemplateLabel').innerText = "";
    });
    //when user enters modal, fire fetch req for default template file
    $('#previewTemplateModal').on('show.bs.modal', () => {
        default_template_preview();
    });
});

function pdf_to_canvas(uint8arr) {
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


async function default_template_preview() {
    var label = document.getElementById('previewTemplateLabel');
    var docContainer = document.getElementById('canvasSpinnerContainer');

    label.innerText = "Loading ";
    show_spinner(docContainer, '-lg');
    show_spinner(label);
    $('#previewTemplateModal').modal({ keyboard: true, focus: true });


    fetch(`preview_default_template`)
        .then(response => {
            if (response.status == 200)
                return response.json();
            throw new Error("Error retrieving file");
        })
        .then(res => {
            if (!res.success)
                throw new Error("Error retrieving file");
            remove_spinner(label);
            label.innerText = res.filename;
            let uint8arr = new Uint8Array(res.file.data);
            return pdf_to_canvas(uint8arr);
        })
        .then(() => {
            document.getElementById('previewCanvas').classList.add('light-border');
        })
        .catch(err => {
            console.log(err);
            label.innerText = err;
        })
        .finally(() => {
            remove_spinner(docContainer, '-lg');
            docContainer.innerText = "";
        })

}
