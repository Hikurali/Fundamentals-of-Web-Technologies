const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const menu = JSON.parse(fs.readFileSync(path.join(root, "demo-dishes.json"), "utf8"));

function makePage({ demo = false, respond } = {}) {
    const saved = new Map([["selectedDishIds", "[999]"]]);
    const requests = [];
    const element = () => ({ append() {}, after() {} });
    const context = vm.createContext({
        URL, URLSearchParams, AbortController, setTimeout, clearTimeout, console,
        crypto: webcrypto,
        location: new URL("https://example.test/9/lunch.html" + (demo ? "?demo=1" : "")),
        document: {
            cookie: "",
            querySelectorAll: () => [],
            querySelector: element,
            createElement: element
        },
        localStorage: {
            getItem: (name) => saved.get(name) ?? null,
            setItem: (name, value) => saved.set(name, String(value)),
            removeItem: (name) => saved.delete(name)
        },
        fetch: async (url, options) => {
            requests.push({ url, options });
            if (respond) return respond(url, options);
            return { ok: true, status: 200, json: async () => structuredClone(menu) };
        }
    });

    vm.runInContext(fs.readFileSync(path.join(root, "../shared/api-config.js"), "utf8"), context);
    for (const file of ["demo.js", "dishes.js", "storage.js", "order.js", "validation.js"]) {
        const source = fs.readFileSync(path.join(root, file), "utf8");
        vm.runInContext(source, context, { filename: file });
    }

    return { context, saved, requests, run: (source) => vm.runInContext(source, context) };
}

test("Учебное меню: 30 разных ID, 6 блюд в каждой категории, изображения существуют", () => {
    assert.equal(menu.length, 30);
    assert.equal(new Set(menu.map((dish) => dish.id)).size, 30);
    for (const category of ["soup", "main-course", "starter", "drink", "dessert"]) {
        assert.equal(menu.filter((dish) => dish.category === category).length, 6);
    }
    for (const dish of menu) assert.ok(fs.existsSync(path.join(root, dish.image)));
});

test("Учебные блюда загружаются через fetch только из локального JSON", async () => {
    const page = makePage({ demo: true });
    const data = await page.run("loadDishes()");
    assert.equal(data.length, 30);
    assert.deepEqual(page.requests.map((request) => request.url), ["demo-dishes.json"]);
});

test("Выбор заменяется внутри категории и не затрагивает обычный заказ", async () => {
    const page = makePage({ demo: true });
    await page.run("loadDishes()");
    page.run("addDishToOrder(dishes[0]); addDishToOrder(dishes[1]); addDishToOrder(dishes[18]);");
    assert.deepEqual(JSON.parse(page.saved.get("lab9DemoSelectedDishIds")), [2, 19]);
    assert.equal(page.saved.get("selectedDishIds"), "[999]");
    page.run("clearOrder()");
    assert.equal(page.saved.get("selectedDishIds"), "[999]");
});

test("Проверка всех комбинаций категорий допускает ровно пять комбо плюс десерт", () => {
    const page = makePage();
    const categories = ["soup", "main-course", "starter", "drink", "dessert"];
    const allowed = ["1111", "1101", "1011", "0111", "0101"];
    for (let mask = 0; mask < 32; mask++) {
        const selected = categories.filter((_, bit) => mask & (1 << bit));
        page.context.selectedForTest = selected.map((category) => ({ category }));
        const expected = allowed.includes(categories.slice(0, 4)
            .map((category) => selected.includes(category) ? "1" : "0").join(""));
        assert.equal(page.run("orderMatchesCombo(selectedForTest)"), expected);
        assert.equal(page.run("getNotificationText(selectedForTest) === ''"), expected);
    }
});

test("Учебный заказ можно создать, перечитать, изменить и удалить без внешних запросов", async () => {
    const page = makePage({ demo: true });
    const order = await page.run("sendOrder({full_name:'Тест',main_course_id:7,drink_id:19,delivery_type:'now'})");
    const id = order.id;
    assert.equal((await page.run("loadOrders()")).length, 1);
    await page.run(`updateOrderOnServer(${id}, {full_name:'Изменено',comment:'Комментарий'})`);
    const changed = (await page.run("loadOrders()"))[0];
    assert.equal(changed.full_name, "Изменено");
    assert.equal(changed.main_course_id, 7);
    assert.equal(changed.created_at, order.created_at);
    await page.run(`deleteOrderOnServer(${id})`);
    assert.equal((await page.run("loadOrders()")).length, 0);
    assert.equal(page.requests.length, 0);
    assert.equal(page.saved.get("selectedDishIds"), "[999]");
});

test("Учебные заказы доступны после повторного открытия страницы в том же браузере", async () => {
    const page = makePage({ demo: true });
    await page.run("sendOrder({full_name:'Тест'})");
    const otherPage = makePage({ demo: true });
    otherPage.saved.set("lab9DemoOrders", page.saved.get("lab9DemoOrders"));
    assert.equal((await otherPage.run("loadOrders()"))[0].full_name, "Тест");
});

test("Ключ пользователя создаётся один раз в cookie, а не в localStorage", () => {
    const page = makePage();
    const firstKey = page.run("getOwnApiKey()");
    assert.match(firstKey, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(page.run("getOwnApiKey()"), firstKey);
    assert.deepEqual([...page.saved.keys()], ["selectedDishIds"]);
    assert.equal(page.requests.length, 0);
});

test("HTTP 502 с HTML-ответом превращается в понятную ошибку", async () => {
    const page = makePage({ respond: async () => ({
        ok: false, status: 502, json: async () => { throw new SyntaxError(); }
    }) });
    await assert.rejects(page.run("loadDishes()"), /HTTP 502/);
});

test("Сетевая ошибка объясняется отдельно", async () => {
    const page = makePage();
    page.run("fetch = async function () { throw new TypeError('Failed to fetch'); }");
    await assert.rejects(page.run("loadDishes()"), /Не удалось соединиться/);
});

test("Основной режим сохраняет методы GET, POST, PUT, DELETE и api_key в URL", async () => {
    const page = makePage({ respond: async (url, options) => ({
        ok: true, status: 200,
        json: async () => options.method ? { id: 123 } : []
    }) });
    await page.run("loadOrders()");
    await page.run("sendOrder({full_name:'Тест'})");
    await page.run("updateOrderOnServer(123,{comment:'Изменено'})");
    await page.run("deleteOrderOnServer(123)");
    assert.deepEqual(page.requests.map((request) => request.options.method || "GET"), ["GET", "POST", "PUT", "DELETE"]);
    for (const request of page.requests) {
        assert.equal(new URL(request.url).searchParams.get("api_key"), page.run("getOwnApiKey()"));
        assert.equal(new URL(request.url).origin, "https://82.23.173.175");
    }
    assert.equal(JSON.parse(page.requests[2].options.body).comment, "Изменено");
});
