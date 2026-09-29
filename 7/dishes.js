const dishesApiUrl = "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes";
let dishes = [];

async function loadDishes() {
    const response = await fetch(dishesApiUrl);

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
