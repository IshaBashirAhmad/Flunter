function togglePasswordField(event, icon) {
    let passwordField = icon.closest('.password-input-div').querySelector('input[data-type="password"]');

    if (icon.classList.contains('hide-password-icon') && passwordField.type == 'password') {
        passwordField.type = 'text';
        icon.classList.add('hide');
        console.log(icon.closest('.password-input-div').querySelector('.show-password-icon'));
        icon.closest('.password-input-div').querySelector('.show-password-icon').classList.remove('hide');
    }
    else if (icon.classList.contains('show-password-icon') && passwordField.type == 'text') {
        passwordField.type = 'password';
        icon.classList.add('hide');
        icon.closest('.password-input-div').querySelector('.hide-password-icon').classList.remove('hide');
    }
}


function preventSubmission(event) {
    event.preventDefault(); 
    location.pathname = '/administration/account/'
}


let phone__number = document.getElementById('phone_number_errors')
let email = document.getElementById('email_errors')
let company_siret_number = document.getElementById('company_siret_number_errors')
let company_address = document.getElementById('company_address_errors')


function updateFlunterInfoForm(event) {
    event.preventDefault()
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let isValid = true
    
    if (phoneRegex.test(data.phone_number) == false) {
        phone__number.innerText = 'Please enter a valid number with country code';
        isValid = false
    }
    else
        phone__number.innerText = ''
    if (emailRegex.test(data.email) == false) {
        email.innerText = 'Enter valid email';
        isValid = false
    }
    else
        email.innerText = ''
    if (data.postal_address.trim().length == 0) {
        company_address.innerText = 'This field is required';
        isValid = false
    }
    else
        company_address.innerText=''
    if (data.siret_number.trim().length == 0) {
        company_siret_number.innerText = 'This field is required';
        isValid = false
    }
    else
        company_siret_number.innerText = ''

    if(!isValid)
        return false
    form.submit();
}