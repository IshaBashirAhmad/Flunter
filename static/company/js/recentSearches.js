let candidateTableContainer = document.getElementById('table-container-div');
let loader = document.querySelector('#table-loader');
let urlParams = 'q=&page=';


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
}


function populateSearchInputs(keywords, location, search_via) {
    document.querySelector('input[name=keywords]').value = keywords;
    document.querySelector('input[name=location]').value = location;
    document.querySelector(`input[name="search_by_filter"][value="${search_via}"]`).click();
}


function searchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    console.log(data);
    if (!data.search_by_filter) {
        return false;
    }
    sessionStorage.setItem('searchData', JSON.stringify(data));
    location.pathname = '/search-profile/';
}


function openDeleteSearchModal(event, modalId, id, type) {
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `deleteSaveForm(event, ${id}, '${type}');`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
    })
    document.querySelector(`.${modalId}`).click();
}


async function deleteSaveForm(event, id, type) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let formDataObject = formDataToObject(formData);
    let headers = { "X-CSRFToken": formDataObject.csrfmiddlewaretoken, "Content-Type": "application/json" };
    let data = { "id": id, "type": type };
    try {
        let response = await requestAPI('/users/del-search/', JSON.stringify(data), headers, 'POST');
        if (response.ok) {
            location.reload();
        }
    }
    catch (err) {
        console.log(err);
    }
}


function deleteSearch(id){
    console.log(id);
    var link = '/users/delete-search/' + id;
    var modal_button = document.getElementById('delete_search_modal_button');
    modal_button.onclick = function(){
        window.location.href = link;
    }
}


// async function getList(params) {
//     candidateTableContainer.classList.add('hide');
//     loader.classList.remove('hide');
//     let response = await requestAPI(`/users/get-recent-searches/${params}/`, null, {}, 'GET');
//     response.json().then(function(res) {
//         if(res.success) {
//             candidateTableContainer.innerHTML = res.html;
//             loader.classList.add('hide');
//             generatePages(res.current_page, res.total_pages);
//             candidateTableContainer.classList.remove('hide');
//             urlParams = params;
//         }
//     })
// }

// window.addEventListener('load', getList(urlParams));


function generatePages(currentPage, totalPages) {
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
            let pageUrl = setParams(urlParams, 'page', page);
            span.setAttribute("onclick", `getList('${pageUrl}')`);
        }
    })
}