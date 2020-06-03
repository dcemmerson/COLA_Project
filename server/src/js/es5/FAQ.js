import {setPdfJsLib} from '../FAQ.js';

document.addEventListener('DOMContentLoaded', () => {
    import(/* webpackChunkName: "pdf" */ './pdf.js')
	.then(({default: pLib}) =>  setPdfJsLib(pLib));
});
