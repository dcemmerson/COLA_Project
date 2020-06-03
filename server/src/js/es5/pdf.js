var pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = './js/es5/pdf.worker.min.js';

export default pdfjsLib;
