document.addEventListener('DOMContentLoaded', () => {
    let mainContainer = document.getElementById('mainContainer');
    
    document.getElementById('buttonRight').addEventListener('click', e => {
	e.preventDefault();
	mainContainer.classList.remove('slideLeft');
	mainContainer.classList.add('slideRight');
    });
    document.getElementById('buttonLeft').addEventListener('click', e => {
	e.preventDefault();
	mainContainer.classList.remove('slideRight');
	mainContainer.classList.add('slideLeft');
    });

})

function expand(element){
    let ariaExp = element.getAttribute('aria-expanded');
    if(ariaExp === "true"){
	element.setAttribute('aria-expanded', false);
    }
    else{
	element.setAttribute('aria-expanded', true);
    }
}
