const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyVn185XtgmxA3dxUQdwSdzIczeIMkBRRJ54FfDLDN9rYpAUuETaSOQUn-YFOtR98dqOg/exec";

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openBookingForm(type) {
    navigate('view-form');
    document.querySelectorAll('.form-panel').forEach(el => el.classList.remove('active'));
    document.getElementById(type + 'Form').classList.add('active');
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[type=tel]').forEach(function (tel) {
        tel.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            const err = this.parentElement.querySelector('.error-text');
            if (err) { err.style.display = (this.value.length > 0 && this.value.length !== 10) ? 'block' : 'none'; }
        });
    });
});

async function handleBooking(event, bookingType) {
    event.preventDefault();
    const form = event.target;

    const phones = form.querySelectorAll('input[type=tel]');
    for (const ph of phones) {
        if (ph.value.length !== 10) {
            ph.focus();
            const err = ph.parentElement.querySelector('.error-text');
            if (err) err.style.display = 'block';
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }
    }

    const required = form.querySelectorAll('[required]');
    for (const field of required) {
        if (!field.value.trim()) { field.focus(); alert('Please fill in all required fields before submitting.'); return; }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true; submitBtn.textContent = "Processing Request...";

    try {
        const formData = new FormData(form);
        const payload = { Booking_Type: bookingType };
        formData.forEach((value, key) => { payload[key] = value; });

        // Pickup_Time now comes directly from a native <input type="time">, no combination needed.

        const response = await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.json();

        if (result.status === "success") {
            form.reset();
            document.querySelectorAll('.form-panel').forEach(el => el.classList.remove('active'));
            document.getElementById('view-thanks').classList.add('active');
        } else { alert("Something went wrong. Please try again."); }
    } catch (error) { alert("Network error. Please check your connection."); } 
    finally { submitBtn.disabled = false; submitBtn.textContent = "Confirm Booking"; }
}