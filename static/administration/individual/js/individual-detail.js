function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
}
function deleteSubscription(pk){
    modal_button = document.querySelector('#delete_confirmed_btn')
    link = "/administration/delete-subscription/"+ pk +"?next=individual"
    modal_button.onclick = function(){
        window.location.href = link
    }
}

function convertDateTime() {
    let orderTimes = document.querySelectorAll('.date-time');
    orderTimes.forEach((dateTime) => {
        // Input date in the format '2023-11-30T04:44:12.156070Z'
        console.log(dateTime.textContent)
        const inputDate = new Date(dateTime.textContent);
        console.log(inputDate)
        
        // Format date components
        const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(inputDate);
        const month = new Intl.DateTimeFormat('en-US', { month: 'numeric' }).format(inputDate);
        const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(inputDate);
        const formattedTime = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: 'numeric',
            hour12: true,
        }).format(inputDate);
        
        // Create the desired format
        const result = `${day}-${month}-${year} ${formattedTime}`;
        dateTime.textContent = result;
    })
}
window.addEventListener('load', convertDateTime());

// Iterate over table rows
document.querySelectorAll('#invoice_table tbody tr').forEach(row => {
    // Get the timestamp cell and convert its value to a date

    const timestampCell = row.cells[3];
    const timestamp = parseInt(timestampCell.textContent);
    const date = new Date(timestamp * 1000);

    // Update the date cell with the formatted date
    const dateCell = row.cells[3];
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    dateCell.textContent = formattedDate;
});


function openDelModal(modalId, id, type='indiviudal') {
    let modal = document.querySelector(`#${modalId}`);
    heading = modal.querySelector('#del-modal-header')
    body = modal.querySelector('#warning-statement')
    heading.innerText = `Delete ${captalizeFirstLetter(type)}`;
    body.innerText = `Are you sure you want to delete this ${type}?`;
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `delUserForm(event, ${id}, '${type}');`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Delete';
        document.querySelector('.delete-error-msg').classList.remove('active');
        document.querySelector('.delete-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

async function delUserForm(event, id, type) {
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
        let headers = { "X-CSRFToken": data.csrfmiddlewaretoken };

        beforeLoad(button);
        let response = await requestAPI(`/administration/delete-user/${id}/`, null, headers, "DELETE");
        response.json().then(function (res) {
            if (res.success) {
                afterLoad(button, 'Deleted');
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.reload();
                }, 1500)
                type = type == 'company' ? 'companie' : type;
                window.location = `/administration/${type}s/`
            } 
            else {
                afterLoad(button, buttonText);
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}