const filterButtons = document.querySelectorAll(".filter-button");

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const filterBlock = button.closest(".filters");
        const category = filterBlock.dataset.category;
        const selectedKind = button.dataset.kind;
        const wasActive = button.classList.contains("active");
        const categoryCards = document.querySelectorAll(
            '.dishes[data-category="' + category + '"] .dish'
        );

        filterBlock.querySelectorAll(".filter-button").forEach(function (filter) {
            filter.classList.remove("active");
        });

        categoryCards.forEach(function (card) {
            const dish = dishes.find(function (item) {
                return item.keyword === card.dataset.dish;
            });

            if (wasActive || dish.kind === selectedKind) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });

        if (!wasActive) {
            button.classList.add("active");
        }
    });
});
