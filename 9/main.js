function showLoadMessage(text) {
    const containers = document.querySelectorAll(".dishes");

    containers.forEach(function (container) {
        container.innerHTML = '<p class="load-message">' + text + "</p>";
    });
}

async function startPage() {
    showLoadMessage("Загрузка блюд...");

    try {
        await loadDishes();
        displayDishes();
        setupOrder();
        setupFilters();
    } catch (error) {
        showLoadMessage("");
        showServiceError(error);
        console.error(error);
    }
}

startPage();
