var pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './js/pdf.worker.min.js';

export default pdfjsLib;
