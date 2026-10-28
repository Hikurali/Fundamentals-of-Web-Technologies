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
    apiKey = getOwnApiKey();

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
