const orderStorageKey = "selectedDishIds";

function getSelectedDishIds() {
    const savedIds = localStorage.getItem(orderStorageKey);

    if (savedIds === null) {
        return [];
    }

    try {
        const ids = JSON.parse(savedIds);

        if (Array.isArray(ids)) {
            return ids.map(Number).filter(function (id) {
                return Number.isInteger(id);
            });
        }
    } catch (error) {
        console.error(error);
    }

    return [];
}

function saveSelectedDishIds(ids) {
    localStorage.setItem(orderStorageKey, JSON.stringify(ids));
}

function getSelectedDishes() {
    const selectedIds = getSelectedDishIds();

    return selectedIds.map(function (id) {
        return dishes.find(function (dish) {
            return Number(dish.id) === id;
        });
    }).filter(function (dish) {
        return dish !== undefined;
    });
}

function addDishToOrder(newDish) {
    const selectedDishes = getSelectedDishes();
    const otherCategories = selectedDishes.filter(function (dish) {
        return dish.category !== newDish.category;
    });
    const selectedIds = otherCategories.map(function (dish) {
        return Number(dish.id);
    });

    selectedIds.push(Number(newDish.id));
    saveSelectedDishIds(selectedIds);
}

function removeDishFromOrder(dishId) {
    const selectedIds = getSelectedDishIds().filter(function (id) {
        return id !== Number(dishId);
    });

    saveSelectedDishIds(selectedIds);
}

function clearOrder() {
    localStorage.removeItem(orderStorageKey);
}
