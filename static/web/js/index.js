let selectedSubscriptionInterval = 'm';


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


function selectCurrency(logo, name) {
    document.getElementById('currency-icon').innerText = logo;
    document.getElementById('currency-name').innerText = name;
}

async function initMap() {
    const addressElement = document.getElementById("location-address");
    addressElement.addEventListener('keydown', function(e) {
        if(e.keyCode === 13) {
            e.preventDefault();
        }
    })
    const searchBox = new google.maps.places.SearchBox(addressElement);
}


function changeSubscriptionInterval(interval) {
    if (interval == 'monthly') {
        // document.getElementById('free-plan').innerText = '€0/user/month';
        document.getElementById('silver-plan-monthly').classList.remove('hide');
        document.getElementById('silver-plan-yearly').classList.add('hide');
        document.getElementById('gold-plan-monthly').classList.remove('hide');
        document.getElementById('gold-plan-yearly').classList.add('hide');
        document.getElementById('platinum-plan-monthly').classList.remove('hide');
        document.getElementById('platinum-plan-yearly').classList.add('hide');
        document.getElementById('enterprise-plan-monthly').classList.remove('hide');
        document.getElementById('enterprise-plan-yearly').classList.add('hide');
        selectedSubscriptionInterval = 'm';
    }
    else if (interval == 'annually') {
        // document.getElementById('free-plan').innerText = '€0/user/year';
        document.getElementById('silver-plan-monthly').classList.add('hide');
        document.getElementById('silver-plan-yearly').classList.remove('hide');
        document.getElementById('gold-plan-monthly').classList.add('hide');
        document.getElementById('gold-plan-yearly').classList.remove('hide');
        document.getElementById('platinum-plan-monthly').classList.add('hide');
        document.getElementById('platinum-plan-yearly').classList.remove('hide');
        document.getElementById('enterprise-plan-monthly').classList.add('hide');
        document.getElementById('enterprise-plan-yearly').classList.remove('hide');
        selectedSubscriptionInterval = 'y';
    }
}


async function getInTouchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.email-error-msg');

    if (data.first_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid first name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.last_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid last name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter a valid email.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.topic.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid topic.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.description.trim().length == 0) {
        errorMsg.innerText = 'Enter your description.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let headers = { "Content-Type": "application/json", "X-CSRFToken": data.csrfmiddlewaretoken };
        beforeLoad(button);
        let response = await requestAPI('/users/send-contact-email/', JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (res.success) {
                form.reset();
                afterLoad(button, 'Email Sent');
                setTimeout(() => {
                    afterLoad(button, 'Send');
                }, 1200)
            }
            else {
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
                afterLoad(button, 'Send');
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, buttonText);
    }
}



const phoneInput = document.querySelector("#phone");
let page_load = false
var phone = window.intlTelInput(phoneInput, {
    separateDialCode: true,
    initialCountry: "auto",
    //customPlaceholder: '000 00 000',
    showFlags:false,
    nationalMode: false,
    geoIpLookup: function(success, failure) {
        let headers = {
            Accept: "application/json",
        };
        requestAPI("https://ipinfo.io", null, headers, 'GET').then(function(response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        }).then(function(resp) {
            var countryCode = (resp && resp.country) ? resp.country : "us";
            success(countryCode);
        }).catch(function(error) {
            if (typeof failure === "function") {
                failure(error.message);
            }
        })
    },
    hiddenInput: "full",
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
});

phone.promise.then(() => {
    phoneInput.value = phone_number;
})
const input = document.querySelector("#phone");
const errorMsg = document.querySelector("#error-msg");
const validMsg = document.querySelector("#valid-msg");
const sumit_btn = document.querySelector('#sumit_btn');
// here, the index maps to the error code returned from getValidationError - see readme
const errorMap = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];

// initialise plugin
// const iti = window.intlTelInput(input, {
//     initialCountry: "us",
//     utilsScript: "/intl-tel-input/js/utils.js?1714308177587"
//   });

const reset = () => {
    input.classList.remove("error");
    errorMsg.innerHTML = "";
    errorMsg.classList.add("hide");
    validMsg.classList.add("hide");
};
const showError = (msg) => {
    input.classList.add("error");
    errorMsg.innerHTML = msg;
    errorMsg.classList.remove("hide");
  };
  
// on click button: validate
phoneInput.addEventListener('keyup', () => {
    reset();
    if (!input.value.trim()) {
      showError("Required");
      sumit_btn.disabled = true;
    } else if (phone.isValidNumber()) {
      validMsg.classList.remove("hide");
      sumit_btn.disabled = false;
    } else {
      const errorCode = phone.getValidationError();
      const msg = errorMap[errorCode] || "Invalid number";
      showError(msg);
      sumit_btn.disabled = true;
    }
});
  
phoneInput.addEventListener("countrychange", function() {
    if (page_load){
        this.dispatchEvent(new KeyboardEvent('keyup'));
    }
    page_load = true
});

phoneInput.addEventListener("input", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("change", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("paste", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});



function openContactUsModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `contactUsForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Add';
        document.querySelector('.contact-us-error-msg').classList.remove('active');
        document.querySelector('.contact-us-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function contactUsForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.contact-us-error-msg');

    if (data.contact_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid contact name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.contact_email) == false) {
        errorMsg.innerText = 'Enter a valid contact email.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (phoneRegex.test(data.contact_phone) == false) {
        errorMsg.innerText = 'Please enter a valid contact phone number with country code';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.business_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid business name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.business_email) == false) {
        errorMsg.innerText = 'Enter a valid business email.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.number_of_employees.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid number of employees.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.desired_credits.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid number of desired credits.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.desired_connections.trim().length == 0 || isNaN(data.desired_connections)) {
        errorMsg.innerText = 'Enter a valid number of desired simultaneous connections.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.comment.trim().length == 0) {
        errorMsg.innerText = 'Enter your comment.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let headers = { "Content-Type": "application/json", "X-CSRFToken": data.csrfmiddlewaretoken };
        beforeLoad(button);
        let response = await requestAPI('/users/send-contact-us-email/', JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (res.success) {
                form.reset();
                reset();
                afterLoad(button, 'Email Sent');
                setTimeout(() => {
                    afterLoad(button, 'Send');
                    document.querySelector('.contactUsModal').click();
                }, 1200)
            }
            else {
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
                afterLoad(button, 'Send');
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, buttonText);
    }
}


window.addEventListener('load', function() {
    let links = document.querySelectorAll("div[role='banner'] .nav-link");
    links.forEach(function(link) {
        link.addEventListener("click", function() {
            links.forEach(function(element) {
                element.classList.remove("active");
            });
            this.classList.add("active");
        });
    });
});


function searchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    data.search_by_filter = 'Phone or Email';
    sessionStorage.setItem('searchData', JSON.stringify(data));
    location.pathname = '/search-profile/';
}
