document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('GET_cola_rates').addEventListener('click', event => {
	event.preventDefault();
	GET_cola_rates();
	$('#display_cola_rates').innerText = 'fetching...';
    });
});

/* this is only for testing purposes... 
   description: send ajax req to server to GET cola_rates
*/
function GET_cola_rates(){
    fetch('./GET_cola_rates')
	.then(res => {
	    console.log(res)
	    res.json();
	})
	.then(cola_rates =>{
	    console.log(cola_rates);
	    $('#display_cola_rates').innerText = cola_rates
	})
	.catch(err => console.log(err));
}

