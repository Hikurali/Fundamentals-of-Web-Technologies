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
        showLoadMessage("Не удалось загрузить блюда. Попробуйте обновить страницу позже.");
        console.error(error);
    }
}

startPage();
