const sortedDishes = dishes.sort(function (firstDish, secondDish) {
    return firstDish.name.localeCompare(secondDish.name, "ru");
});

sortedDishes.forEach(function (dish) {
    const container = document.querySelector(
        '.dishes[data-category="' + dish.category + '"]'
    );

    const card = `
        <div class="dish" data-dish="${dish.keyword}">
            <img class="dish-image" src="${dish.image}" alt="${dish.name}">
            <p class="dish-price">${dish.price} ₽</p>
            <p class="dish-name">${dish.name}</p>
            <p class="dish-weight">${dish.count}</p>
            <button class="add-button" type="button">Добавить</button>
        </div>
    `;

    container.insertAdjacentHTML("beforeend", card);
});
