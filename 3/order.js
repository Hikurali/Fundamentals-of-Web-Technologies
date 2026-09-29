const addButtons = document.querySelectorAll(".add-button");
const orderStatus = document.querySelector(".order-status");

for (const button of addButtons) {
    button.addEventListener("click", function () {
        const select = document.getElementById(button.dataset.category);
        select.value = button.dataset.dish;
        orderStatus.textContent = "Добавлено: " +
            select.options[select.selectedIndex].text;
    });
}

const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
const deliveryTime = document.getElementById("delivery-time");

for (const option of deliveryOptions) {
    option.addEventListener("change", function () {
        deliveryTime.required = option.value === "scheduled" && option.checked;
    });
}

document.querySelector(".order-form").addEventListener("reset", function () {
    orderStatus.textContent = "";
    deliveryTime.required = false;
});

