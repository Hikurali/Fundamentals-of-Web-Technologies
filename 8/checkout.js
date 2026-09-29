const orderForm = document.querySelector(".order-form");
const orderDishes = document.querySelector(".order-dishes");
const emptyOrder = document.querySelector(".empty-order");
const orderLoadMessage = document.querySelector(".order-load-message");
const deliveryTime = document.getElementById("delivery-time");

function updateOrderInformation() {
    const selectedDishes = getSelectedDishes();
    const categories = ["soup", "main-course", "starter", "drink", "dessert"];

    categories.forEach(function (category) {
        const dish = selectedDishes.find(function (item) {
            return item.category === category;
        });
        const text = document.querySelector(
            '[data-order-category="' + category + '"]'
        );

        if (dish !== undefined) {
            text.textContent = dish.name + " " + dish.price + " ₽";
        } else {
            text.textContent = category === "main-course" ? "Не выбрано" : "Не выбран";
        }
    });

    const total = selectedDishes.reduce(function (sum, dish) {
        return sum + dish.price;
    }, 0);

    document.querySelector(".total-price").textContent = total + " ₽";
}

function displayOrderDishes() {
    const selectedDishes = getSelectedDishes();
    const categoryOrder = ["soup", "main-course", "starter", "drink", "dessert"];

    selectedDishes.sort(function (firstDish, secondDish) {
        return categoryOrder.indexOf(firstDish.category)
            - categoryOrder.indexOf(secondDish.category);
    });

    orderDishes.innerHTML = "";
    emptyOrder.hidden = selectedDishes.length !== 0;

    selectedDishes.forEach(function (dish) {
        const card = `
            <div class="dish" data-id="${dish.id}">
                <img class="dish-image" src="${dish.image}" alt="${dish.name}">
                <p class="dish-price">${dish.price} ₽</p>
                <p class="dish-name">${dish.name}</p>
                <p class="dish-weight">${dish.count}</p>
                <button class="remove-button" type="button">Удалить</button>
            </div>
        `;

        orderDishes.insertAdjacentHTML("beforeend", card);
    });

    orderDishes.querySelectorAll(".remove-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const card = button.closest(".dish");
            removeDishFromOrder(card.dataset.id);
            displayOrderDishes();
            updateOrderInformation();
        });
    });
}

function createOrderData(selectedDishes) {
    const formData = new FormData(orderForm);
    const categoryFields = {
        soup: "soup_id",
        "main-course": "main_course_id",
        starter: "salad_id",
        drink: "drink_id",
        dessert: "dessert_id"
    };
    const order = {
        full_name: formData.get("full_name"),
        email: formData.get("email"),
        subscribe: formData.get("subscribe") !== null,
        phone: formData.get("phone"),
        delivery_address: formData.get("delivery_address"),
        delivery_type: formData.get("delivery_type"),
        comment: formData.get("comment")
    };

    if (order.delivery_type === "by_time") {
        order.delivery_time = formData.get("delivery_time");
    }

    selectedDishes.forEach(function (dish) {
        order[categoryFields[dish.category]] = Number(dish.id);
    });

    return order;
}

document.querySelectorAll('input[name="delivery_type"]').forEach(function (option) {
    option.addEventListener("change", function () {
        deliveryTime.required = option.value === "by_time" && option.checked;
    });
});

orderForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const selectedDishes = getSelectedDishes();
    const notificationText = getNotificationText(selectedDishes);

    if (notificationText !== "") {
        showNotification(notificationText);
        return;
    }

    if (!orderForm.checkValidity()) {
        orderForm.reportValidity();
        return;
    }

    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        await sendOrder(createOrderData(selectedDishes));
        clearOrder();
        displayOrderDishes();
        updateOrderInformation();
        orderForm.reset();
        deliveryTime.required = false;
        showNotification("Заказ успешно оформлен");
    } catch (error) {
        showNotification("Ошибка: " + error.message);
        console.error(error);
    } finally {
        submitButton.disabled = false;
    }
});

async function startOrderPage() {
    try {
        await loadDishes();
        orderLoadMessage.hidden = true;
        displayOrderDishes();
        updateOrderInformation();
    } catch (error) {
        orderLoadMessage.textContent = "Не удалось загрузить блюда. Попробуйте обновить страницу позже.";
        console.error(error);
    }
}

startOrderPage();
