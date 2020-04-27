document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('showPassword').addEventListener('click', e => {
	e.preventDefault();
	let pwd = document.getElementById('pwd');
	let pwdMatch = document.getElementById('pwdMatch');
	if(pwd.getAttribute('type') === 'password'){
	    pwd.setAttribute('type', 'text');
	    pwdMatch.setAttribute('type', 'text');
	}
	else{
	    pwd.setAttribute('type', 'password');
	    pwdMatch.setAttribute('type', 'password');
	}
	
    })

});
