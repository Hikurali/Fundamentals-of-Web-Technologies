const apiBaseUrl = "https://edu.std-900.ist.mospolytech.ru";
// Персональный ключ из СДО нужно вставить между кавычками.
const apiKey = "";
let dishes = [];

function getApiUrl(path) {
    const url = new URL(apiBaseUrl + path);

    if (apiKey !== "") {
        url.searchParams.set("api_key", apiKey);
    }

    return url.toString();
}

async function loadDishes() {
    const response = await fetch(getApiUrl("/labs/api/dishes"));

    if (!response.ok) {
        throw new Error("Не удалось загрузить блюда");
    }

    const data = await response.json();

    dishes = data.map(function (dish) {
        if (dish.category === "salad") {
            dish.category = "starter";
        }

        return dish;
    });

    return dishes;
}

async function sendOrder(order) {
    if (apiKey === "") {
        throw new Error("Для отправки заказа нужно указать персональный API-ключ");
    }

    const response = await fetch(getApiUrl("/labs/api/orders"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
    });

    const result = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(result.error || "Не удалось оформить заказ");
    }

    return result;
}

function checkApiKey() {
    if (apiKey === "") {
        throw new Error("Для работы с заказами нужно указать персональный API-ключ");
    }
}

async function loadOrders() {
    checkApiKey();
    const response = await fetch(getApiUrl("/labs/api/orders"));
    const result = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(result.error || "Не удалось загрузить заказы");
    }

    return result;
}

async function updateOrderOnServer(orderId, orderData) {
    checkApiKey();
    const response = await fetch(getApiUrl("/labs/api/orders/" + orderId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    });
    const result = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(result.error || "Не удалось изменить заказ");
    }

    return result;
}

async function deleteOrderOnServer(orderId) {
    checkApiKey();
    const response = await fetch(getApiUrl("/labs/api/orders/" + orderId), {
        method: "DELETE"
    });
    const result = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить заказ");
    }

    return result;
}
