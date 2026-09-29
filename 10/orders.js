let orders = [];
let editedOrderId;
let deletedOrderId;

const orderFields = [
    { field: "soup_id", label: "Суп" },
    { field: "main_course_id", label: "Основное блюдо" },
    { field: "salad_id", label: "Салат/стартер" },
    { field: "drink_id", label: "Напиток" },
    { field: "dessert_id", label: "Десерт" }
];

const ordersMessage = document.querySelector(".orders-message");
const tableWrapper = document.querySelector(".orders-table-wrapper");
const tableBody = document.querySelector(".orders-table tbody");
const editForm = document.querySelector(".edit-order-form");
const editDeliveryTime = document.getElementById("edit-delivery-time");

function getDish(dishId) {
    return dishes.find(function (dish) {
        return Number(dish.id) === Number(dishId);
    });
}

function getOrderDishes(order) {
    return orderFields.map(function (item) {
        const dish = getDish(order[item.field]);

        if (dish === undefined) {
            return undefined;
        }

        return {
            label: item.label,
            dish: dish
        };
    }).filter(function (item) {
        return item !== undefined;
    });
}

function getOrderTotal(order) {
    return getOrderDishes(order).reduce(function (sum, item) {
        return sum + item.dish.price;
    }, 0);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDelivery(order) {
    if (order.delivery_type === "by_time") {
        return order.delivery_time;
    }

    return "Как можно скорее (с 7:00 до 23:00)";
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function createActionButton(text, className, orderId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "table-action " + className;
    button.dataset.orderId = orderId;
    button.textContent = text;
    return button;
}

function displayOrders() {
    tableBody.innerHTML = "";
    orders.sort(function (firstOrder, secondOrder) {
        return new Date(secondOrder.created_at) - new Date(firstOrder.created_at);
    });

    ordersMessage.hidden = orders.length !== 0;
    tableWrapper.hidden = orders.length === 0;

    if (orders.length === 0) {
        ordersMessage.textContent = "Заказов пока нет.";
        return;
    }

    orders.forEach(function (order, index) {
        const row = document.createElement("tr");
        const dishNames = getOrderDishes(order).map(function (item) {
            return item.dish.name;
        }).join(", ");

        row.append(
            createCell(index + 1),
            createCell(formatDate(order.created_at)),
            createCell(dishNames),
            createCell(getOrderTotal(order) + " ₽"),
            createCell(formatDelivery(order))
        );

        const actions = document.createElement("td");
        actions.className = "table-actions";
        actions.append(
            createActionButton("Подробнее", "view-order", order.id),
            createActionButton("Редактировать", "edit-order", order.id),
            createActionButton("Удалить", "delete-order", order.id)
        );
        row.append(actions);
        tableBody.append(row);
    });
}

function openModal(modalId) {
    document.getElementById(modalId).hidden = false;
    document.body.classList.add("modal-open");
}

function closeModal(modal) {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
}

function appendDetail(container, label, value) {
    const row = document.createElement("p");

    if (label !== "") {
        const title = document.createElement("strong");
        title.textContent = label + ": ";
        row.append(title);
    }

    row.append(document.createTextNode(value || "Не указано"));
    container.append(row);
}

function appendComposition(container, order) {
    getOrderDishes(order).forEach(function (item) {
        appendDetail(
            container,
            item.label,
            item.dish.name + " (" + item.dish.price + " ₽)"
        );
    });
}

function showOrderDetails(order) {
    const details = document.querySelector(".view-details");
    details.innerHTML = "";

    appendDetail(details, "Дата оформления", formatDate(order.created_at));

    const deliveryTitle = document.createElement("h3");
    deliveryTitle.textContent = "Доставка";
    details.append(deliveryTitle);
    appendDetail(details, "Имя получателя", order.full_name);
    appendDetail(details, "Адрес доставки", order.delivery_address);
    appendDetail(details, "Время доставки", formatDelivery(order));
    appendDetail(details, "Телефон", order.phone);
    appendDetail(details, "Email", order.email);

    const commentTitle = document.createElement("h3");
    commentTitle.textContent = "Комментарий";
    details.append(commentTitle);
    appendDetail(details, "", order.comment || "Комментарий отсутствует");

    const compositionTitle = document.createElement("h3");
    compositionTitle.textContent = "Состав заказа";
    details.append(compositionTitle);
    appendComposition(details, order);
    appendDetail(details, "Стоимость", getOrderTotal(order) + " ₽");

    openModal("view-modal");
}

function updateEditDeliveryTime() {
    const deliveryType = editForm.querySelector(
        'input[name="delivery_type"]:checked'
    );
    editDeliveryTime.required = deliveryType !== null
        && deliveryType.value === "by_time";
    editDeliveryTime.disabled = !editDeliveryTime.required;
}

function showEditForm(order) {
    editedOrderId = order.id;
    editForm.elements.full_name.value = order.full_name;
    editForm.elements.delivery_address.value = order.delivery_address;
    editForm.elements.phone.value = order.phone;
    editForm.elements.email.value = order.email;
    editForm.elements.comment.value = order.comment || "";
    editForm.elements.delivery_type.value = order.delivery_type;
    editForm.elements.delivery_time.value = order.delivery_time || "";
    document.querySelector(".edit-created-at").textContent =
        "Дата оформления: " + formatDate(order.created_at);

    const composition = document.querySelector(".edit-composition");
    composition.innerHTML = "";
    appendComposition(composition, order);
    document.querySelector(".edit-total").textContent =
        "Стоимость: " + getOrderTotal(order) + " ₽";

    updateEditDeliveryTime();
    openModal("edit-modal");
}

function showDeleteConfirmation(orderId) {
    deletedOrderId = orderId;
    openModal("delete-modal");
}

tableBody.addEventListener("click", function (event) {
    const button = event.target.closest(".table-action");

    if (button === null) {
        return;
    }

    const order = orders.find(function (item) {
        return Number(item.id) === Number(button.dataset.orderId);
    });

    if (button.classList.contains("view-order")) {
        showOrderDetails(order);
    } else if (button.classList.contains("edit-order")) {
        showEditForm(order);
    } else {
        showDeleteConfirmation(order.id);
    }
});

document.querySelectorAll("[data-close-modal]").forEach(function (button) {
    button.addEventListener("click", function () {
        closeModal(button.closest(".modal"));
    });
});

editForm.querySelectorAll('input[name="delivery_type"]').forEach(function (radio) {
    radio.addEventListener("change", updateEditDeliveryTime);
});

editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!editForm.checkValidity()) {
        editForm.reportValidity();
        return;
    }

    const formData = new FormData(editForm);
    const orderData = {
        full_name: formData.get("full_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        delivery_address: formData.get("delivery_address"),
        delivery_type: formData.get("delivery_type"),
        comment: formData.get("comment")
    };

    if (orderData.delivery_type === "by_time") {
        orderData.delivery_time = formData.get("delivery_time");
    }

    const saveButton = editForm.querySelector(".save-button");
    saveButton.disabled = true;

    try {
        await updateOrderOnServer(editedOrderId, orderData);
        closeModal(document.getElementById("edit-modal"));
        showNotification("Заказ успешно изменён");
        await loadAndDisplayOrders();
    } catch (error) {
        showNotification("Ошибка: " + error.message);
        console.error(error);
    } finally {
        saveButton.disabled = false;
    }
});

document.querySelector(".delete-confirm-button").addEventListener("click", async function () {
    const deleteButton = document.querySelector(".delete-confirm-button");
    deleteButton.disabled = true;

    try {
        await deleteOrderOnServer(deletedOrderId);
        closeModal(document.getElementById("delete-modal"));
        showNotification("Заказ успешно удалён");
        await loadAndDisplayOrders();
    } catch (error) {
        showNotification("Ошибка: " + error.message);
        console.error(error);
    } finally {
        deleteButton.disabled = false;
    }
});

async function loadAndDisplayOrders() {
    orders = await loadOrders();
    displayOrders();
}

async function startOrdersPage() {
    try {
        await loadDishes();
        await loadAndDisplayOrders();
    } catch (error) {
        ordersMessage.hidden = false;
        ordersMessage.textContent = "Ошибка: " + error.message;
        tableWrapper.hidden = true;
        console.error(error);
    }
}

startOrdersPage();
