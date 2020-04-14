var continueBtn = document.getElementsByClassName('continueBtn');
var radio = document.querySelectorAll('input[name="sign-off"]');

function changeHandler() {
  if (this.value === 'yes' ) {
    continueBtn[0].classList.remove('govuk-button--disabled')
  } else if (this.value === 'no' ){
    continueBtn[0].classList.add('govuk-button--disabled')
  }
}

Array.prototype.forEach.call(radio, function(radio) {
  radio.addEventListener('change', changeHandler);
});
