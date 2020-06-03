import {setPdfJsLib} from '../subscriptions.js';

document.addEventListener('DOMContentLoaded', () => {
    import(/* webpackChunkName: "pdf" */ './pdf.js')
	.then(({default: pLib}) => setPdfJsLib(pLib));
});
