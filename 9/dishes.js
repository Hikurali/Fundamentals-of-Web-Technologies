const apiBaseUrl = ownApiBaseUrl;
let apiKey = "";
let dishes = [];

function getApiUrl(path) {
    const url = new URL(apiBaseUrl + path);

    if (apiKey !== "") {
        url.searchParams.set("api_key", apiKey);
    }

    return url.toString();
}

async function requestApi(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(function () {
        controller.abort();
    }, 12000);

    try {
        const response = await fetch(getApiUrl(path), Object.assign({}, options, {
            signal: controller.signal
        }));
        const result = await response.json().catch(function () {
            return undefined;
        });

        if (!response.ok) {
            const message = result && result.error
                ? result.error
                : "Сервер вернул ошибку HTTP " + response.status + ". Попробуйте позже.";
            throw new Error(message);
        }

        if (response.status === 204) {
            return {};
        }

        if (result === undefined || result === null || result.error) {
            throw new Error((result && result.error) || "Сервер вернул некорректный ответ");
        }

        return result;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Сервер не ответил за 12 секунд. Попробуйте позже.");
        }

        if (error instanceof TypeError) {
            throw new Error("Не удалось соединиться с сервером. Проверьте интернет или попробуйте позже.");
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function loadDishes() {
    let data;

    if (demoMode) {
        const response = await fetch("demo-dishes.json");

        if (!response.ok) {
            throw new Error("Не удалось загрузить учебное меню");
        }

        data = await response.json();
    } else {
        data = await requestApi("/labs/api/dishes");
    }

    if (!Array.isArray(data)) {
        throw new Error("Получен некорректный список блюд");
    }

    dishes = data.map(function (dish) {
        if (dish.category === "salad") {
            dish.category = "starter";
        }

        return dish;
    });

    return dishes;
}

function checkApiKey() {
    apiKey = getOwnApiKey();
}

async function sendOrder(order) {
    if (demoMode) {
        return saveDemoOrder(order);
    }

    checkApiKey();
    return requestApi("/labs/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
    });
}

async function loadOrders() {
    if (demoMode) {
        return getDemoOrders();
    }

    checkApiKey();
    const result = await requestApi("/labs/api/orders");

    if (!Array.isArray(result)) {
        throw new Error("Получен некорректный список заказов");
    }

    return result;
}

async function updateOrderOnServer(orderId, orderData) {
    if (demoMode) {
        return updateDemoOrder(orderId, orderData);
    }

    checkApiKey();
    return requestApi("/labs/api/orders/" + orderId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    });
}

async function deleteOrderOnServer(orderId) {
    if (demoMode) {
        return deleteDemoOrder(orderId);
    }

    checkApiKey();
    return requestApi("/labs/api/orders/" + orderId, { method: "DELETE" });
}
