let paymentMethodContainer = document.getElementById('payment-method-container');
let invoiceTable = document.getElementById('invoice_table');
let authUserContainer = document.getElementById('auth-user-container');
let authUserCountSpan = document.getElementById('auth-user-count');
let addUserBtn = document.getElementById('add-user-btn');
let authUserCount = 0;


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


async function getCardDetails() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/user/payment`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status == 200 && userData.user.role != 'auth_user' && userData.user.role != 'contact') {
            paymentMethodContainer.innerHTML = `
                                                <span>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22 2.38916C22.55 2.38916 23.0208 2.585 23.4125 2.97666C23.8042 3.36833 24 3.83916 24 4.38916V19.5892C24 20.1392 23.8042 20.61 23.4125 21.0017C23.0208 21.3933 22.55 21.5892 22 21.5892H2C1.45 21.5892 0.979165 21.3933 0.587505 21.0017C0.195835 20.61 0 20.1392 0 19.5892V4.38916C0 3.83916 0.195835 3.36833 0.587505 2.97666C0.979165 2.585 1.45 2.38916 2 2.38916H22ZM2 3.98916C1.89167 3.98916 1.79792 4.02874 1.71875 4.10791C1.63958 4.18708 1.6 4.28083 1.6 4.38916V7.18916H22.4V4.38916C22.4 4.28083 22.3604 4.18708 22.2813 4.10791C22.2021 4.02874 22.1083 3.98916 22 3.98916H2ZM22 19.9892C22.1083 19.9892 22.2021 19.9496 22.2813 19.8704C22.3604 19.7912 22.4 19.6975 22.4 19.5892V11.9892H1.6V19.5892C1.6 19.6975 1.63958 19.7912 1.71875 19.8704C1.79792 19.9496 1.89167 19.9892 2 19.9892H22ZM3.2 18.3892V16.7892H6.4V18.3892H3.2ZM8 18.3892V16.7892H12.8V18.3892H8Z" fill="#5D5959"/>
                                                    </svg>
                                                    <span>${res.data[0].card.last4}</span>                                            
                                                </span>
                                                <button ${userData.user.sub?.is_trial_user == true ? "disabled style='background: #888996;'" : `onclick="openUpdateCardModal('updatecard')"` }>Update Card</button>
                                            `
        }
        else {
            paymentMethodContainer.innerHTML = '<div>No Payment Method</div>';
        }
    })
}

window.addEventListener('load', getCardDetails);


async function getInvoiceDetails() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/user/invoices/`, null, headers, "GET");
    response.json().then(function(res) {
        let body = invoiceTable.querySelector('tbody');
        if (response.status == 200 && userData.user.role != 'auth_user' && userData.user.role != 'contact') {
            body.innerHTML = '';
            res.invoices.data.forEach(invoice => {
                body.innerHTML += `<tr>
                                        <td>${invoice.number}</td>
                                        <td>€${ invoice.amount_paid / 100 }</td>
                                        <td>${getInvoiceDate(invoice.lines.data[0].period.start)}</td>
                                        <td>
                                            <div class="container">
                                                <a class="btn btn-primary" href="${invoice.invoice_pdf}" target='_blank' download  style = 'background-color: #2B00CC !important;'>
                                                Download PDF
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12.25 14L11.5429 14.7071C11.9334 15.0976 12.5666 15.0976 12.9571 14.7071L12.25 14ZM13.25 5C13.25 4.44772 12.8023 4 12.25 4C11.6977 4 11.25 4.44772 11.25 5L13.25 5ZM6.54289 9.70711L11.5429 14.7071L12.9571 13.2929L7.95711 8.29289L6.54289 9.70711ZM12.9571 14.7071L17.9571 9.70711L16.5429 8.29289L11.5429 13.2929L12.9571 14.7071ZM13.25 14L13.25 5L11.25 5L11.25 14L13.25 14Z" fill="white"/>
                                                        <path d="M5.25 16L5.25 17C5.25 18.1046 6.14543 19 7.25 19L17.25 19C18.3546 19 19.25 18.1046 19.25 17V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>                                                
                                                </a>
                                            </div>
                                        </td>
                                    </tr>`;
            })
        }
        else {
            body.innerHTML = `<tr data-type="no-records">
                                <td colspan="4">No Record Available.</td>
                            </tr>`;
        }
        document.querySelector('#table-loader').classList.add('hide');
        invoiceTable.classList.remove('hide');
    })
}

window.addEventListener('load', getInvoiceDetails);


async function getAuthorizedUsers() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/auth-user/list`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status == 200 && res.data.length > 0) {
            authUserContainer.innerHTML = '';
            res.data.forEach(auth_user => {
                authUserContainer.innerHTML += `<div class="authorised-user">
                                                    <div class="user-info">
                                                        <img src="${auth_user.user.profile_picture}" alt="authorised-user" />
                                                        <span>${auth_user.user.first_name} ${auth_user.user.last_name}</span>
                                                    </div>
                                                    <div class="user-actions">
                                                        <svg onclick="openUpdateUserModal('addUser', ${auth_user.user.id}, '${auth_user.user.profile_picture}', '${auth_user.user.first_name}', '${auth_user.user.last_name}', '${auth_user.user.email}');" class="cursor-pointer"  width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <rect x="1" y="1" width="38" height="38" rx="4" stroke="#2B00CC" stroke-width="2"/>
                                                            <path opacity="0.4" d="M21.7969 28.3383H28.5282" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.9031 12.5651C21.681 11.574 22.9382 11.6257 23.9304 12.4036L25.3976 13.5542C26.3898 14.3321 26.7413 15.5386 25.9634 16.5319L17.2139 27.6944C16.9215 28.0681 16.475 28.2887 16 28.294L12.6254 28.3372L11.8612 25.0492C11.7535 24.5879 11.8612 24.1023 12.1536 23.7276L20.9031 12.5651Z" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path opacity="0.4" d="M19.2656 14.6562L24.326 18.623" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>                                        
                                                        <svg onclick="openDelModal('delModal', ${auth_user.user.id});" class="cursor-pointer" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <rect width="40" height="40" rx="5" fill="#FF0000"/>
                                                            <path d="M27.8482 17.2876C27.8482 17.2876 27.2664 24.5037 26.9289 27.5433C26.7682 28.9951 25.8714 29.8458 24.4025 29.8726C21.6071 29.923 18.8086 29.9262 16.0143 29.8672C14.6011 29.8383 13.7193 28.9769 13.5618 27.5508C13.2221 24.4844 12.6436 17.2876 12.6436 17.2876" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M29.3304 13.8287H11.1611" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M25.8296 13.8285C24.9885 13.8285 24.2643 13.2339 24.0993 12.41L23.8389 11.1071C23.6782 10.506 23.1339 10.0903 22.5135 10.0903H17.9782C17.3578 10.0903 16.8135 10.506 16.6528 11.1071L16.3925 12.41C16.2275 13.2339 15.5032 13.8285 14.6621 13.8285" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </div>
                                                </div>`;
            });
            authUserCountSpan.innerText = res.data.length;
            authUserCount = res.data.length;
        }
        else {
            authUserContainer.innerHTML = `<div class="no-authorised-user">
                                                <span>No user available</span>
                                            </div>`;
        }
    })
}

window.addEventListener('load', getAuthorizedUsers);


function selectCurrency(logo, name) {
    document.getElementById('currency-icon').innerText = logo;
    document.getElementById('currency-name').innerText = name;
}


function openDelModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `delUserForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Delete';
        document.querySelector('.delete-error-msg').classList.remove('active');
        document.querySelector('.delete-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

async function delUserForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.delete-error-msg');

    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');        
        
        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/auth-user/update/${id}`, null, headers, "DELETE");
        if (response.status == 204) {
            afterLoad(button, 'Deleted');
            button.disabled = true;
            setTimeout(() => {
                button.disabled = false;
                afterLoad(button, buttonText);
                location.reload();
            }, 1000)
        } 
        else {
            response.json().then(function(res) {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            })
        }
    }
    catch (err) {
        console.log(err);
    }
}


function getInvoiceDate(timestampString) {
    try {
        const timestamp = parseInt(timestampString);
        const date = new Date(timestamp * 1000);
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        return formattedDate;
    }
    catch (err) {
        console.log(err);
        return date;
    }
}