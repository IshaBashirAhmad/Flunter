let recruitmentTableContainer = document.querySelector('#recruitment-table-container-div');
let recruitmentTable = document.querySelector('#recruitment-list-table');
let recruitmentTablePagination = document.querySelector('#recruitment-pagination-container');

let prospectionTableContainer = document.querySelector('#prospection-table-container-div');
let prospectionTable = document.querySelector('#prospection-list-table');
let prospectionTablePagination = document.querySelector('#prospection-pagination-container');

let selectedTableListType = 'recruitment';
let tableLoader = document.querySelector('#table-loader');

let requiredRecruitmentDataURL = '/user/list/recruitment?perPage=20&search=';
let requiredProspectionDataURL = '/user/list/prospection?perPage=20&search=';


async function getRecruitmentList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];
    
    tableLoader.classList.remove('hide');
    recruitmentTableContainer.classList.add('hide');
    
    let token = getCookie('user_access');
    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    let response = await requestAPI(`${apiURL}${requiredRecruitmentDataURL}`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status === 200) {
            let tableBody = recruitmentTable.querySelector('tbody');
            tableBody.innerHTML = '';
            if (res.data.length > 0) {
                res.data.forEach((rec) => {
                    tableBody.innerHTML += `<tr class="cursor-pointer" data-id='${rec.id}' onclick="getListCandidate(${rec.id}, '${rec.name}');">
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.results}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.created_by.first_name} ${rec.created_by.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${convertDateFormat(rec.updated_at)}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <svg class="cursor-pointer" onclick="openEditRecruitmentListModal(event, 'manageListModal', '${rec.name}', ${rec.id})" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18.822 6.91778C19.1036 6.63611 19.1036 6.18111 18.822 5.89944L17.1322 4.20944C16.9878 4.065 16.8073 4 16.6195 4C16.4318 4 16.2512 4.07222 16.114 4.20944L14.7925 5.53111L17.5005 8.23944L18.822 6.91778ZM6.0332 14.2917V17H8.74116L16.7278 9.01222L14.0199 6.30389L6.0332 14.2917ZM8.1418 15.5556H7.47745V14.8911L14.0199 8.34778L14.6842 9.01222L8.1418 15.5556Z" fill="#68759A"/>
                                                        </svg>
                                                        <svg onclick="openDeleteLisrModal(event, 'delModal', ${rec.id})" class="cursor-pointer" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M7.11719 19.25C6.61302 19.25 6.18142 19.0705 5.8224 18.7115C5.46337 18.3524 5.28385 17.9208 5.28385 17.4167V5.5H4.36719V3.66667H8.95052V2.75H14.4505V3.66667H19.0339V5.5H18.1172V17.4167C18.1172 17.9208 17.9377 18.3524 17.5786 18.7115C17.2196 19.0705 16.788 19.25 16.2839 19.25H7.11719ZM16.2839 5.5H7.11719V17.4167H16.2839V5.5ZM8.95052 15.5833H10.7839V7.33333H8.95052V15.5833ZM12.6172 15.5833H14.4505V7.33333H12.6172V15.5833Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>`
                })
            }
            else {
                tableBody.innerHTML = `<tr>
                                            <td colspan="5" class="no-record-row" style="height: 45px; background: #FFFFFF">No Record Available</td>
                                        </tr>`
            }
            if (selectedTableListType == 'recruitment') {
                tableLoader.classList.add('hide');
                prospectionTableContainer.classList.add('hide');
                prospectionTablePagination.classList.add('hide');
                recruitmentTableContainer.classList.remove('hide');
                recruitmentTablePagination.classList.remove('hide');
            }
            let pageStartEndRecords = getPageRecords(res.pagination);
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'recruitment');
        }
    })
}

window.addEventListener('load', getRecruitmentList(requiredRecruitmentDataURL));


async function getProspectionList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];

    tableLoader.classList.remove('hide');
    prospectionTableContainer.classList.add('hide');
    
    let token = getCookie('user_access');
    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    let response = await requestAPI(`${apiURL}${requiredProspectionDataURL}`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status == 200) {
            let tableBody = prospectionTable.querySelector('tbody');
            tableBody.innerHTML = '';
            if (res.data.length > 0) {
                res.data.forEach((rec) => {
                    tableBody.innerHTML += `<tr class="cursor-pointer"  data-id='${rec.id}' onclick="getListCandidate(${rec.id}, '${rec.name}');">
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.results}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${rec.created_by.first_name} ${rec.created_by.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span data-td-id='${rec.id}'>${convertDateFormat(rec.updated_at)}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <svg class="cursor-pointer" onclick="openEditRecruitmentListModal(event, 'manageListModal', '${rec.name}', ${rec.id})" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18.822 6.91778C19.1036 6.63611 19.1036 6.18111 18.822 5.89944L17.1322 4.20944C16.9878 4.065 16.8073 4 16.6195 4C16.4318 4 16.2512 4.07222 16.114 4.20944L14.7925 5.53111L17.5005 8.23944L18.822 6.91778ZM6.0332 14.2917V17H8.74116L16.7278 9.01222L14.0199 6.30389L6.0332 14.2917ZM8.1418 15.5556H7.47745V14.8911L14.0199 8.34778L14.6842 9.01222L8.1418 15.5556Z" fill="#68759A"/>
                                                        </svg>
                                                        <svg onclick="openDeleteLisrModal(event, 'delModal', ${rec.id})" class="cursor-pointer" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M7.11719 19.25C6.61302 19.25 6.18142 19.0705 5.8224 18.7115C5.46337 18.3524 5.28385 17.9208 5.28385 17.4167V5.5H4.36719V3.66667H8.95052V2.75H14.4505V3.66667H19.0339V5.5H18.1172V17.4167C18.1172 17.9208 17.9377 18.3524 17.5786 18.7115C17.2196 19.0705 16.788 19.25 16.2839 19.25H7.11719ZM16.2839 5.5H7.11719V17.4167H16.2839V5.5ZM8.95052 15.5833H10.7839V7.33333H8.95052V15.5833ZM12.6172 15.5833H14.4505V7.33333H12.6172V15.5833Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>`
                })
            }
            else {
                tableBody.innerHTML = `<tr>
                                            <td colspan="5" class="no-record-row" style="height: 45px; background: #FFFFFF">No Record Available</td>
                                        </tr>`
            }
            if (selectedTableListType == 'prospection') {
                tableLoader.classList.add('hide');
                recruitmentTableContainer.classList.add('hide');
                recruitmentTablePagination.classList.add('hide');
                prospectionTableContainer.classList.remove('hide');
                prospectionTablePagination.classList.remove('hide');
            }
            let pageStartEndRecords = getPageRecords(res.pagination);
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'prospection');
        }
    })
}


window.addEventListener('load', getProspectionList(requiredProspectionDataURL));


async function getListCandidate(record_id, list_name){
    sessionStorage.setItem("listName", `${list_name} List`);
    location.pathname=`/list-candidates/${record_id}/`
}


async function deleteListForm(event, record) {
    event.preventDefault();
    let form = event.currentTarget;
    let submit_btn = form.querySelector("[type='submit']");
    let row = document.querySelector(`tr[data-id='${record}']`);
    let token = getCookie('user_access');
    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    beforeLoad(submit_btn);
    try {
        let response = await requestAPI(`${apiURL}/user/list/${record}`, null, headers, "DELETE");
        if (response.status === 204) {
            afterLoad(submit_btn, 'Deleted');
            submit_btn.disabled = true;
            row.remove();
            setTimeout(() => {
                document.querySelector(`.delModal`).click();
                submit_btn.disabled = false;
                afterLoad(submit_btn, 'Delete');
            }, 1200);
        } else {
            let res = await response.json();
            if (res.message) {
                console.error(res.message);
            }
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}


function generatePages(currentPage, totalPages, has_previous, has_next, recordCount, startRecord, endRecord, type='recruitment') {
    const pagesContainer = document.getElementById(`${type}-pages-container`);
    let getFirstPageBtn = document.getElementById(`${type}-pagination-get-first-record-btn`);
    let getPreviousPageBtn = document.getElementById(`${type}-pagination-get-previous-record-btn`);
    let getNextPageBtn = document.getElementById(`${type}-pagination-get-next-record-btn`);
    let getLastPageBtn = document.getElementById(`${type}-pagination-get-last-record-btn`);

    document.querySelector(`#${type}-records-count`).innerText = recordCount || 0;
    document.querySelector(`#${type}-start-record`).innerText = startRecord || 0;
    document.querySelector(`#${type}-end-record`).innerText = endRecord || 0;

    pagesContainer.innerHTML = '';

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    if (startPage > 1) {
        pagesContainer.innerHTML += '<span class="cursor-pointer">1</span>';
        if (startPage > 2) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesContainer.innerHTML += `<span${i === currentPage ? ' class="active"' : ' class="cursor-pointer"'}>${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
        pagesContainer.innerHTML += `<span class="cursor-pointer">${totalPages}</span>`;
    }
    pagesContainer.querySelectorAll('span').forEach((span) => {
        if ((!span.classList.contains('active'))  && (!span.classList.contains('ellipsis-container'))) {
            let page = span.innerText;
            span.setAttribute("onclick", `getPage(${parseInt(page)}, '${type}')`);
        }
    })
    if (has_previous) {
        getFirstPageBtn.setAttribute('onclick', `getPage(1), '${type}'`);
        getFirstPageBtn.classList.remove('opacity-point-3-5');
        getPreviousPageBtn.setAttribute('onclick', `getPage(${currentPage - 1}, '${type}')`);
        getPreviousPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getFirstPageBtn.removeAttribute('onclick');
        getFirstPageBtn.classList.add('opacity-point-3-5');
        getPreviousPageBtn.removeAttribute('onclick');
        getPreviousPageBtn.classList.add('opacity-point-3-5');
    }

    if (has_next) {
        getLastPageBtn.setAttribute('onclick', `getPage(${totalPages}, '${type}')`);
        getLastPageBtn.classList.remove('opacity-point-3-5');
        getNextPageBtn.setAttribute('onclick', `getPage(${currentPage + 1}, '${type}')`);
        getNextPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getLastPageBtn.removeAttribute('onclick');
        getLastPageBtn.classList.add('opacity-point-3-5');
        getNextPageBtn.removeAttribute('onclick');
        getNextPageBtn.classList.add('opacity-point-3-5');
    }
}


function getPage(page, type='recruitment') {
    if (type == 'recruitment') {
        requiredRecruitmentDataURL = setParams(requiredRecruitmentDataURL, 'page', page);
        getRecruitmentList(requiredRecruitmentDataURL);
    }
    else {
        requiredProspectionDataURL = setParams(requiredProspectionDataURL, 'page', page);
        getProspectionList(requiredProspectionDataURL);
    }
}


function changeListType(listType) {
    if (listType == 'recruitment') {
        selectedTableListType = 'recruitment';
        prospectionTableContainer.classList.add('hide');
        prospectionTablePagination.classList.add('hide');
        recruitmentTableContainer.classList.remove('hide');
        recruitmentTablePagination.classList.remove('hide');
    }
    else if (listType == 'prospection') {
        selectedTableListType = 'prospection';
        recruitmentTableContainer.classList.add('hide');
        recruitmentTablePagination.classList.add('hide');
        prospectionTableContainer.classList.remove('hide');
        prospectionTablePagination.classList.remove('hide');
    }
}


function openDeleteLisrModal(event, modalId, id) {
    event.stopPropagation();
    let heading = document.querySelector("#del-modal-header");
    let warning_statement = document.querySelector('#warning-statement');
    heading.innerText = 'Delete List';
    warning_statement.innerText = "Are you sure you want to delete this List?";
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `deleteListForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
    })
    document.querySelector(`.${modalId}`).click();
}


async function searchForm(event){
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    if (selectedTableListType == 'recruitment'){
        requiredRecruitmentDataURL = setParams(requiredRecruitmentDataURL, 'search', data.keywords);
        getRecruitmentList(requiredRecruitmentDataURL);
    }
    else{
        requiredProspectionDataURL = setParams(requiredProspectionDataURL, 'search', data.keywords);
        getProspectionList(requiredProspectionDataURL);
    }
}


function convertDateFormat(dateStr) {
    try {
        const date = new Date(dateStr);

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        const formattedDate = `${day}-${month}-${year}`;
        return formattedDate;
    }
    catch (err) {
        console.log(err);
        return dateStr;
    }
}