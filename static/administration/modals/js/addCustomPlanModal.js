let companyDropdown = document.getElementById('company-dropdown');
let companyField = document.getElementById('company-field');


function selectCompany(inputElement) {
    if(inputElement.checked) {
        companyField.value = inputElement.nextElementSibling.innerText;
        selectedCompany = inputElement.value;
    }
}

companyField.addEventListener('focus', function() {
    companyDropdown.classList.add('show-flex');
})

companyField.addEventListener('blur', function(event) {
    setTimeout(() => {
        companyDropdown.classList.remove('show-flex');
    }, 200);
})

companyField.addEventListener('input', function() {
    let filteredCompanies = [];
    filteredCompanies = companyData.filter(company => company.company_name.toLowerCase().includes(this.value.toLowerCase())).map((company => company.id));
    if (filteredCompanies.length == 0) {
        document.getElementById('no-company-text').classList.remove('hide');
        document.querySelectorAll('.company-item-list').forEach((item) => item.classList.add('hide'));
    }
    else {
        document.getElementById('no-company-text').classList.add('hide');
        document.querySelectorAll('.company-item-list').forEach((item) => {
            let itemID = item.getAttribute('data-id');
            if (filteredCompanies.includes(parseInt(itemID, 10))) {
                item.classList.remove('hide');
            }
            else {
                item.classList.add('hide');
            }
        })
    }
})


function openCustomPlanModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `addCustomPlanForm(event);`);
    modal.querySelector('#company-dropdown-container').classList.remove('hide');
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Save';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function addCustomPlanForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let data = formDataToObject(formData);
    let isValid = true
    
    errorMsg.innerHTML = '';
    if (data.company.trim().length == '' || !('company' in data)) {
        errorMsg.innerHTML += 'Select a company <br />';
        isValid = false
    }
    if (data.credits.trim().length == 0 || data.credits <= 0) {
        errorMsg.innerHTML += 'Enter credits <br />';
        isValid = false
    }
    if (data.monthly_price.trim().length == 0 || data.monthly_price <= 0) {
        errorMsg.innerHTML += 'Enter price per month <br />';
        isValid = false
    }
    if (data.users_limit.trim().length == 0 || data.users_limit <= 0) {
        errorMsg.innerHTML += 'Enter number of users <br />';
        isValid = false
    }
    // if (data.searches_per_month.trim().length == 0 || data.searches_per_month <= 0) {
    //     errorMsg.innerHTML += 'Enter searches per month <br />';
    //     isValid = false
    // }
    // if (data.saved_searches_limit.trim().length == 0 || data.saved_searches_limit <= 0) {
    //     errorMsg.innerHTML += 'Enter saved searches <br />';
    //     isValid = false
    // }
    if (data.simultaneous_connections_limit.trim().length == 0 || data.simultaneous_connections_limit <= 0) {
        errorMsg.innerHTML += 'Enter number of simultaneous connections <br />';
        isValid = false
    }

    if (!isValid) {
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerHTML = '';
        errorMsg.classList.remove('active');

        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": data.csrfmiddlewaretoken
        };
        beforeLoad(button);
        let response = await requestAPI('/users/add-custom-plan/', JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 201) {
                afterLoad(button, 'Saved');
                form.reset();
                button.disabled = true;
                getList(urlParams);
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    document.querySelector('.addCustomPlan').click();
                }, 1200)
            }
            else {
                afterLoad(button, buttonText);
                button.disabled = false;
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, buttonText);
        button.disabled = false;
    }
}


function openUpdateCustomPlanModal(modalId, id, credits, monthly_price, users_limit, searches_per_month, saved_searches_limit, simultaneous_connections_limit) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `updateCustomPlanForm(event, ${id});`);
    modal.querySelector('#company-dropdown-container').classList.add('hide');
    modal.querySelector('input[name="credits"]').value = credits;
    modal.querySelector('input[name="monthly_price"]').value = monthly_price;
    modal.querySelector('input[name="users_limit"]').value = users_limit;
    // modal.querySelector('input[name="searches_per_month"]').value = searches_per_month;
    // modal.querySelector('input[name="saved_searches_limit"]').value = saved_searches_limit;
    modal.querySelector('input[name="simultaneous_connections_limit"]').value = simultaneous_connections_limit;
    modal.querySelector('#add-custom-plan-modal-header-text').innerText = 'Update Custom Plan';
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('#company-dropdown-container').classList.remove('hide');
        modal.querySelector('.btn-text').innerText = 'Save';
        modal.querySelector('#add-custom-plan-modal-header-text').innerText = 'Add Custom Plan';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function updateCustomPlanForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let data = formDataToObject(formData);
    let isValid = true
    
    errorMsg.innerHTML = '';
    if (data.credits.trim().length == 0 || data.credits <= 0) {
        errorMsg.innerHTML += 'Enter credits <br />';
        isValid = false
    }
    if (data.monthly_price.trim().length == 0 || data.monthly_price <= 0) {
        errorMsg.innerHTML += 'Enter price per month <br />';
        isValid = false
    }
    if (data.users_limit.trim().length == 0 || data.users_limit <= 0) {
        errorMsg.innerHTML += 'Enter number of users <br />';
        isValid = false
    }
    // if (data.searches_per_month.trim().length == 0 || data.searches_per_month <= 0) {
    //     errorMsg.innerHTML += 'Enter searches per month <br />';
    //     isValid = false
    // }
    // if (data.saved_searches_limit.trim().length == 0 || data.saved_searches_limit <= 0) {
    //     errorMsg.innerHTML += 'Enter saved searches <br />';
    //     isValid = false
    // }
    if (data.simultaneous_connections_limit.trim().length == 0 || data.simultaneous_connections_limit <= 0) {
        errorMsg.innerHTML += 'Enter number of simultaneous connections <br />';
        isValid = false
    }

    if (!isValid) {
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerHTML = '';
        errorMsg.classList.remove('active');

        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": data.csrfmiddlewaretoken
        };
        beforeLoad(button);
        let response = await requestAPI(`/users/update-custom-plan/${id}/`, JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 200) {
                afterLoad(button, 'Saved');
                form.reset();
                button.disabled = true;
                getList(urlParams);
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    document.querySelector('.addCustomPlan').click();
                }, 1200)
            }
            else {
                afterLoad(button, buttonText);
                button.disabled = false;
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, buttonText);
        button.disabled = false;
    }
}


function openDelCustomPlanModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector('form');
    form.setAttribute("onsubmit", `delCustomPlan(event, ${id})`);
    modal.querySelector('#del-modal-header').innerText = 'Delete Custom Plan';
    modal.querySelector('#warning-statement').innerText = 'Are you sure you want to delete this company custom plan?';    
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('button[type="submit"]').disabled = false;
        modal.querySelector('#del-modal-header').innerText = '';
        modal.querySelector('#warning-statement').innerText = '';
        modal.querySelector('.btn-text').innerText = 'Delete';
    })
    document.querySelector(`.${modalId}`).click();
}


async function delCustomPlan(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let errorMsg = form.querySelector('delete-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;

    try {
        let headers = { "X-CSRFToken": form.querySelector('input[name="csrfmiddlewaretoken"]').value };
        beforeLoad(button);
        let response = await requestAPI(`/users/del-custom-plan/${id}/`, null, headers, 'DELETE');
        if (response.status == 204) {
            form.reset();
            form.removeAttribute("onsubmit");
            button.disabled = true;
            afterLoad(button, 'Deleted');
            getList(urlParams);
            setTimeout(() => {
                button.disabled = false;
                document.querySelector('.delUserModal').click();
            }, 1000)
        }
        else {
            afterLoad(button, buttonText);
            button.disabled = false;
            errorMsg.innerText = res.message;
            errorMsg.classList.add('active');
        }
    }
    catch (err) {
        console.log(err);
        afterLoad(button, 'Error');
    }
}