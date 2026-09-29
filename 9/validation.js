function getNotificationText(selectedDishes) {
    const soup = selectedDishes.some(function (dish) {
        return dish.category === "soup";
    });
    const mainCourse = selectedDishes.some(function (dish) {
        return dish.category === "main-course";
    });
    const starter = selectedDishes.some(function (dish) {
        return dish.category === "starter";
    });
    const drink = selectedDishes.some(function (dish) {
        return dish.category === "drink";
    });
    const dessert = selectedDishes.some(function (dish) {
        return dish.category === "dessert";
    });

    if (!soup && !mainCourse && !starter && !drink && !dessert) {
        return "Ничего не выбрано. Выберите блюда для заказа";
    }

    if (!soup && !mainCourse && !starter) {
        return "Выберите главное блюдо";
    }

    if (soup && !mainCourse && !starter) {
        return "Выберите главное блюдо/салат/стартер";
    }

    if (starter && !soup && !mainCourse) {
        return "Выберите суп или главное блюдо";
    }

    if (!drink) {
        return "Выберите напиток";
    }

    return "";
}

function showNotification(text) {
    const oldNotification = document.querySelector(".notification");

    if (oldNotification !== null) {
        oldNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification";

    const message = document.createElement("p");
    message.className = "notification-text";
    message.textContent = text;

    const button = document.createElement("button");
    button.className = "notification-button";
    button.type = "button";
    button.textContent = "Окей 👌";

    notification.append(message, button);
    document.body.append(notification);

    button.addEventListener("click", function () {
        notification.remove();
    });
}
