let savedSearchesTableContainer = document.getElementById('table-container-div');
let savedSearchTable = document.getElementById('saved-search-table');
let loader = document.querySelector('#table-loader');
let errorMsg = document.querySelector('.search-error-msg');
let urlParams = 'q=&page=';
let requiredDataURL = '/save/search?perPage=20';
let savedSearchData = {};
let headerRecordCountText = document.getElementById('header-record-text');

let paginationContainer = document.querySelector('#pagination-container');
let getFirstPageBtn = document.getElementById('pagination-get-first-record-btn');
let getPreviousPageBtn = document.getElementById('pagination-get-previous-record-btn');
let getNextPageBtn = document.getElementById('pagination-get-next-record-btn');
let getLastPageBtn = document.getElementById('pagination-get-last-record-btn');


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


function populateSearchInputs(id) {
    let data = savedSearchData.find(rec => rec.id == id);
    sessionStorage.setItem('searchData', JSON.stringify(data));
    window.location.href = '/search-profile/';
}


function searchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    requiredDataURL = setParams(requiredDataURL, 'search', `${data.keywords}`);
    requiredDataURL = setParams(requiredDataURL, 'page', '1');
    getList(requiredDataURL);
}


async function getList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];
    
    savedSearchesTableContainer.classList.add('hide');
    loader.classList.remove('hide');
    
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };

    let response = await requestAPI(`${apiURL}${url}`, null, headers, 'GET');
    response.json().then(function(res) {
        if(response.status == 200) {
            savedSearchData = res.data;
            
            let pageStartEndRecords = getPageRecords(res.pagination);
            document.querySelector('#record-count').innerText = res.pagination.count || 0;
            document.querySelector('#start-record').innerText = pageStartEndRecords.start || 0;
            document.querySelector('#end-record').innerText = pageStartEndRecords.end || 0;
            
            let tbody = savedSearchTable.querySelector('tbody');
            tbody.innerHTML = '';
            savedSearchData.forEach((rec) => {
                let location = [...rec.city, ...rec.state, ...rec.region, ...rec.country];
                let searchViaString = rec.search_via ? rec.search_via.map(obj => searchViaMappingObject[obj]).join(` ${rec.search_via_op} `) : '--';
                tbody.innerHTML += `<tr class="cursor-pointer" onclick="populateSearchInputs(${rec.id})">
                                        <td>
                                            <div><span class="table-text-overflow" title="${rec.keywords ? rec.keywords : '--'}}">${rec.keywords ? rec.keywords : '--'}</span></div>
                                        </td>
                                        <td>
                                            <div><span class="table-text-overflow" title="${location.join(', ') || '--'}">${location.join(', ') || '--'}</span></div>
                                        </td>
                                        <td>
                                            <div><span class="table-text-overflow" title="${searchViaString || '--'}">${searchViaString || '--'}</span></div>
                                        </td>
                                        <td>
                                            <div><span class="table-text-overflow" title="${rec.user.first_name} ${rec.user.last_name}">${rec.user.first_name} ${rec.user.last_name}</span></div>
                                        </td>
                                        <td>
                                            <div><span>${getFormattedSearchTime(rec.updated_at)}</span></div>
                                        </td>
                                        <td>
                                            <div class="actions">
                                                <svg class="cursor-pointer" onclick="openDeleteSearchModal(event, 'delsearchModal', ${rec.id})" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8.41602 20.25C7.91185 20.25 7.48025 20.0705 7.12122 19.7115C6.7622 19.3524 6.58268 18.9208 6.58268 18.4167V6.5H5.66602V4.66667H10.2493V3.75H15.7493V4.66667H20.3327V6.5H19.416V18.4167C19.416 18.9208 19.2365 19.3524 18.8775 19.7115C18.5184 20.0705 18.0868 20.25 17.5827 20.25H8.41602ZM17.5827 6.5H8.41602V18.4167H17.5827V6.5ZM10.2493 16.5833H12.0827V8.33333H10.2493V16.5833ZM13.916 16.5833H15.7493V8.33333H13.916V16.5833Z" fill="#68759A"/>
                                                </svg>
                                            </div>
                                        </td>
                                    </tr>`
            })
            loader.classList.add('hide');
            savedSearchesTableContainer.classList.remove('hide');
            headerRecordCountText.innerText = res.pagination.count || 0;
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next);
            savedSearchesTableContainer.classList.remove('hide');
        }
        else {
            tbody.innerHTML = `<tr>
                                    <td colspan="6" class="no-record-row">No Record Available</td>
                                </tr>`
        }
    })
}

window.addEventListener('load', getList(requiredDataURL));


function generatePages(currentPage, totalPages, previousLink, nextLink) {
    const pagesContainer = document.getElementById('pages-container');
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
            let pageUrl = setParams(requiredDataURL, 'page', page);
            span.setAttribute("onclick", `getList('${pageUrl}')`);
        }
    })
    if (previousLink) {
        let firstPageURL = setParams(requiredDataURL, 'page', 1);
        getFirstPageBtn.setAttribute('onclick', `getList('${firstPageURL}')`);
        getFirstPageBtn.classList.remove('opacity-point-3-5');
        getFirstPageBtn.classList.add('cursor-pointer');
        getPreviousPageBtn.setAttribute('onclick', `getList('${previousLink}')`);
        getPreviousPageBtn.classList.remove('opacity-point-3-5');
        getPreviousPageBtn.classList.add('cursor-pointer');
    }
    else {
        getFirstPageBtn.removeAttribute('onclick');
        getFirstPageBtn.classList.add('opacity-point-3-5');
        getFirstPageBtn.classList.remove('cursor-pointer');
        getPreviousPageBtn.removeAttribute('onclick');
        getPreviousPageBtn.classList.add('opacity-point-3-5');
        getPreviousPageBtn.classList.remove('cursor-pointer');
    }

    if (nextLink) {
        let lastPageURL = setParams(requiredDataURL, 'page', totalPages);
        getLastPageBtn.setAttribute('onclick', `getList('${lastPageURL}')`);
        getLastPageBtn.classList.remove('opacity-point-3-5');
        getLastPageBtn.classList.add('cursor-pointer');
        getNextPageBtn.setAttribute('onclick', `getList('${nextLink}')`);
        getNextPageBtn.classList.remove('opacity-point-3-5');
        getNextPageBtn.classList.add('cursor-pointer');
    }
    else {
        getLastPageBtn.removeAttribute('onclick');
        getLastPageBtn.classList.add('opacity-point-3-5');
        getLastPageBtn.classList.remove('cursor-pointer');
        getNextPageBtn.removeAttribute('onclick');
        getNextPageBtn.classList.add('opacity-point-3-5');
        getNextPageBtn.classList.remove('cursor-pointer');
    }
}


function openDeleteSearchModal(event, modalId, id) {
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `deleteSaveForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
    })
    document.querySelector(`.${modalId}`).click();
}


async function deleteSaveForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let formDataObject = formDataToObject(formData);
    let token = getCookie('user_access');
    let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": 'application/json'
    };
    try {
        let response = await requestAPI(`${apiURL}/save/search/${id}`, null, headers, 'DELETE');
        if (response.status == 204) {
            location.reload();
        }
        else {
            response.json().then(function(res) {
                console.log(res);
            })
        }
    }
    catch (err) {
        console.log(err);
    }
}


function getFormattedSearchTime(dateString) {
    try {
        const searchDate = new Date(dateString);
        return `${searchDate.getDate().toString().padStart(2, '0')}-${(searchDate.getMonth() + 1).toString().padStart(2, '0')}-${searchDate.getFullYear()}`;
    }
    catch (err) {
        console.log(err);
        return dateString;
    }
}

const searchViaMappingObject = {
    "email1": "Personal Email",
    "email2": "Work Email",
    "phone1": "Mobile",
    "phone2": "Direct",
}