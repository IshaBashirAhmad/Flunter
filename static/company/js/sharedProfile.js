let sharedToTableContainer = document.querySelector('#shared-to-table-container-div');
let sharedToTable = document.querySelector('#shared-to-list-table');
let sharedToTablePagination = document.querySelector('#shared-to-pagination-container');

let sharedFromTableContainer = document.querySelector('#shared-from-table-container-div');
let sharedFromTable = document.querySelector('#shared-from-list-table');
let sharedFromTablePagination = document.querySelector('#shared-from-pagination-container');

let selectedTableListType = 'shared-to';
let tableLoader = document.querySelector('#table-loader');

let filterData = {
    "start_date": null, "end_date": null, "city": '', "country": '', "state": '', 
    "region": '', "shared_users": []
}

let sharedToDataObject = {"user_id": 1, "page": 1, "q": '', "filter_data": filterData};
let sharedFromDataObject = {"user_id": 1, "page": 1, "q": '', "filter_data": filterData};

let requiredSharedToDataURL = '/share/candidate/to?perPage=20';
let requiredSharedFromDataURL = '/share/candidate/from?perPage=20';

let relatedUsers = [];


async function getSharedUserList() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/user/team`, null, headers, 'GET');
    response.json().then(function(res) {
        relatedUsers = [...res];
        populateShareDropdown(relatedUsers);
    })
}

window.addEventListener('load', getSharedUserList);


async function getSharedToList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];
    
    tableLoader.classList.remove('hide');
    sharedToTableContainer.classList.add('hide');
    
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };

    let response = await requestAPI(`${apiURL}${requiredSharedToDataURL}`, null, headers, "GET");
    response.json().then(function(res) {
        let tableBody = sharedToTable.querySelector('tbody');
        tableBody.innerHTML = '';
        if (response.status == 200) {
            if (res.data.length > 0) {
                res.data.forEach((rec) => {
                    tableBody.innerHTML += `<tr class="cursor-pointer"  data-id='${rec.id}'>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.first_name}">${rec.profile.first_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.last_name}">${rec.profile.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.current_position}">${rec.profile.current_position}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.company_name}">${rec.profile.company_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.person_city}">${rec.profile.person_city}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.shared_from.first_name} ${rec.shared_from.last_name}">${rec.shared_from.first_name} ${rec.shared_from.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow"">${convertDateFormat(rec.created_at)}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <div onclick="getProfile(${rec.profile.id});" class="show-btn">
                                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <circle cx="12" cy="12.5" r="3.3" stroke="#68759A" stroke-width="1.4"/>
                                                                <path d="M20.188 11.4343C20.5762 11.9056 20.7703 12.1412 20.7703 12.5C20.7703 12.8588 20.5762 13.0944 20.188 13.5657C18.7679 15.2899 15.6357 18.5 12 18.5C8.36427 18.5 5.23206 15.2899 3.81197 13.5657C3.42381 13.0944 3.22973 12.8588 3.22973 12.5C3.22973 12.1412 3.42381 11.9056 3.81197 11.4343C5.23206 9.71014 8.36427 6.5 12 6.5C15.6357 6.5 18.7679 9.71014 20.188 11.4343Z" stroke="#68759A" stroke-width="1.7"/>
                                                            </svg>
                                                        </div>
                                                        <svg onclick="openDeleteSharedProfileModal(event, 'delModal', ${rec.id}, 'to')" class="cursor-pointer" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M8.49805 20.25C7.99388 20.25 7.56228 20.0705 7.20326 19.7115C6.84423 19.3524 6.66471 18.9208 6.66471 18.4167V6.5H5.74805V4.66667H10.3314V3.75H15.8314V4.66667H20.4147V6.5H19.498V18.4167C19.498 18.9208 19.3185 19.3524 18.9595 19.7115C18.6005 20.0705 18.1689 20.25 17.6647 20.25H8.49805ZM17.6647 6.5H8.49805V18.4167H17.6647V6.5ZM10.3314 16.5833H12.1647V8.33333H10.3314V16.5833ZM13.998 16.5833H15.8314V8.33333H13.998V16.5833Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>`
                })
            }
            else {
                tableBody.innerHTML = `<tr>
                                            <td colspan="8" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                        </tr>`
            }
            if (selectedTableListType == 'shared-to') {
                tableLoader.classList.add('hide');
                sharedFromTableContainer.classList.add('hide');
                sharedFromTablePagination.classList.add('hide');
                sharedToTableContainer.classList.remove('hide');
                sharedToTablePagination.classList.remove('hide');
            }
            let pageStartEndRecords = getPageRecords(res.pagination);
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'shared-to');
        }
        else {
            tableBody.innerHTML = `<tr>
                                        <td colspan="8" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                    </tr>`
        }
    })
}

window.addEventListener('load', getSharedToList(requiredSharedToDataURL));


async function getSharedFromList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];
    
    tableLoader.classList.remove('hide');
    sharedFromTableContainer.classList.add('hide');
    
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };

    let response = await requestAPI(`${apiURL}${requiredSharedFromDataURL}`, null, headers, "GET");
    response.json().then(function(res) {
        let tableBody = sharedFromTable.querySelector('tbody');
        tableBody.innerHTML = '';
        if (response.status == 200) {
            if (res.data.length > 0) {
                res.data.forEach((rec) => {
                    tableBody.innerHTML += `<tr class="cursor-pointer"  data-id='${rec.id}'>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.first_name}">${rec.profile.first_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.last_name}">${rec.profile.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.current_position}">${rec.profile.current_position}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.company_name}">${rec.profile.company_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.person_city}">${rec.profile.person_city}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.shared_to.first_name} ${rec.shared_to.last_name}">${rec.shared_to.first_name} ${rec.shared_to.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow">${convertDateFormat(rec.created_at)}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <div onclick="getProfile(${rec.profile.id});" class="show-btn">
                                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <circle cx="12" cy="12.5" r="3.3" stroke="#68759A" stroke-width="1.4"/>
                                                                <path d="M20.188 11.4343C20.5762 11.9056 20.7703 12.1412 20.7703 12.5C20.7703 12.8588 20.5762 13.0944 20.188 13.5657C18.7679 15.2899 15.6357 18.5 12 18.5C8.36427 18.5 5.23206 15.2899 3.81197 13.5657C3.42381 13.0944 3.22973 12.8588 3.22973 12.5C3.22973 12.1412 3.42381 11.9056 3.81197 11.4343C5.23206 9.71014 8.36427 6.5 12 6.5C15.6357 6.5 18.7679 9.71014 20.188 11.4343Z" stroke="#68759A" stroke-width="1.7"/>
                                                            </svg>
                                                        </div>
                                                        <svg onclick="openDeleteSharedProfileModal(event, 'delModal', ${rec.id}, 'from')" class="cursor-pointer" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M8.49805 20.25C7.99388 20.25 7.56228 20.0705 7.20326 19.7115C6.84423 19.3524 6.66471 18.9208 6.66471 18.4167V6.5H5.74805V4.66667H10.3314V3.75H15.8314V4.66667H20.4147V6.5H19.498V18.4167C19.498 18.9208 19.3185 19.3524 18.9595 19.7115C18.6005 20.0705 18.1689 20.25 17.6647 20.25H8.49805ZM17.6647 6.5H8.49805V18.4167H17.6647V6.5ZM10.3314 16.5833H12.1647V8.33333H10.3314V16.5833ZM13.998 16.5833H15.8314V8.33333H13.998V16.5833Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>`   
                })
            }
            else {
                tableBody.innerHTML = `<tr>
                                            <td colspan="8" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                        </tr>`
            }
            if (selectedTableListType == 'shared-from') {
                tableLoader.classList.add('hide');
                sharedToTableContainer.classList.add('hide');
                sharedToTablePagination.classList.add('hide');
                sharedFromTableContainer.classList.remove('hide');
                sharedFromTablePagination.classList.remove('hide');
            }
            let pageStartEndRecords = getPageRecords(res.pagination);
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'shared-from');
        }
        else {
            tableBody.innerHTML = `<tr>
                                        <td colspan="8" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                    </tr>`
        }
    })
}

window.addEventListener('load', getSharedFromList(requiredSharedFromDataURL));


function getProfile(record_id){
    location.pathname=`/specific-shared-profile/${record_id}/`;
}


function generatePages(currentPage, totalPages, has_previous, has_next, recordCount, startRecord, endRecord, type='shared-to') {
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


function getPage(page, type='shared-to') {
    if (type == 'shared-to') {
        requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'page', page);
        getSharedToList(requiredSharedToDataURL);
    }
    else {
        requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'page', page);
        getSharedFromList(requiredSharedFromDataURL);
    }
}


function changeListType(listType) {
    if (listType == 'shared-to') {
        selectedTableListType = 'shared-to';
        sharedFromTableContainer.classList.add('hide');
        sharedFromTablePagination.classList.add('hide');
        sharedToTableContainer.classList.remove('hide');
        sharedToTablePagination.classList.remove('hide');
    }
    else if (listType == 'shared-from') {
        selectedTableListType = 'shared-from';
        sharedToTableContainer.classList.add('hide');
        sharedToTablePagination.classList.add('hide');
        sharedFromTableContainer.classList.remove('hide');
        sharedFromTablePagination.classList.remove('hide');
    }
}

function openDeleteSharedProfileModal(event, modalId, id, type) {
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `deleteSharedProfileForm(event, ${id}, '${type}');`);
    modal.querySelector('#del-modal-header').innerText = 'Delete Shared Profile';
    modal.querySelector('#warning-statement').innerText = 'Are you sure you want to delete this shared profile?';
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


async function deleteSharedProfileForm(event, record, type) {
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let row = document.querySelector(`tr[data-id='${record}']`);
    let errorMsg = form.querySelector('.delete-error-msg');
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/share/candidate/${record}/${type}`, null, headers, "DELETE");
        if (response.status == 204) {
            afterLoad(button, 'Deleted');
            button.disabled = true;
            if (type == 'to') {
                getSharedToList(requiredSharedToDataURL);
            }
            else {
                getSharedFromList(requiredSharedFromDataURL);
            }
            // row.remove();
            setTimeout(() => {
                document.querySelector(`.delModal`).click();
                button.disabled = false;
                afterLoad(button, 'Delete');
            }, 1200)
        }   
        else{
            afterLoad(button, buttonText);
            response.json().then(function(res) {
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            })
        }
    }
    catch (err) {
        console.log(err);
    }
}


async function searchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    if (selectedTableListType == 'shared-to') {
        requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'search', data.keywords);
        getSharedToList(requiredSharedToDataURL);
    }
    else {
        requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'search', data.keywords);
        getSharedFromList(requiredSharedFromDataURL);
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


function getRelatedUserName(id) {
    const userData = relatedUsers.find(user => user.user__id === id);
    if (userData)
        return `${userData.user__first_name} ${userData.user__last_name}`;
    else
        return null;
}


function populateShareDropdown(relatedUsers) {
    relatedUsers.forEach((user) => {
        user.full_name = `${user.first_name} ${user.last_name}`;
        if (user.id != userData.user.id) {
            sharedDropdown.innerHTML += `<div class="radio-btn shared-item-list" data-id="${user.id}">
                                            <input onchange="selectShared(this);" id="shared-user-${user.id}" type="radio" value="${user.id}" name="shared_user" />
                                            <label for="shared-user-${user.id}" class="radio-label">${user.first_name} ${user.last_name}</label>
                                        </div>`;
        }
    })
}


function searchUsersByName(query) {
    return relatedUsers
        .filter(user => user.user__full_name.toLowerCase().includes(query.toLowerCase()) && user.user__id != current_user_id)
        .map(user => user.user__id);
}