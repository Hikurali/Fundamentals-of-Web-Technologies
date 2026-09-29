function orderMatchesCombo(selectedDishes) {
    const hasMainCourse = selectedDishes.some(function (dish) {
        return dish.category === "main-course";
    });
    const hasSoup = selectedDishes.some(function (dish) {
        return dish.category === "soup";
    });
    const hasStarter = selectedDishes.some(function (dish) {
        return dish.category === "starter";
    });
    const hasDrink = selectedDishes.some(function (dish) {
        return dish.category === "drink";
    });

    return hasDrink && (hasMainCourse || (hasSoup && hasStarter));
}

function setupOrder() {
    const dishCards = document.querySelectorAll(".dish");
    const checkoutPanel = document.querySelector(".checkout-panel");
    const checkoutTotal = document.querySelector(".checkout-total");
    const checkoutLink = document.querySelector(".checkout-link");

    function updateOrderPanel() {
        const selectedDishes = getSelectedDishes();
        const total = selectedDishes.reduce(function (sum, dish) {
            return sum + dish.price;
        }, 0);

        checkoutPanel.hidden = selectedDishes.length === 0;
        checkoutTotal.textContent = total + " ₽";

        const isValidOrder = orderMatchesCombo(selectedDishes);
        checkoutLink.classList.toggle("disabled", !isValidOrder);
        checkoutLink.setAttribute("aria-disabled", String(!isValidOrder));

        dishCards.forEach(function (card) {
            const isSelected = selectedDishes.some(function (dish) {
                return dish.keyword === card.dataset.dish;
            });

            card.classList.toggle("selected", isSelected);
        });
    }

    dishCards.forEach(function (card) {
        const button = card.querySelector(".add-button");

        button.addEventListener("click", function () {
            const selectedDish = dishes.find(function (dish) {
                return dish.keyword === card.dataset.dish;
            });

            addDishToOrder(selectedDish);
            updateOrderPanel();
        });
    });

    checkoutLink.addEventListener("click", function (event) {
        if (checkoutLink.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
        }
    });

    updateOrderPanel();
}
