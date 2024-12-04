function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
}

document.addEventListener("DOMContentLoaded", function() {
    var tableRows = document.querySelectorAll("#individual_table tbody tr");
    tableRows.forEach(function(row) {
        row.addEventListener("click", function() {
            var pk = this.dataset.pk;
            console.log(pk)
            window.location.href = "/administration/individual-detail/" + pk;
        });
    });
});

const sortOrders = {};

function table_sort(event, index) {
    const arrows = event.target.closest('th').querySelectorAll('path');
    table = document.getElementById('individual_table')
    const currentOrder = sortOrders[index] || 'asc';
    const arr = Array.from(table.querySelectorAll('tbody tr'));
    arr.sort((a, b) => {
        const a_val = a.children[index].innerText
        const b_val = b.children[index].innerText
        return currentOrder === 'asc' ? a_val.localeCompare(b_val) : b_val.localeCompare(a_val)
    })
    arr.forEach(elem => {
        table.querySelector("tbody").appendChild(elem)
    })
    arrows[0].setAttribute('opacity', currentOrder === 'asc' ? '0.2' : '1');
    arrows[1].setAttribute('opacity', currentOrder === 'asc' ? '1' : '0.2');
    sortOrders[index] = currentOrder === 'asc' ? 'desc' : 'asc';
}

function table_sort_by_state(event, index) {
    const arrows = event.target.closest('th').querySelectorAll('path');
    table = document.getElementById('individual_table')
    const currentOrder = sortOrders[index] || 'asc';
    const arr = Array.from(table.querySelectorAll('tbody tr'));
    arr.sort((a, b) => {
        const a_val = a.getAttribute('data-state')
        const b_val = b.getAttribute('data-state')
        return currentOrder === 'asc' ? a_val.localeCompare(b_val) : b_val.localeCompare(a_val)
    })
    arr.forEach(elem => {
        table.querySelector("tbody").appendChild(elem)
    })
    arrows[0].setAttribute('opacity', currentOrder === 'asc' ? '0.2' : '1');
    arrows[1].setAttribute('opacity', currentOrder === 'asc' ? '1' : '0.2');
    sortOrders[index] = currentOrder === 'asc' ? 'desc' : 'asc';
}
