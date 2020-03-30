document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('jumpToTemplateLooks').addEventListener('click', e => {
	e.preventDefault();
	window.location.hash = 'templateLooks';
	$('#templateLooks button')[0].setAttribute('aria-expanded', 'true');
	$('#templateLooks .usa-accordion__content')[0].hidden = false;
    });
});
