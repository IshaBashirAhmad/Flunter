let reportOptions = document.querySelectorAll('input[name="reason"]');
let reportReasonTextarea = document.getElementById('report-reason-textarea');

reportOptions.forEach((option) => {
    option.addEventListener('click', function() {
        if (option.value == 'other') {
            reportReasonTextarea.classList.remove('hide');
        }
        else {
            reportReasonTextarea.classList.add('hide');
        }
    })
})


function openReportCandidateModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `reportCandidateForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Report';
        reportReasonTextarea.classList.add('hide');
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function reportCandidateForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    
    if (!('reason' in data)) {
        errorMsg.innerText = 'Please select a report reason.';
        errorMsg.classList.add('active');
        return false;
    }
    if (data.reason == 'other' && data.description.trim().length == 0) {
        errorMsg.innerText = 'Please write your report description.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        if (data.reason != 'other')
            delete data.description;
        data.profile = id;
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/report/candidate`, JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 200) {
                afterLoad(button, 'Report Sent');
                button.disabled = true;
                setTimeout(() => {
                    document.querySelector(`.reportCandidateModal`).click();
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1200)
            } 
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}