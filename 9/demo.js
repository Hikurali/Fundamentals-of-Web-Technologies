// Учебный режим включается только явным параметром в адресе страницы.
const demoMode = new URLSearchParams(location.search).get("demo") === "1";
const demoOrdersKey = "lab9DemoOrders";

function getDemoOrders() {
    const savedOrders = localStorage.getItem(demoOrdersKey);

    if (savedOrders === null) {
        return [];
    }

    const result = JSON.parse(savedOrders);

    if (!Array.isArray(result)) {
        throw new Error("Не удалось прочитать учебные заказы в этом браузере");
    }

    return result;
}

function saveDemoOrder(orderData) {
    const savedOrders = getDemoOrders();

    if (savedOrders.length >= 10) {
        throw new Error("Можно сохранить не более 10 учебных заказов. Удалите один из старых.");
    }

    const date = new Date().toISOString();
    const order = Object.assign({}, orderData, {
        id: savedOrders.reduce(function (nextId, item) {
            return Math.max(nextId, Number(item.id) + 1);
        }, Date.now()),
        created_at: date,
        updated_at: date
    });

    savedOrders.push(order);
    localStorage.setItem(demoOrdersKey, JSON.stringify(savedOrders));
    return order;
}

function updateDemoOrder(orderId, orderData) {
    const savedOrders = getDemoOrders();
    const order = savedOrders.find(function (item) {
        return Number(item.id) === Number(orderId);
    });

    if (order === undefined) {
        throw new Error("Учебный заказ не найден. Обновите страницу.");
    }

    Object.assign(order, orderData, { updated_at: new Date().toISOString() });
    localStorage.setItem(demoOrdersKey, JSON.stringify(savedOrders));
    return order;
}

function deleteDemoOrder(orderId) {
    const savedOrders = getDemoOrders();
    const order = savedOrders.find(function (item) {
        return Number(item.id) === Number(orderId);
    });

    if (order === undefined) {
        throw new Error("Учебный заказ не найден. Обновите страницу.");
    }

    const remainingOrders = savedOrders.filter(function (item) {
        return Number(item.id) !== Number(orderId);
    });

    localStorage.setItem(demoOrdersKey, JSON.stringify(remainingOrders));
    return order;
}

function showServiceError(error) {
    let message = document.querySelector(".service-error");

    if (message === null) {
        message = document.createElement("div");
        message.className = "service-error";
        message.setAttribute("role", "alert");
        document.querySelector("main").prepend(message);
    }

    message.textContent = "";
    const text = document.createElement("p");
    text.textContent = error.message;

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.textContent = "Повторить загрузку";
    retryButton.addEventListener("click", function () {
        location.reload();
    });
    message.append(text, retryButton);

    if (!demoMode) {
        const demoLink = document.createElement("a");
        const demoUrl = new URL(location.href);
        demoUrl.searchParams.set("demo", "1");
        demoLink.href = demoUrl.toString();
        demoLink.textContent = "Открыть учебный режим";
        message.append(demoLink);

        const note = document.createElement("p");
        note.textContent = "В учебном режиме можно проверить меню и заказы без API Политеха. Данные сохраняются только в этом браузере.";
        message.append(note);
    }
}

if (demoMode) {
    document.querySelectorAll('a[href]').forEach(function (link) {
        const url = new URL(link.href);
        const currentDirectory = new URL(".", location.href).pathname;

        if (url.origin === location.origin
            && url.pathname.startsWith(currentDirectory)
            && url.pathname.endsWith(".html")) {
            url.searchParams.set("demo", "1");
            link.href = url.toString();
        }
    });

    const notice = document.createElement("aside");
    notice.className = "demo-notice";
    const text = document.createElement("p");
    text.textContent = "Учебный режим: меню из локального файла, заказы сохраняются в этом браузере. API Политеха не используется.";

    const exitLink = document.createElement("a");
    const normalUrl = new URL(location.href);
    normalUrl.searchParams.delete("demo");
    exitLink.href = normalUrl.toString();
    exitLink.textContent = "Вернуться к API Политеха";
    notice.append(text, exitLink);
    document.querySelector("header").after(notice);
}
