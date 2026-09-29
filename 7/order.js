function setupOrder() {
    const selectedDishes = {
        soup: undefined,
        "main-course": undefined,
        starter: undefined,
        drink: undefined,
        dessert: undefined
    };

    const dishCards = document.querySelectorAll(".dish");
    const nothingSelected = document.querySelector(".nothing-selected");
    const selectedItems = document.querySelector(".selected-items");
    const totalPrice = document.querySelector(".total-price");
    const orderForm = document.querySelector(".order-form");

    function updateOrder() {
        const selectedList = Object.values(selectedDishes).filter(function (dish) {
            return dish !== undefined;
        });

        const hasSelectedDishes = selectedList.length > 0;
        nothingSelected.hidden = hasSelectedDishes;
        selectedItems.hidden = !hasSelectedDishes;

        const categories = ["soup", "main-course", "starter", "drink", "dessert"];

        categories.forEach(function (category) {
            const dish = selectedDishes[category];
            const text = document.querySelector(
                '[data-order-category="' + category + '"]'
            );
            const hiddenInput = document.getElementById(category + "-keyword");

            if (dish !== undefined) {
                text.textContent = dish.name + " " + dish.price + " ₽";
                hiddenInput.value = dish.keyword;
            } else {
                text.textContent = category === "drink"
                    ? "Напиток не выбран"
                    : "Блюдо не выбрано";
                hiddenInput.value = "";
            }
        });

        const sum = selectedList.reduce(function (total, dish) {
            return total + dish.price;
        }, 0);

        totalPrice.textContent = sum + " ₽";
    }

    dishCards.forEach(function (card) {
        const button = card.querySelector(".add-button");

        button.addEventListener("click", function () {
            const keyword = card.dataset.dish;
            const selectedDish = dishes.find(function (dish) {
                return dish.keyword === keyword;
            });

            selectedDishes[selectedDish.category] = selectedDish;

            dishCards.forEach(function (dishCard) {
                const dishInCard = dishes.find(function (dish) {
                    return dish.keyword === dishCard.dataset.dish;
                });

                if (dishInCard.category === selectedDish.category) {
                    dishCard.classList.remove("selected");
                }
            });

            card.classList.add("selected");
            updateOrder();
        });
    });

    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    const deliveryTime = document.getElementById("delivery-time");

    deliveryOptions.forEach(function (option) {
        option.addEventListener("change", function () {
            deliveryTime.required = option.value === "scheduled" && option.checked;
        });
    });

    orderForm.addEventListener("reset", function () {
        selectedDishes.soup = undefined;
        selectedDishes["main-course"] = undefined;
        selectedDishes.starter = undefined;
        selectedDishes.drink = undefined;
        selectedDishes.dessert = undefined;

        dishCards.forEach(function (card) {
            card.classList.remove("selected");
        });

        deliveryTime.required = false;
        updateOrder();
    });

    updateOrder();
}
